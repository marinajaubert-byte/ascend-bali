-- ============================================================
-- ASCEND GLOBAL — Landing Page System
-- Run this SQL in your Supabase dashboard → SQL Editor
-- ============================================================

-- Pages table: one row per partner / event link
-- Add a row → get a new URL. Change a row → reuse the URL.
create table if not exists public.pages (
  slug                text primary key,
  active              boolean not null default true,

  -- Branding / copy (all have sensible defaults)
  partner_name        text not null default 'Partner',
  hero_eyebrow        text not null default 'Ascend Global · Bali',
  hero_title          text not null default 'Let''s make your',
  hero_title_em       text not null default 'Bali visit count.',
  hero_subtitle       text not null default 'Tell us what you need and Marina will come back to you within 24 hours with the right connections, rooms and opportunities for your time in Bali.',
  intro_quote         text not null default 'The right introduction in the right city can open a market you have been trying to crack for years.',
  event_month         text,                        -- e.g. "May 2026" — used in thank-you message
  thank_you_message   text,                        -- leave null to use the auto-generated default

  -- Notification
  notification_email  text not null,               -- where to send new lead alerts

  created_at          timestamptz not null default now()
);

-- Row-level security: pages are publicly readable (needed for server-side fetch)
alter table public.pages enable row level security;
create policy "Pages are publicly readable"
  on public.pages for select using (true);


-- Leads table: one row per form submission
create table if not exists public.leads (
  id                  uuid primary key default gen_random_uuid(),
  page_slug           text not null,
  submitted_at        timestamptz not null default now(),

  -- Section 01 — Contact
  name                text,
  email               text,
  whatsapp            text,
  company             text,
  websites            text,
  business_description text,
  markets             text[],
  other_markets       text,

  -- Section 02 — Visit
  arrival             text,
  departure           text,
  bali_before         text,
  visa                text,

  -- Section 03 — Connections
  connections         text[],
  ideal_connection    text,
  existing_contacts   text,
  dream_intro         text,

  -- Section 04 — Offer
  services            text,
  seeking_investment  text,
  investment_details  text,
  client_value        text,

  -- Section 05 — Support
  support             text[],
  challenge           text,
  meetings_goal       text,

  -- Section 06 — Goals
  indonesia_goals     text,
  return_trip         text,
  speaking            text,
  anything_else       text
);

-- Row-level security: leads are insert-only from the API (service role bypasses RLS)
alter table public.leads enable row level security;
-- No SELECT policy — leads are read-only from the Supabase dashboard


-- ============================================================
-- EXAMPLE ROWS — delete or update as needed
-- ============================================================

-- Default row: all copy uses the built-in defaults
-- Just change slug + partner_name + notification_email per person
insert into public.pages (slug, partner_name, notification_email, event_month)
values ('athar', 'Athar', 'marina@ascendglobal.com', 'May 2026')
on conflict (slug) do nothing;

-- Example with fully custom copy
-- insert into public.pages (
--   slug, partner_name, notification_email, event_month,
--   hero_title, hero_title_em, hero_subtitle
-- ) values (
--   'joe', 'Joe', 'marina@ascendglobal.com', 'June 2026',
--   'Let''s make your', 'June visit count.',
--   'Tell us what you need and Marina will connect you with the right people in Bali.'
-- );
