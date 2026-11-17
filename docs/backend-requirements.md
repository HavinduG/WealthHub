# WordPress backend: what to build for Insights, accounts and Insider membership

The Next.js site is finished and already calls the endpoints below. Until they
exist, the site degrades safely: log-in and sign-up show "isn't available yet",
and every paid article stays locked.

> **Ready-made:** sections 2–6 are implemented in the plugin
> `wordpress/wealthhub-membership.zip` (source in `wordpress/wealthhub-membership/`).
> Upload it under Plugins → Add New → Upload, activate it, then add the
> wp-config constants from its `readme.txt`. `WH_SHARED_SECRET` replaces
> `WH_REVALIDATE_SECRET` below and must equal `WORDPRESS_REVALIDATE_SECRET` in `.env`.

Everything runs **server to server** (Next.js server → WordPress). Browsers never
call WordPress directly, so no CORS setup is needed.

---

## 0. Urgent: paid article text is public today

`GET /wp-json/wp/v2/blog` returns the full `acf.blog_long_description` for **Paid**
articles to anyone. The website never shows it to non-members, but anyone can read
it straight from the API. Fix this first (section 4).

---

## 1. Plugins and config

1. Install **JWT Authentication for WP REST API** (by Enrique Chavez / Tmeister).
2. In `wp-config.php`:
   ```php
   define('JWT_AUTH_SECRET_KEY', 'long-random-string-at-least-64-chars');
   define('JWT_AUTH_CORS_ENABLE', false); // not needed, server-to-server only
   ```
3. Make sure the `Authorization` header reaches PHP.
   - Apache (`.htaccess`, above the WordPress rules):
     ```apache
     RewriteEngine on
     RewriteCond %{HTTP:Authorization} ^(.*)
     RewriteRule ^(.*) - [E=HTTP_AUTHORIZATION:%1]
     SetEnvIf Authorization "(.*)" HTTP_AUTHORIZATION=$1
     ```
   - nginx: `fastcgi_param HTTP_AUTHORIZATION $http_authorization;`
4. Stripe: create one Product ("Wealth Hub Insider") with two recurring Prices
   (monthly AED 49, yearly AED 490, placeholders from the design). Keep the secret
   key, both Price IDs and the webhook signing secret in `wp-config.php`, never in
   the database or the theme:
   ```php
   define('WH_STRIPE_SECRET_KEY', 'sk_live_...');
   define('WH_STRIPE_PRICE_MONTHLY', 'price_...');
   define('WH_STRIPE_PRICE_YEARLY', 'price_...');
   define('WH_STRIPE_WEBHOOK_SECRET', 'whsec_...');
   define('WH_SITE_URL', 'https://www.wealthhub.ae'); // the Next.js site
   ```

Already used as-is by the site: `POST /wp-json/jwt-auth/v1/token`
with `{ "username": "<email>", "password": "..." }` → `{ token, user_email, user_display_name }`.

---

## 2. Membership data (user meta)

Store on each WordPress user. Use the normal **Subscriber** role; don't create
admin-capable roles for members.

| Meta key | Example | Notes |
|---|---|---|
| `wh_membership_status` | `active` | Stripe subscription status: `active`, `trialing`, `past_due`, `canceled`, `none` |
| `wh_membership_plan` | `yearly` | `monthly` or `yearly` |
| `wh_current_period_end` | `2027-11-17T00:00:00Z` | ISO date |
| `wh_stripe_customer_id` | `cus_...` | Set at first checkout |
| `wh_newsletter` | `1` | From the sign-up checkbox |

A member is **active** when status is `active` or `trialing` and the period end is in the future.

---

## 3. Custom endpoints (namespace `wealthhub/v1`)

Put these in a small custom plugin (e.g. `wp-content/plugins/wealthhub-membership/`).

### 3.1 `POST /wealthhub/v1/register` (public)

Request:
```json
{ "name": "Ahmed Khan", "email": "ahmed@email.com", "password": "…", "newsletter": true, "terms_accepted": true }
```
- Validate again server-side: valid email, password ≥ 10 chars with a letter and a number, `terms_accepted === true`.
- Create the user with `wp_insert_user` and role `subscriber`. **Never** accept a role from the request.
- Rate-limit by IP (for example 5 sign-ups per hour).

Responses:
- `201 { "id": 123 }`
- `409 { "code": "email_exists", "message": "…" }` (the site shows "An account with this email already exists")
- `400 { "code": "invalid_input", "message": "<shown to the user>" }`

### 3.2 `GET /wealthhub/v1/me` (requires `Authorization: Bearer <JWT>`)

```json
{
  "id": 123,
  "name": "Ahmed Khan",
  "email": "ahmed@email.com",
  "membership": { "active": true, "plan": "yearly", "status": "active", "current_period_end": "2027-11-17T00:00:00Z" }
}
```
- `401` if there is no valid token. The site then logs the visitor out.

### 3.3 `POST /wealthhub/v1/checkout` (requires Bearer)

Request: `{ "plan": "monthly" | "yearly", "success_url": "…", "cancel_url": "…" }`

- **Only accept `success_url` and `cancel_url` that start with `WH_SITE_URL`.** Otherwise anyone could
  use your checkout to redirect people to another site.
- Create the Stripe customer if `wh_stripe_customer_id` is empty.
- Create a Checkout Session: `mode=subscription`, the chosen Price, `customer`, `client_reference_id = user ID`,
  `metadata.user_id = user ID`.
- Response: `200 { "url": "https://checkout.stripe.com/…" }`. The site only redirects to `*.stripe.com`.

### 3.4 `POST /wealthhub/v1/stripe-webhook` (called by Stripe)

- Verify the signature with `WH_STRIPE_WEBHOOK_SECRET` (`\Stripe\Webhook::constructEvent`). Reject anything unsigned.
- Handle:
  - `checkout.session.completed` → save the customer ID, set status/plan/period end
  - `customer.subscription.updated` and `customer.subscription.deleted` → update status/plan/period end
  - `invoice.payment_failed` → status `past_due`
- Return `200` quickly. Make it idempotent, because Stripe can send the same event twice.

### 3.5 Later (screen 06 "My account" in Figma, not built yet)

`POST /wealthhub/v1/billing-portal` → `{ url }` for Stripe's Customer Portal.

---

## 4. Lock paid content in the REST API (most important)

For `blog` posts with `free_or_paid` = `Paid`, only active members may receive the
full `blog_long_description`. Everyone else gets the first few blocks (the site
shows 3), so the preview still works.

```php
add_filter('rest_prepare_blog', function ($response, $post, $request) {
    $data = $response->get_data();
    if (!isset($data['acf']['free_or_paid']) || strtolower($data['acf']['free_or_paid']) === 'free') {
        return $response;
    }
    if (wh_is_active_member(get_current_user_id())) { // JWT plugin sets the current user from the Bearer token
        return $response;
    }
    $html = $data['acf']['blog_long_description'] ?? '';
    preg_match_all('/<(p|ol|ul|h[1-6]|blockquote)\b[^>]*>.*?<\/\1>/is', $html, $m);
    $data['acf']['blog_long_description'] = implode("\n", array_slice($m[0], 0, 3));
    $data['acf']['content_locked'] = true;
    $response->set_data($data);
    return $response;
}, 20, 3);

function wh_is_active_member($user_id) {
    if (!$user_id) return false;
    $status = get_user_meta($user_id, 'wh_membership_status', true);
    $end    = strtotime((string) get_user_meta($user_id, 'wh_current_period_end', true));
    return in_array($status, ['active', 'trialing'], true) && $end && $end > time();
}
```

Also close the other routes that expose the same field:
- **ACF to REST API** adds `/wp-json/acf/v3/blog/{id}`. Apply the same rule there
  (filter `acf/rest_api/blog/get_fields`) or disable that route for `blog`.
- Check `?_fields=acf.blog_long_description` and `?context=embed` too. The filter above
  covers them because it changes the response data.
- The site requests full text **as the member** (Bearer token, no cache) with
  `GET /wp/v2/blog?slug=<slug>&_fields=acf.blog_long_description`, so the filter above is all it needs.

---

## 5. Instant content updates (optional, recommended)

When a blog post or the Home page is saved, tell the site to refresh its cache:

```php
add_action('save_post', function ($post_id, $post) {
    if (wp_is_post_revision($post_id) || $post->post_status !== 'publish') return;
    wp_remote_post(WH_SITE_URL . '/api/revalidate', [
        'headers'  => ['Content-Type' => 'application/json', 'x-revalidate-secret' => WH_REVALIDATE_SECRET],
        'body'     => wp_json_encode(['tags' => [$post->post_type === 'blog' ? 'wp:blog' : 'wp']]),
        'timeout'  => 5,
        'blocking' => false,
    ]);
}, 10, 2);
```
`WH_REVALIDATE_SECRET` must equal `WORDPRESS_REVALIDATE_SECRET` in the site's `.env`.

---

## 6. Security checklist

- [ ] HTTPS on WordPress in production. Tokens and passwords cross this connection.
- [ ] Limit log-in attempts on `/jwt-auth/v1/token` (e.g. *Limit Login Attempts Reloaded*, which hooks `wp_authenticate`).
- [ ] Strong `JWT_AUTH_SECRET_KEY`. Default token lifetime is 7 days (`jwt_auth_expire` filter); the site's session matches it.
- [ ] Stop user enumeration: restrict `GET /wp-json/wp/v2/users` to logged-in editors.
- [ ] Sign-up rate limit (3.1) and `success_url` / `cancel_url` allowlist (3.3).
- [ ] Verify Stripe webhook signatures (3.4).
- [ ] **Review the WP File Manager backup routes** that are currently public:
      `/wp-json/v1/fm/backup/…`. If that plugin isn't needed on the live site, remove it.
- [ ] Password reset: the site links to WordPress's own "Lost password" page
      (`/wp-login.php?action=lostpassword`). Make sure that page is reachable, or ask
      for a custom reset flow on the site.

---

## 7. What the Next.js site already does (for reference)

- **Session:** encrypted (AES-256-GCM), httpOnly, `Secure` in production, `SameSite=Lax`.
  The browser can't read it and it can't be forged without `SESSION_SECRET`.
- **WordPress token:** lives only inside that cookie and is never sent to browser JavaScript.
- **Membership:** re-checked with `/wealthhub/v1/me` on every request that needs it, so a
  cancellation takes effect immediately.
- **Paid articles:** the server only ever sends the preview to non-members, and the full
  text is fetched per member and never cached.
- **Forms:** validated on the server (zod). Log-in errors don't reveal whether an email
  is registered. Redirects after log-in are same-site paths only.
- **Not indexed:** `/login` and `/register` are excluded from search engines.
