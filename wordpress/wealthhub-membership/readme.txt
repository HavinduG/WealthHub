=== Wealth Hub Membership ===

Accounts, Insider membership (Stripe) and paid-article locking for the
Wealth Hub Next.js site.

== What it adds ==

* POST /wp-json/wealthhub/v1/register        create a member (Subscriber role)
* GET  /wp-json/wealthhub/v1/me              the logged-in member + membership (JWT)
* POST /wp-json/wealthhub/v1/checkout        Stripe Checkout link (JWT)
* POST /wp-json/wealthhub/v1/stripe-webhook  keeps membership in sync with Stripe
* Paid "blog" posts: non-members only get the first 3 blocks of
  blog_long_description from the REST API. /acf/v3/blog is editors-only.
* Log-in limits: 5 failed tries per email / 20 per visitor IP per 15 minutes
  (covers /jwt-auth/v1/token and wp-login.php). Sign-ups: 5 per IP per hour.
* /wp/v2/users is closed to logged-out visitors (stops user enumeration).
* Users > Edit user > "Wealth Hub membership": view or set membership by hand.
* Tells the Next.js site to refresh its cache when you save content.

== Needs ==

* JWT Authentication for WP REST API (already installed).

== wp-config.php ==

Add above the line "That's all, stop editing!":

    // Wealth Hub site (Next.js)
    define('WH_SITE_URL', 'http://localhost:3000');          // live: https://your-domain
    define('WH_SHARED_SECRET', 'same value as WORDPRESS_REVALIDATE_SECRET in the site .env');

    // Stripe (leave out until you have them; payment stays switched off)
    define('WH_STRIPE_SECRET_KEY', 'sk_test_...');
    define('WH_STRIPE_PRICE_MONTHLY', 'price_...');
    define('WH_STRIPE_PRICE_YEARLY', 'price_...');
    define('WH_STRIPE_WEBHOOK_SECRET', 'whsec_...');

== Stripe webhook events ==

checkout.session.completed, customer.subscription.created,
customer.subscription.updated, customer.subscription.deleted,
invoice.paid, invoice.payment_failed

Endpoint: https://<wordpress-domain>/wp-json/wealthhub/v1/stripe-webhook
Local testing: stripe listen --forward-to http://wealthhub.local/wp-json/wealthhub/v1/stripe-webhook
