# CIPL Corporate Website & Portals

React + Vite corporate site with Supabase-backed admin/client portals and a Three.js warehouse viewer.

## Setup

1. Copy `.env.example` to `.env` and add the project URL and publishable key.
2. Run `supabase/schema.sql` in the Supabase SQL editor. The script is safe to re-run when applying the included policy and rate-limit updates.
3. Create the fixed admin user in Supabase Authentication, then run the final commented SQL line in `schema.sql` with that email to assign the immutable `admin` app role.
4. Set `ALLOWED_ORIGINS` for the deployed Edge Functions to the comma-separated production site origins. Set `INQUIRY_RATE_LIMIT_SALT` to a long random secret. See `supabase/.env.example` for the format.
5. Deploy all functions:

   ```sh
   supabase functions deploy admin-create-client
   supabase functions deploy admin-delete-client
   supabase functions deploy submit-inquiry
   ```

6. Install and run: `pnpm install` then `pnpm dev`.

Client usernames are converted internally to `<username>@cipl.lk`. New client passwords must contain at least 12 characters. The service-role key is available only inside Edge Functions. All file buckets are private and files are opened through short-lived signed URLs.

## Security and deployment

- Public inquiry writes are accepted only through `submit-inquiry`; the public Supabase key cannot insert directly into the table.
- Inquiry submissions are limited to five per browser/network fingerprint every 15 minutes.
- Admin functions verify the authenticated user's immutable `app_metadata.role` before using service-role privileges.
- Vercel calls `/api/supabase-health` once daily using the Production-only `CRON_SECRET`. The endpoint performs one read-only, RLS-protected database query and never returns row data.
- `vercel.json` adds SPA fallbacks, long-lived static asset caching, and production security headers. If deploying somewhere other than Vercel, mirror those headers and route all application paths to `index.html`.
- Keep `.env`, `CRON_SECRET`, the service-role key, and the rate-limit salt out of source control. Only variables prefixed with `VITE_` are bundled into the browser.

## Verification

Run `pnpm test`, `pnpm lint`, and `pnpm build` before deployment. Test `/`, `/client`, and `/admin` as direct URLs after deployment to confirm the SPA fallback and security headers are active.

## Frontend performance

- The hero uses responsive AVIF images with WebP fallbacks at 800, 1600, 2400 and 3200 pixels. Keep image masters and one-off processing scripts outside the repository.
- Decorative photos load near their sections. Public photo URLs carry a version query; update it when replacing cached photos. Gallery versions live in `src/lib/clientProjects.js`.
- Scroll surfaces subscribe only near the viewport and honor live reduced-motion preferences. Satellite images pan and zoom with fixed dimensions and transforms.
- Inquiry fields keep their state in a separate component. The database client loads when the form receives focus or submits.
- The 3D viewer loads only for an available model near the viewport. Continuous rendering stops offscreen and under reduced motion; projects without a model use a lightweight empty state.
