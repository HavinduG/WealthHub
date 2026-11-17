<?php
/**
 * Plugin Name:       Wealth Hub Membership
 * Description:       Accounts, Insider membership (Stripe) and paid-article locking for the Wealth Hub Next.js site.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            Wealth Hub
 * License:           GPL-2.0-or-later
 *
 * Requires the "JWT Authentication for WP REST API" plugin for log-in.
 * Configuration lives in wp-config.php (see readme.txt), never in the database.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('WH_MEMBERSHIP_VERSION', '1.0.0');
define('WH_STRIPE_API_VERSION', '2024-06-20');

/* -------------------------------------------------------------------------
 * Config helpers
 * ---------------------------------------------------------------------- */

function wh_config($name) {
    return defined($name) ? (string) constant($name) : '';
}

function wh_stripe_ready() {
    return wh_config('WH_STRIPE_SECRET_KEY') !== ''
        && wh_config('WH_STRIPE_PRICE_MONTHLY') !== ''
        && wh_config('WH_STRIPE_PRICE_YEARLY') !== '';
}

/**
 * The visitor's IP. The Next.js server calls WordPress on the visitor's behalf,
 * so it forwards their IP in X-WH-Client-IP. That header is only trusted when it
 * comes with the shared secret; otherwise anyone could fake their IP.
 *
 * @return array{0:string,1:bool} [ip, forwarded_by_trusted_site]
 */
function wh_client_ip() {
    $secret    = wh_config('WH_SHARED_SECRET');
    $forwarded = isset($_SERVER['HTTP_X_WH_CLIENT_IP']) ? trim((string) $_SERVER['HTTP_X_WH_CLIENT_IP']) : '';
    $given     = isset($_SERVER['HTTP_X_WH_SECRET']) ? (string) $_SERVER['HTTP_X_WH_SECRET'] : '';

    if ($secret !== '' && $forwarded !== '' && hash_equals($secret, $given) && filter_var($forwarded, FILTER_VALIDATE_IP)) {
        return [$forwarded, true];
    }
    $remote = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
    return [$remote, false];
}

/* -------------------------------------------------------------------------
 * Rate limiting (transients)
 * ---------------------------------------------------------------------- */

function wh_rate_key($bucket, $id) {
    return 'wh_rl_' . $bucket . '_' . md5(strtolower((string) $id));
}

function wh_rate_count($bucket, $id) {
    return (int) get_transient(wh_rate_key($bucket, $id));
}

function wh_rate_hit($bucket, $id, $window) {
    $key   = wh_rate_key($bucket, $id);
    $count = (int) get_transient($key) + 1;
    set_transient($key, $count, $window);
    return $count;
}

function wh_rate_clear($bucket, $id) {
    delete_transient(wh_rate_key($bucket, $id));
}

/* -------------------------------------------------------------------------
 * Membership data
 * ---------------------------------------------------------------------- */

const WH_ACTIVE_STATUSES = ['active', 'trialing'];

function wh_membership($user_id) {
    $status = (string) get_user_meta($user_id, 'wh_membership_status', true);
    $plan   = (string) get_user_meta($user_id, 'wh_membership_plan', true);
    $end    = (string) get_user_meta($user_id, 'wh_current_period_end', true);
    $end_ts = $end !== '' ? strtotime($end) : false;

    return [
        'active'             => in_array($status, WH_ACTIVE_STATUSES, true) && $end_ts && $end_ts > time(),
        'plan'               => in_array($plan, ['monthly', 'yearly'], true) ? $plan : null,
        'status'             => $status !== '' ? $status : 'none',
        'current_period_end' => $end_ts ? gmdate('Y-m-d\TH:i:s\Z', $end_ts) : null,
    ];
}

function wh_is_active_member($user_id) {
    return $user_id ? wh_membership($user_id)['active'] : false;
}

/* -------------------------------------------------------------------------
 * REST routes: /wp-json/wealthhub/v1/*
 * ---------------------------------------------------------------------- */

add_action('rest_api_init', function () {
    register_rest_route('wealthhub/v1', '/register', [
        'methods'             => 'POST',
        'callback'            => 'wh_rest_register',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('wealthhub/v1', '/me', [
        'methods'             => 'GET',
        'callback'            => 'wh_rest_me',
        'permission_callback' => 'wh_require_login',
    ]);
    register_rest_route('wealthhub/v1', '/checkout', [
        'methods'             => 'POST',
        'callback'            => 'wh_rest_checkout',
        'permission_callback' => 'wh_require_login',
    ]);
    register_rest_route('wealthhub/v1', '/stripe-webhook', [
        'methods'             => 'POST',
        'callback'            => 'wh_rest_stripe_webhook',
        'permission_callback' => '__return_true', // Authenticated by the Stripe signature instead.
    ]);
});

function wh_require_login() {
    return is_user_logged_in()
        ? true
        : new WP_Error('rest_not_logged_in', 'You are not logged in.', ['status' => 401]);
}

function wh_error($code, $message, $status) {
    return new WP_Error($code, $message, ['status' => $status]);
}

/** POST /register: { name, email, password, newsletter, terms_accepted } */
function wh_rest_register(WP_REST_Request $request) {
    [$ip, $trusted] = wh_client_ip();
    // 5 sign-ups per visitor IP per hour. If the site isn't forwarding IPs (no
    // shared secret), every request shares the site server's IP, so allow more.
    $limit = $trusted ? 5 : 50;
    if (wh_rate_count('register', $ip) >= $limit) {
        return wh_error('too_many_requests', 'Too many sign-ups from your network. Please try again in an hour.', 429);
    }

    $name     = trim(sanitize_text_field((string) $request->get_param('name')));
    $email    = trim(strtolower(sanitize_email((string) $request->get_param('email'))));
    $password = (string) $request->get_param('password');
    $terms    = $request->get_param('terms_accepted') === true;

    if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
        return wh_error('invalid_input', 'Please enter your full name.', 400);
    }
    if (!is_email($email)) {
        return wh_error('invalid_input', 'Please enter a valid email address.', 400);
    }
    if (strlen($password) < 10 || strlen($password) > 200 || !preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
        return wh_error('invalid_input', 'Use at least 10 characters with a letter and a number.', 400);
    }
    if (!$terms) {
        return wh_error('invalid_input', 'Please accept the terms to continue.', 400);
    }

    wh_rate_hit('register', $ip, HOUR_IN_SECONDS);

    if (email_exists($email)) {
        return wh_error('email_exists', 'An account with this email already exists.', 409);
    }

    $parts = preg_split('/\s+/', $name, 2);
    $user_id = wp_insert_user([
        'user_login'   => wh_unique_login($email),
        'user_email'   => $email,
        'user_pass'    => $password,
        'display_name' => $name,
        'nickname'     => $name,
        'first_name'   => $parts[0] ?? '',
        'last_name'    => $parts[1] ?? '',
        'role'         => 'subscriber', // Never taken from the request.
    ]);

    if (is_wp_error($user_id)) {
        if ($user_id->get_error_code() === 'existing_user_email') {
            return wh_error('email_exists', 'An account with this email already exists.', 409);
        }
        return wh_error('invalid_input', 'We couldn’t create your account. Please check your details.', 400);
    }

    update_user_meta($user_id, 'wh_newsletter', $request->get_param('newsletter') === true ? '1' : '0');
    update_user_meta($user_id, 'wh_terms_accepted_at', gmdate('Y-m-d\TH:i:s\Z'));
    update_user_meta($user_id, 'wh_membership_status', 'none');

    return new WP_REST_Response(['id' => (int) $user_id], 201);
}

/** A login name from the email's local part (members log in with their email). */
function wh_unique_login($email) {
    $base = sanitize_user(strtolower(strtok($email, '@')), true);
    $base = $base !== '' ? substr($base, 0, 40) : 'member';
    $login = $base;
    while (username_exists($login)) {
        $login = $base . '-' . wp_rand(1000, 999999);
    }
    return $login;
}

/** GET /me (Bearer token) */
function wh_rest_me() {
    $user = wp_get_current_user();
    $response = new WP_REST_Response([
        'id'         => (int) $user->ID,
        'name'       => $user->display_name,
        'email'      => $user->user_email,
        'membership' => wh_membership($user->ID),
    ]);
    $response->header('Cache-Control', 'private, no-store');
    return $response;
}

/** POST /checkout (Bearer token): { plan, success_url, cancel_url } -> { url } */
function wh_rest_checkout(WP_REST_Request $request) {
    if (!wh_stripe_ready()) {
        return wh_error('payments_not_configured', 'Online payment isn’t connected yet. Please contact us to subscribe.', 503);
    }

    $user = wp_get_current_user();
    if (wh_is_active_member($user->ID)) {
        return wh_error('already_member', 'You’re already an Insider member.', 409);
    }

    $plan = (string) $request->get_param('plan');
    if (!in_array($plan, ['monthly', 'yearly'], true)) {
        return wh_error('invalid_input', 'Choose a plan.', 400);
    }

    $success = (string) $request->get_param('success_url');
    $cancel  = (string) $request->get_param('cancel_url');
    if (!wh_is_site_url($success) || !wh_is_site_url($cancel)) {
        return wh_error('invalid_input', 'Invalid return address.', 400);
    }

    $customer = (string) get_user_meta($user->ID, 'wh_stripe_customer_id', true);
    if ($customer === '') {
        $created = wh_stripe('POST', 'customers', [
            'email'    => $user->user_email,
            'name'     => $user->display_name,
            'metadata' => ['user_id' => $user->ID],
        ]);
        if (is_wp_error($created)) {
            return wh_error('stripe_error', 'We couldn’t start checkout. Please try again.', 502);
        }
        $customer = $created['id'];
        update_user_meta($user->ID, 'wh_stripe_customer_id', $customer);
    }

    $session = wh_stripe('POST', 'checkout/sessions', [
        'mode'                => 'subscription',
        'customer'            => $customer,
        'client_reference_id' => (string) $user->ID,
        'line_items'          => [[
            'price'    => $plan === 'yearly' ? wh_config('WH_STRIPE_PRICE_YEARLY') : wh_config('WH_STRIPE_PRICE_MONTHLY'),
            'quantity' => 1,
        ]],
        'success_url'         => $success,
        'cancel_url'          => $cancel,
        'metadata'            => ['user_id' => $user->ID, 'plan' => $plan],
        'subscription_data'   => ['metadata' => ['user_id' => $user->ID, 'plan' => $plan]],
    ]);
    if (is_wp_error($session) || empty($session['url'])) {
        return wh_error('stripe_error', 'We couldn’t start checkout. Please try again.', 502);
    }

    return new WP_REST_Response(['url' => $session['url']], 200);
}

/** Same scheme, host and port as WH_SITE_URL (blocks look-alikes such as site.com.evil.com). */
function wh_is_site_url($url) {
    $site = wp_parse_url(wh_config('WH_SITE_URL'));
    $test = wp_parse_url($url);
    if (!$site || !$test || empty($site['host']) || empty($test['host'])) {
        return false;
    }
    return strtolower($site['scheme'] ?? '') === strtolower($test['scheme'] ?? '')
        && strtolower($site['host']) === strtolower($test['host'])
        && ($site['port'] ?? null) === ($test['port'] ?? null);
}

/* -------------------------------------------------------------------------
 * Stripe
 * ---------------------------------------------------------------------- */

/** Calls the Stripe API (no SDK needed). Returns the decoded body or WP_Error. */
function wh_stripe($method, $path, $params = []) {
    $args = [
        'method'  => $method,
        'timeout' => 20,
        'headers' => [
            'Authorization'  => 'Bearer ' . wh_config('WH_STRIPE_SECRET_KEY'),
            'Stripe-Version' => WH_STRIPE_API_VERSION,
        ],
    ];
    $url = 'https://api.stripe.com/v1/' . $path;
    if ($method === 'GET') {
        $url = $params ? add_query_arg(urlencode_deep($params), $url) : $url;
    } else {
        $args['headers']['Content-Type'] = 'application/x-www-form-urlencoded';
        $args['body'] = http_build_query($params, '', '&');
    }

    $response = wp_remote_request($url, $args);
    if (is_wp_error($response)) {
        return $response;
    }
    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);
    if ($code >= 400 || !is_array($body)) {
        $message = is_array($body) && isset($body['error']['message']) ? $body['error']['message'] : 'Stripe request failed';
        error_log('[wealthhub-membership] Stripe ' . $path . ': ' . $message);
        return new WP_Error('stripe_error', $message, ['status' => $code]);
    }
    return $body;
}

/** Verifies the Stripe-Signature header (v1 scheme, 5 minute tolerance). */
function wh_stripe_signature_valid($payload, $header, $secret, $tolerance = 300) {
    if ($secret === '' || $header === '') {
        return false;
    }
    $timestamp  = null;
    $signatures = [];
    foreach (explode(',', $header) as $part) {
        $pair = explode('=', trim($part), 2);
        if (count($pair) !== 2) {
            continue;
        }
        if ($pair[0] === 't') {
            $timestamp = (int) $pair[1];
        } elseif ($pair[0] === 'v1') {
            $signatures[] = $pair[1];
        }
    }
    if (!$timestamp || !$signatures || abs(time() - $timestamp) > $tolerance) {
        return false;
    }
    $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, $signature)) {
            return true;
        }
    }
    return false;
}

/** POST /stripe-webhook (called by Stripe) */
function wh_rest_stripe_webhook(WP_REST_Request $request) {
    $payload = $request->get_body();
    $header  = (string) $request->get_header('stripe_signature');

    if (!wh_stripe_signature_valid($payload, $header, wh_config('WH_STRIPE_WEBHOOK_SECRET'))) {
        return wh_error('invalid_signature', 'Invalid signature.', 400);
    }

    $event = json_decode($payload, true);
    if (!is_array($event) || empty($event['id']) || empty($event['type'])) {
        return wh_error('invalid_payload', 'Invalid payload.', 400);
    }

    // Stripe may send the same event more than once.
    $seen_key = 'wh_evt_' . md5($event['id']);
    if (get_transient($seen_key)) {
        return new WP_REST_Response(['received' => true, 'duplicate' => true], 200);
    }

    $object = $event['data']['object'] ?? [];
    $result = true;

    switch ($event['type']) {
        case 'checkout.session.completed':
            $user_id = (int) ($object['client_reference_id'] ?? ($object['metadata']['user_id'] ?? 0));
            if ($user_id && get_userdata($user_id) && !empty($object['customer'])) {
                update_user_meta($user_id, 'wh_stripe_customer_id', sanitize_text_field($object['customer']));
            }
            if (!empty($object['subscription'])) {
                $result = wh_sync_subscription($object['subscription'], $user_id);
            }
            break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
        case 'customer.subscription.paused':
        case 'customer.subscription.resumed':
            $result = wh_sync_subscription($object['id'] ?? '', 0);
            break;

        case 'invoice.paid':
        case 'invoice.payment_failed':
            // Older API versions: invoice.subscription. Newer: invoice.parent.subscription_details.subscription.
            $subscription = $object['subscription'] ?? ($object['parent']['subscription_details']['subscription'] ?? '');
            if ($subscription) {
                $result = wh_sync_subscription($subscription, 0);
            }
            break;
    }

    if (is_wp_error($result)) {
        // Non-2xx makes Stripe retry later.
        return wh_error('sync_failed', $result->get_error_message(), 500);
    }

    set_transient($seen_key, 1, 7 * DAY_IN_SECONDS);
    return new WP_REST_Response(['received' => true], 200);
}

/**
 * Re-reads the subscription from Stripe and stores its current state on the user.
 * Reading fresh state (instead of trusting event order) keeps this idempotent.
 */
function wh_sync_subscription($subscription_id, $user_id) {
    if (!is_string($subscription_id) || $subscription_id === '') {
        return true;
    }
    $sub = wh_stripe('GET', 'subscriptions/' . rawurlencode($subscription_id));
    if (is_wp_error($sub)) {
        return $sub;
    }

    if (!$user_id && !empty($sub['metadata']['user_id'])) {
        $user_id = (int) $sub['metadata']['user_id'];
    }
    if ((!$user_id || !get_userdata($user_id)) && !empty($sub['customer'])) {
        $found = get_users([
            'meta_key'   => 'wh_stripe_customer_id',
            'meta_value' => $sub['customer'],
            'number'     => 1,
            'fields'     => 'ID',
        ]);
        $user_id = $found ? (int) $found[0] : 0;
    }
    if (!$user_id || !get_userdata($user_id)) {
        error_log('[wealthhub-membership] No user for subscription ' . $subscription_id);
        return true; // Nothing to update; don't make Stripe retry forever.
    }

    $status = sanitize_key($sub['status'] ?? 'none');

    // Don't let an old, ended subscription overwrite a newer active one.
    $current_sub = (string) get_user_meta($user_id, 'wh_stripe_subscription_id', true);
    if ($current_sub !== '' && $current_sub !== $sub['id'] && !in_array($status, WH_ACTIVE_STATUSES, true) && wh_is_active_member($user_id)) {
        return true;
    }

    $item     = $sub['items']['data'][0] ?? [];
    $interval = $item['price']['recurring']['interval'] ?? '';
    $plan     = $interval === 'year' ? 'yearly' : ($interval === 'month' ? 'monthly' : (string) ($sub['metadata']['plan'] ?? ''));
    $end      = (int) ($sub['current_period_end'] ?? ($item['current_period_end'] ?? 0));

    update_user_meta($user_id, 'wh_stripe_subscription_id', sanitize_text_field($sub['id']));
    update_user_meta($user_id, 'wh_membership_status', $status);
    if (in_array($plan, ['monthly', 'yearly'], true)) {
        update_user_meta($user_id, 'wh_membership_plan', $plan);
    }
    if ($end) {
        update_user_meta($user_id, 'wh_current_period_end', gmdate('Y-m-d\TH:i:s\Z', $end));
    }
    if (!empty($sub['customer']) && is_string($sub['customer'])) {
        update_user_meta($user_id, 'wh_stripe_customer_id', sanitize_text_field($sub['customer']));
    }
    return true;
}

/* -------------------------------------------------------------------------
 * Lock paid articles in the REST API
 * ---------------------------------------------------------------------- */

/** Anything not explicitly "Free" is treated as paid (fail closed). */
function wh_blog_is_paid($post_id) {
    $value = function_exists('get_field') ? get_field('free_or_paid', $post_id, false) : get_post_meta($post_id, 'free_or_paid', true);
    if (is_array($value)) {
        $value = $value['value'] ?? reset($value);
    }
    return strtolower(trim((string) $value)) !== 'free';
}

function wh_can_read_full($post_id) {
    $user_id = get_current_user_id();
    return $user_id && (wh_is_active_member($user_id) || current_user_can('edit_post', $post_id));
}

/** The first $blocks top-level blocks of an HTML string (the site shows 3). */
function wh_preview_html($html, $blocks = 3) {
    $html = (string) $html;
    if (trim($html) === '') {
        return '';
    }
    $previous = libxml_use_internal_errors(true);
    $doc = new DOMDocument();
    $doc->loadHTML('<?xml encoding="UTF-8"><div>' . $html . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    libxml_use_internal_errors($previous);

    $root = $doc->documentElement;
    if (!$root) {
        return '';
    }
    $out   = '';
    $count = 0;
    foreach ($root->childNodes as $node) {
        if ($node->nodeType === XML_ELEMENT_NODE) {
            $out .= $doc->saveHTML($node);
        } elseif ($node->nodeType === XML_TEXT_NODE && trim($node->textContent) !== '') {
            $out .= '<p>' . esc_html(trim($node->textContent)) . '</p>';
        } else {
            continue;
        }
        if (++$count >= $blocks) {
            break;
        }
    }
    return $out;
}

add_filter('rest_prepare_blog', function ($response, $post, $request) {
    if (!wh_blog_is_paid($post->ID) || wh_can_read_full($post->ID)) {
        return $response;
    }
    $data = $response->get_data();
    if (isset($data['acf']) && is_array($data['acf']) && isset($data['acf']['blog_long_description'])) {
        $data['acf']['blog_long_description'] = wh_preview_html($data['acf']['blog_long_description']);
    }
    if (isset($data['content']['rendered']) && $data['content']['rendered'] !== '') {
        $data['content']['rendered'] = wh_preview_html($data['content']['rendered']);
    }
    $data['content_locked'] = true;
    $response->set_data($data);
    $response->header('Cache-Control', 'private, no-store');
    return $response;
}, 99, 3);

// ACF to REST API's own /acf/v3/blog routes aren't used by the site: editors only.
$wh_acf_blog_permission = function ($allowed, $request, $type) {
    return $type === 'blog' ? current_user_can('edit_posts') : $allowed;
};
add_filter('acf/rest_api/item_permissions/get', $wh_acf_blog_permission, 99, 3);
add_filter('acf/rest_api/items_permissions/get', $wh_acf_blog_permission, 99, 3);

/* -------------------------------------------------------------------------
 * Log-in protection (also covers /jwt-auth/v1/token, which uses wp_authenticate)
 * ---------------------------------------------------------------------- */

const WH_LOGIN_MAX_PER_EMAIL = 5;
const WH_LOGIN_MAX_PER_IP    = 20;
const WH_LOGIN_WINDOW        = 900; // 15 minutes

function wh_login_ip_limited() {
    [$ip, $trusted] = wh_client_ip();
    // REST log-ins come from the site's server; only count per IP when the real
    // visitor IP is known, so one attacker can't lock out every visitor.
    $applies = $trusted || !(defined('REST_REQUEST') && REST_REQUEST);
    return [$ip, $applies];
}

add_filter('authenticate', function ($user, $username) {
    $username = strtolower(trim((string) $username));
    if ($username === '') {
        return $user;
    }
    [$ip, $ip_applies] = wh_login_ip_limited();
    $locked = wh_rate_count('login_user', $username) >= WH_LOGIN_MAX_PER_EMAIL
        || ($ip_applies && wh_rate_count('login_ip', $ip) >= WH_LOGIN_MAX_PER_IP);

    if ($locked) {
        return new WP_Error('too_many_attempts', 'Too many log-in attempts. Please wait 15 minutes and try again.');
    }
    if ($user instanceof WP_User) {
        wh_rate_clear('login_user', $username);
    }
    return $user;
}, 99, 2);

add_action('wp_login_failed', function ($username) {
    $username = strtolower(trim((string) $username));
    if ($username !== '') {
        wh_rate_hit('login_user', $username, WH_LOGIN_WINDOW);
    }
    [$ip, $ip_applies] = wh_login_ip_limited();
    if ($ip_applies) {
        wh_rate_hit('login_ip', $ip, WH_LOGIN_WINDOW);
    }
});

/* -------------------------------------------------------------------------
 * Stop user enumeration through the REST API
 * ---------------------------------------------------------------------- */

add_filter('rest_pre_dispatch', function ($result, $server, $request) {
    if ($result !== null) {
        return $result;
    }
    if (strpos($request->get_route(), '/wp/v2/users') === 0 && !is_user_logged_in()) {
        return wh_error('rest_not_logged_in', 'You are not logged in.', 401);
    }
    return $result;
}, 10, 3);

/* -------------------------------------------------------------------------
 * Tell the Next.js site to refresh its cache when content changes
 * ---------------------------------------------------------------------- */

function wh_revalidate_site($tags) {
    $site   = rtrim(wh_config('WH_SITE_URL'), '/');
    $secret = wh_config('WH_SHARED_SECRET');
    if ($site === '' || $secret === '') {
        return;
    }
    wp_remote_post($site . '/api/revalidate', [
        'headers'  => ['Content-Type' => 'application/json', 'x-revalidate-secret' => $secret],
        'body'     => wp_json_encode(['tags' => $tags]),
        'timeout'  => 5,
        'blocking' => false,
    ]);
}

add_action('save_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id) || $post->post_status === 'auto-draft') {
        return;
    }
    // "wp" refreshes everything the site fetched from WordPress.
    wh_revalidate_site($post->post_type === 'blog' ? ['wp:blog'] : ['wp']);
}, 10, 2);

add_action('acf/save_post', function ($post_id) {
    if (is_string($post_id) && strpos($post_id, 'options') === 0) {
        wh_revalidate_site(['wp']);
    }
}, 20);

/* -------------------------------------------------------------------------
 * Admin: see and edit a user's membership (handy for testing without Stripe)
 * ---------------------------------------------------------------------- */

function wh_membership_profile_fields($user) {
    if (!current_user_can('edit_users')) {
        return;
    }
    $m      = wh_membership($user->ID);
    $end    = (string) get_user_meta($user->ID, 'wh_current_period_end', true);
    $date   = $end !== '' && strtotime($end) ? gmdate('Y-m-d', strtotime($end)) : '';
    $status = (string) get_user_meta($user->ID, 'wh_membership_status', true);
    $plan   = (string) get_user_meta($user->ID, 'wh_membership_plan', true);
    wp_nonce_field('wh_membership_save', 'wh_membership_nonce');
    ?>
    <h2>Wealth Hub membership</h2>
    <table class="form-table" role="presentation">
        <tr>
            <th>Access</th>
            <td><strong><?php echo $m['active'] ? 'Active Insider member' : 'Not a member'; ?></strong>
                <p class="description">Updated automatically by Stripe. Change it here only to test or to give free access.</p></td>
        </tr>
        <tr>
            <th><label for="wh_membership_status">Status</label></th>
            <td><select name="wh_membership_status" id="wh_membership_status">
                <?php foreach (['none', 'active', 'trialing', 'past_due', 'canceled'] as $option) : ?>
                    <option value="<?php echo esc_attr($option); ?>" <?php selected($status ?: 'none', $option); ?>><?php echo esc_html($option); ?></option>
                <?php endforeach; ?>
            </select></td>
        </tr>
        <tr>
            <th><label for="wh_membership_plan">Plan</label></th>
            <td><select name="wh_membership_plan" id="wh_membership_plan">
                <option value="" <?php selected($plan, ''); ?>>—</option>
                <option value="monthly" <?php selected($plan, 'monthly'); ?>>monthly</option>
                <option value="yearly" <?php selected($plan, 'yearly'); ?>>yearly</option>
            </select></td>
        </tr>
        <tr>
            <th><label for="wh_current_period_end">Access until</label></th>
            <td><input type="date" name="wh_current_period_end" id="wh_current_period_end" value="<?php echo esc_attr($date); ?>"></td>
        </tr>
        <tr>
            <th>Stripe customer</th>
            <td><code><?php echo esc_html((string) get_user_meta($user->ID, 'wh_stripe_customer_id', true) ?: '—'); ?></code></td>
        </tr>
        <tr>
            <th>Newsletter</th>
            <td><?php echo get_user_meta($user->ID, 'wh_newsletter', true) === '1' ? 'Yes' : 'No'; ?></td>
        </tr>
    </table>
    <?php
}
add_action('show_user_profile', 'wh_membership_profile_fields');
add_action('edit_user_profile', 'wh_membership_profile_fields');

function wh_membership_profile_save($user_id) {
    if (!current_user_can('edit_users') || !isset($_POST['wh_membership_nonce'])
        || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['wh_membership_nonce'])), 'wh_membership_save')) {
        return;
    }
    $status = sanitize_key(wp_unslash($_POST['wh_membership_status'] ?? 'none'));
    if (in_array($status, ['none', 'active', 'trialing', 'past_due', 'canceled'], true)) {
        update_user_meta($user_id, 'wh_membership_status', $status);
    }
    $plan = sanitize_key(wp_unslash($_POST['wh_membership_plan'] ?? ''));
    update_user_meta($user_id, 'wh_membership_plan', in_array($plan, ['monthly', 'yearly'], true) ? $plan : '');

    $date = sanitize_text_field(wp_unslash($_POST['wh_current_period_end'] ?? ''));
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        update_user_meta($user_id, 'wh_current_period_end', $date . 'T23:59:59Z');
    } elseif ($date === '') {
        delete_user_meta($user_id, 'wh_current_period_end');
    }
}
add_action('personal_options_update', 'wh_membership_profile_save');
add_action('edit_user_profile_update', 'wh_membership_profile_save');

/** "Membership" column on Users. */
add_filter('manage_users_columns', function ($columns) {
    $columns['wh_membership'] = 'Membership';
    return $columns;
});
add_filter('manage_users_custom_column', function ($output, $column, $user_id) {
    if ($column !== 'wh_membership') {
        return $output;
    }
    $m = wh_membership($user_id);
    if ($m['active']) {
        return esc_html('Insider · ' . ($m['plan'] ?: '—') . ' · until ' . gmdate('j M Y', strtotime($m['current_period_end'])));
    }
    return esc_html($m['status'] === 'none' ? '—' : $m['status']);
}, 10, 3);

/* -------------------------------------------------------------------------
 * Settings check on the Plugins screen
 * ---------------------------------------------------------------------- */

add_action('admin_notices', function () {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->id !== 'plugins' || !current_user_can('activate_plugins')) {
        return;
    }
    $missing = [];
    if (!class_exists('Jwt_Auth') && !defined('JWT_AUTH_SECRET_KEY')) {
        $missing[] = 'JWT Authentication for WP REST API plugin';
    }
    foreach (['WH_SITE_URL', 'WH_SHARED_SECRET', 'WH_STRIPE_SECRET_KEY', 'WH_STRIPE_PRICE_MONTHLY', 'WH_STRIPE_PRICE_YEARLY', 'WH_STRIPE_WEBHOOK_SECRET'] as $constant) {
        if (wh_config($constant) === '') {
            $missing[] = $constant;
        }
    }
    if ($missing) {
        echo '<div class="notice notice-warning"><p><strong>Wealth Hub Membership:</strong> still needs ' . esc_html(implode(', ', $missing)) . ' in wp-config.php. Until then, payment is switched off (accounts and article locking already work).</p></div>';
    }
});
