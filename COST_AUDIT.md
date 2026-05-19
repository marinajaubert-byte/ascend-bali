# Namecheap Cost Audit — May 2026

## Current service stack

| Service | Provider | Plan | Monthly cost |
|---|---|---|---|
| Website hosting | Vercel | Free (Hobby) | $0 |
| SSL certificate | Vercel (auto) | Free via Let's Encrypt | $0 |
| CDN / DDoS protection | Cloudflare | Free | $0 |
| DNS management | Cloudflare | Free | $0 |
| Transactional email (sending) | Resend | Free (3,000 emails/mo) | $0 |
| Email inbox | Gmail | Free | $0 |
| Domain registration | Namecheap | `ascendtobali.com` | ~$13–14/yr |

**Total current spend: ~$13–14/year** (domain registration only)

---

## What has already been eliminated

The migration to Vercel + Cloudflare + Resend means the following Namecheap
services are no longer needed and should not be renewed if they were active:

| Service | Namecheap product | Replaced by | Saving |
|---|---|---|---|
| Web hosting | Stellar / Stellar Plus hosting | Vercel free tier | ~$24–96/yr |
| SSL certificate | PositiveSSL / EssentialSSL | Vercel auto-SSL | ~$9–50/yr |
| Premium DNS | Namecheap Premium DNS | Cloudflare free DNS | ~$5/yr |
| Email hosting | Private Email | Resend + Gmail | ~$12–24/yr |

---

## One remaining saving: transfer the domain to Cloudflare Registrar

Namecheap charges ~$13–14/yr for `.com` renewal.  
Cloudflare Registrar charges at-cost with no markup: **~$9.15/yr**.

**Saving: ~$4–5/year.** Small, but it also consolidates domain registration and
DNS management in one place (Cloudflare), which reduces admin overhead.

### How to transfer

1. Log into Namecheap → Domain List → `ascendtobali.com`
2. Unlock the domain (disable "Domain Lock")
3. Request the EPP/Auth transfer code from Namecheap
4. In Cloudflare Dashboard → Domain Registration → Transfer Domain
5. Enter the auth code — Cloudflare will handle the rest
6. DNS settings transfer automatically since Cloudflare already manages DNS

> Note: domains can only be transferred 60 days after registration or last
> transfer. The transfer costs one year of renewal at the destination price.

---

## Action required: form submissions not wired up

The intake form at `index.html` does **not** send data anywhere. The submit
handler only prevents the default action and shows a thank-you screen — no
email or webhook is triggered.

Any submission currently submitted is silently lost.

**Fix options (all free at current volume):**

| Option | How it works | Effort |
|---|---|---|
| **Resend + serverless function** | Vercel API route calls Resend on submit | Medium — already have Resend set up |
| **Formspree** | Point form `action` at Formspree endpoint | Low — no code needed |
| **Netlify Forms** | Built-in if hosted on Netlify; not applicable here | N/A |

Recommended: wire the form to a Vercel serverless function that sends a
notification email via Resend. This keeps everything within the existing free
stack and gives full control over the email content.

---

## Summary

You are already on a lean, mostly-free stack. No Namecheap services need to be
cancelled today (only domain registration remains active).

**Two actions to consider:**

1. **Transfer `ascendtobali.com` to Cloudflare Registrar** — saves ~$4–5/yr,
   consolidates everything in Cloudflare.

2. **Wire up the intake form** — form submissions are currently lost. Connect to
   Resend via a Vercel API route to receive new inquiries.
