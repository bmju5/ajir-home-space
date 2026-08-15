# Plan: Major ajir upgrade

This request bundles 4 large workstreams. Doing them all in one shot risks a broken build, so I'll sequence them and confirm priorities before starting. Please tell me which to do first (or "all in order").

---

## A. bnbicons.com 3D isometric icon style

bnbicons.com is a paid 3D icon library — we can't redistribute its assets. To match the look across the site I'll either:

- **A1 (recommended, free):** Generate a coherent set of ~20–30 PBR-style 3D PNG icons via the image generator using your exact art_style_profile (white bg, isometric, soft shading, ~512px). Save to `src/assets/icons/3d/` and replace lucide icons in category strips, feature tiles, footer service badges, and dashboard cards.
- **A2:** You purchase a bnbicons license and upload the PNG/WebP pack — I'll wire them in.

## B. Fix booking / check-in / check-out / clickable houses

- Add a real **Property Detail page** at `/stays/:id` (image gallery, address, amenities, host card, reviews, booking widget).
- Make every card (home, carousel, map pin) navigate there.
- Booking widget: date pickers with min/max validation, guest stepper, nightly × nights breakdown, taxes, coupon, total — calls `bookings` + `payments` insert and updates booking status `pending → confirmed`.
- Add **My trips** check-in/check-out actions in dashboard (status transitions `confirmed → checked_in → checked_out`) + a new `check_in_time` / `check_out_time` column via migration if you want timestamps (otherwise reuse `status`).

## C. Host listing flow fix + multi-variant listings

- Rebuild **"List your home"** as a 4-step wizard (Basics → Location → Photos → Pricing & Publish), writing to `properties`.
- **Variants:** new `property_variants` table (one property → many room/unit types with own price, max_guests, beds, images). Booking picks a variant.

## D. Owner dashboard expansion

- New tabs in `/dashboard` for hosts:
  - **Listings** (CRUD + variants)
  - **Bookings & calendar**
  - **Bills** — utility bills tracker (electricity, water, gas, internet) with monthly entries, due dates, paid/unpaid, totals chart.
  - **Marketplace** — ajir-sold bundles (Security Bundle, Smart-Home Bundle, Welcome Pack) + recurring services (Cleaning, Laundry, Pool). Subscribe / one-time purchase, status tracking.
- New tables: `utility_bills`, `ajir_bundles`, `bundle_purchases`, `owner_subscriptions`.

---

## Technical notes

- All new tables get RLS (owner-scoped) + admin override via `private.has_role`.
- Variants: booking flow updated to require `variant_id`; existing bookings backfilled with a default variant.
- 3D icons: pre-generated PNGs, lazy-loaded, `<img>` with `loading="lazy"` and alt text. ~30 icons × ~80 KB ≈ 2.4 MB total — acceptable.
- Property detail page added to router; cards become `<Link to={...}>`.

---

## Questions before I start

1. **Icons:** go with A1 (I generate ~25 3D PNGs now) or A2 (you'll upload a pack)?
2. **Order:** do all four (A→B→C→D) in sequence across multiple replies, or pick one to ship first?
3. **Bills:** manual entry only, or do you also want CSV import / a fake "utility provider" integration stub?
4. **Marketplace pricing:** should I seed a starter catalog (Security Bundle $499, Cleaning $80/visit, etc.) or wait for your list?

Reply with answers (e.g. "A1, all in order, manual bills, seed catalog") and I'll execute.