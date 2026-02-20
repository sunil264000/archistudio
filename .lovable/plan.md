
# Deep Full-Site Analysis & Refinement Plan for Archistudio

## Current State Summary

The app is a well-architected LMS with strong foundations: Cashfree payments, Supabase backend, course player, AI chat, EMI, certificates, gift campaigns, sales popups, exit-intent discounts, and a cart system. After testing each workflow in depth, here are all the critical issues and opportunities grouped by priority.

---

## CRITICAL BUGS (Must Fix)

### 1. Discount Timer: One User Has a Stuck "Extended & Expired" Timer
The database shows 1 user with `extended: true` but `expired: false`. The `calcState` function marks it as `canExtend: false` and `active: false`, but never writes `expired: true` back to the DB on mount. This means the DiscountTimerBanner may flicker incorrectly for that user, and future activations are blocked. Fix: on `fetchTimer`, if remaining <= 0 AND extended, immediately `update({ expired: true })`.

### 2. WhatsApp Button Not Showing (No DB Row)
`site_settings` has no `whatsapp_number` key — the query returns nothing so the button never renders. Fix: upsert a default placeholder row on app init or provide a fallback in the admin.

### 3. Ambient Audio Error in Console
Console shows: `"Audio failed to load, trying fallback"` — the admin has set `ambient_audio_url` to empty string `""` in the DB. The code tries to load empty string, fails, then falls back. Fix: treat empty string as null and skip directly to fallback.

### 4. Cart Uses LocalStorage — Not Persisted Across Devices
The cart (`CartContext.tsx`) reads/writes from `localStorage`. This is fine for guests, but for logged-in users, if they switch devices, the cart is empty. The discount timer is backend-synced but the cart is not. Fix: for logged-in users, sync cart to a `user_carts` backend table (upsert on change, fetch on login).

### 5. Exit Intent Popup Shows for Already-Active Timer Users
When a user already has an active timer in the DB (like the test user), the ExitIntentPopup still fires again via `sessionStorage.getItem(EXIT_INTENT_SHOWN_KEY)` — it uses sessionStorage (cleared per tab) but the actual discount is already running. Fix: check `if (isActive || row)` — don't trigger popup if timer is already active.

### 6. Auth Redirect After Login Goes to `/` Not to `/courses` or Intended Page
After login, users are sent to `/` (home). If they were browsing `/course/slug` and clicked "Login to Buy", they lose context. Fix: use the `from` state stored by ProtectedRoute, or pass `?redirect=/course/slug` and honor it in Auth page.

### 7. Pricing Section Has Hardcoded Prices That Don't Match Real Course Prices
`PricingSection.tsx` shows ₹499, ₹1,999, ₹2,999 — but real courses from the DB have individual prices. The "Single Studio" CTA links to `/auth?mode=signup` instead of `/courses`. Users who click "Choose Studio" get confused. Fix: link CTAs correctly to `/courses`.

---

## HIGH-IMPACT UX IMPROVEMENTS

### 8. AI Chat Widget Position Overlaps with AmbientAudio + WhatsApp + DiscountBanner
All four floating elements are positioned at `bottom: 6, right: 6`:
- AmbientAudio: `bottom-6 right-6` (z-9999)
- AIChatWidget: `bottom-6 right-6` (z-50)
- WhatsAppButton: `bottom-20 right-4` (z-50)
- DiscountTimerBanner: `bottom-20 right-4 sm:right-4` (z-50)

They all stack on top of each other especially on mobile. Fix: create a proper stacking system:
- AmbientAudio: `bottom-6 right-6`
- AIChatWidget trigger: `bottom-6 right-24` (moves left of audio button)
- WhatsApp: `bottom-6 right-44`
- DiscountTimerBanner: moves to `bottom-24 right-4` (above others)

### 9. DiscountTimerBanner Conflicts With SaleBanner on Mobile
When SaleBanner is active (top sticky bar), pages need top padding. But no global top-padding offset is applied when SaleBanner shows. The banner overlaps Navbar content, and on mobile the Navbar `sticky top-0 z-50` with `SaleBanner` at `z-[60]` pushes it down, but the sticky Navbar doesn't know about the banner. Fix: add a `data-sale-banner` attribute and dynamic top padding.

### 10. ExitIntentPopup: Timer Not Shown Live in the Dialog
When the exit-intent popup opens, it calls `activate()` to create the DB record, but `timeLeft` starts at 0 until the next fetch cycle. There's no immediate visual timer on open. Fix: immediately set `timeLeft = INITIAL_DURATION` in UI state while the DB write happens async.

### 11. BundleDiscountBanner Always Shows on /courses (Even with 0 Items in Cart)
The banner renders for every user even when they have 0 items in cart, showing just the "Buy 2 get 10% off" message. This is fine, but for enrolled users who've already purchased all courses, it's misleading. Fix: check if user is enrolled and if so, show a "Continue Learning" banner instead.

### 12. Dashboard Tabs Label "Studios" Doesn't Show Tab Label on Mobile (xs breakpoint)
The tabs use `hidden xs:inline sm:inline` but there's no `xs:` breakpoint defined in tailwind.config — it falls through to hidden on all mobile. Only icons show. This means the 6-tab row is hard to understand. Fix: show short labels on all sizes or use a scrollable tab list.

### 13. Payment Success Page: No Confetti / Celebration Effect
The page has good animations but nothing that creates the emotional "you did it!" moment. Fix: add a `canvas-confetti` effect on payment success for delight.

---

## SALES SYSTEM REFINEMENTS

### 14. Exit Discount Auto-Applied in Cart But Not Shown in Buy Now Flow
When a user clicks "Buy Now" on a course detail page, the exit discount is NOT applied — only the cart applies it. The `CourseDetail` uses `effectivePriceInr` without subtracting the exit discount. Fix: in `CourseDetail.handleBuyNow`, check `useExitDiscount` and subtract `exitDiscountAmount` from the payment amount.

### 15. Coupon Code in Cart: Validation Doesn't Reset When Cart Items Change
If a user applies a coupon, then adds/removes items (changing `priceAfterBundle`), the coupon validation was run against the old amount. The coupon could be valid for ₹1000+ but now cart is ₹400. Fix: reset `appliedCoupon` when `items` change in `CartSheet`.

### 16. Abandoned Carts Table is Empty — Tracking Not Working
The `abandoned_carts` table has 0 rows, but `useCashfreePayment.ts` tries to insert into it. This suggests either: the RLS policy is blocking the insert (only `users can insert their own`) but the insert uses the client SDK with auth — OR the user never completed a payment attempt. Need to verify the `create-cashfree-order` edge function logs.

### 17. SaleBanner: Dismissed State Resets on Page Navigation
The `dismissed` state is local React state in `SaleBanner`. Each page navigation re-mounts the component (since it's in App.tsx within `<AnimatedRoutes />`'s `AnimatePresence`). Actually, it's OUTSIDE the AnimatedRoutes, so this is fine — but dismissed resets on hard refresh. Fix: store dismissed in sessionStorage.

---

## BACKEND & EDGE FUNCTION ISSUES

### 18. verify-payment Edge Function: Not Deployed
Looking at the edge function files, `verify-payment/index.ts` exists in the codebase but checking the edge function logs, only these functions appear: `migrate-to-lulustream`, `auto-scan-courses`, `send-cart-recovery-email`, `get-analytics-config`. The `verify-payment` function appears to not be getting invoked (no logs). This means the fallback polling in `PaymentSuccess.tsx` works but server-side verification may be unreliable. Needs redeploy.

### 19. send-cart-recovery-email: No Trigger / Cron Not Running
The function shows in logs but only boots and immediately shuts down (no HTTP requests to it). The PostgreSQL cron job that was planned may not have been created properly. Need to verify the migration created the `pg_cron` job correctly.

### 20. AI Chat: Using Anon Key Instead of User Token
`AIChatWidget.tsx` passes `VITE_SUPABASE_PUBLISHABLE_KEY` as the Bearer token. This means:
- All AI requests are unauthenticated (anon role)
- Rate limiting per IP only
- No per-user AI query tracking
Fix: if user is logged in, pass their `session.access_token` instead.

---

## PERFORMANCE & CODE QUALITY

### 21. Multiple Supabase Realtime Channels Not Cleaned Up
`useSaleDiscount` creates a realtime channel `sale_settings_hook` but if the hook unmounts and remounts (page navigation), a new channel is created without properly cleaning up old ones. The cleanup function calls `supabase.removeChannel(channel)` which should work, but if the channel name is shared it causes issues.

### 22. CourseDetail: Analytics `viewStudio` Fires Before `course` Is Set
```js
useEffect(() => {
  if (slug && course) {
    analytics.viewStudio(slug, course.title, effectivePriceInr);
  }
}, [slug]); // course is NOT in deps array
```
`course` is used inside but not in the dependency array — this is a stale closure bug.

### 23. CartContext Doesn't Auto-Clear Enrolled Courses
If a user buys a course via "Buy Now" (direct payment), the cart still contains that course. After payment success, `clearCart()` is never called. Fix: on `PaymentSuccess`, when payment is confirmed, remove the purchased course from cart.

### 24. AppContent Component: Gift Campaign Runs on Every Auth State Change
The `useEffect` for gift campaigns runs every time `user` changes (including on every auth refresh). On each page load for a logged-in user, it runs the full gift campaign check waterfall. Fix: track `giftCheckDone` ref to prevent re-running.

---

## IMPLEMENTATION PLAN

All fixes grouped into 3 focused file sets:

**Priority 1 — Critical Bugs & Crashes:**
- `src/components/audio/AmbientAudio.tsx` — empty string audio URL fix
- `src/hooks/useExitDiscount.ts` — fix stuck timer DB write + don't show popup if already active
- `src/components/sales/ExitIntentPopup.tsx` — check `isActive` before showing
- `src/components/sales/SaleBanner.tsx` — sessionStorage dismissed state
- `src/components/cart/CartSheet.tsx` — reset coupon on item change

**Priority 2 — Layout & UX Stacking:**
- `src/components/audio/AmbientAudio.tsx` — reposition to not overlap AI chat
- `src/components/ai/AIChatWidget.tsx` — reposition button, use auth token, add markdown rendering for AI responses
- `src/components/sales/WhatsAppButton.tsx` — reposition + add fallback phone
- `src/components/sales/DiscountTimerBanner.tsx` — reposition higher

**Priority 3 — Sales & Conversion Fixes:**
- `src/pages/CourseDetail.tsx` — apply exit discount in Buy Now flow + fix analytics dep array
- `src/pages/PaymentSuccess.tsx` — add confetti on success + clear cart
- `src/App.tsx` — fix gift campaign re-run on auth refresh with ref guard
- `src/pages/Auth.tsx` — honor redirect param after login
- `src/components/home/PricingSection.tsx` — fix CTA links

**Priority 4 — Backend:**
- Redeploy `verify-payment` edge function
- Fix `send-cart-recovery-email` cron job
- Upgrade AI chat to use user auth token

### Technical Notes

- No new database tables needed for these fixes
- No migrations required — all fixes are frontend code + edge function redeployment
- The floating element z-index stacking will use: AmbientAudio `bottom-6 right-6`, AI Chat `bottom-6 right-24`, WhatsApp `bottom-6 right-44`, DiscountBanner `bottom-24 right-4`
- `canvas-confetti` is NOT installed — will use CSS keyframe animation instead (no new deps)
- The AI chat will check `useAuth().session?.access_token` and fall back to anon key for guests
