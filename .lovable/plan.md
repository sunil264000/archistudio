

# Sales Enhancement Plan for Archistudio

## What You Already Have (Strong Foundation)
- Flash sale popups with countdown timers
- Purchase notification social proof
- Coupon system
- Referral program
- EMI/partial payment options
- Gift campaigns
- Live viewer counter

## High-Impact Features to Add

### 1. Exit-Intent Popup with Discount Offer
When a user moves their mouse to leave the page (desktop) or scrolls up quickly (mobile), show a popup offering a limited discount code to prevent abandonment.

- Triggers only once per session (localStorage flag)
- Shows a unique auto-generated coupon (e.g., 10% off)
- Includes countdown timer (15 minutes) to create urgency
- Only shows to non-logged-in users or users who haven't purchased

### 2. Abandoned Cart Recovery Emails
Track when users click "Buy Now" but don't complete payment, then send a follow-up email with a reminder and optional discount.

- New database table `abandoned_carts` to track payment initiations
- Edge function `send-cart-recovery-email` triggered after 1 hour
- Includes course thumbnail, price, and a direct checkout link
- Optional: auto-apply a small discount in the recovery email

### 3. Course Bundle Discounts on the Courses Page
Show a sticky "Bundle & Save" banner when users browse courses, encouraging them to buy multiple courses together at a discount.

- "Buy 2, Get 10% Off" / "Buy 3+, Get 20% Off" messaging
- Visible on the Courses page as a top banner
- Auto-calculates savings in the cart

### 4. Sticky "Sale Ending" Top Banner
Instead of just the bottom-right popup, add a slim sticky banner at the top of all pages during active sales.

- Thin bar with countdown timer and discount percentage
- Dismissible but re-appears on page navigation
- Links directly to /courses

### 5. WhatsApp/Quick Contact CTA
Add a floating WhatsApp button for instant support -- extremely high conversion for Indian audiences.

- Fixed position button with WhatsApp icon
- Pre-filled message: "Hi, I'm interested in Archistudio courses"
- Opens wa.me link with your business number
- Admin-configurable phone number via site_settings

---

## Technical Details

### New Files
- `src/components/sales/ExitIntentPopup.tsx` -- Exit-intent detection + discount modal
- `src/components/sales/SaleBanner.tsx` -- Sticky top banner during sales
- `src/components/sales/WhatsAppButton.tsx` -- Floating WhatsApp CTA
- `supabase/functions/send-cart-recovery-email/index.ts` -- Recovery email sender

### Database Changes
- New table `abandoned_carts` with columns: id, user_id, course_slug, amount, created_at, email_sent, recovered
- New site_settings key: `whatsapp_number`

### Modified Files
- `src/App.tsx` -- Add ExitIntentPopup, SaleBanner, and WhatsAppButton globally
- `src/pages/Courses.tsx` -- Add bundle discount banner
- `src/hooks/useCashfreePayment.ts` -- Track abandoned cart on payment initiation
- `src/components/admin/SalesManagement.tsx` -- Add WhatsApp number config

### Implementation Priority
1. Sticky Sale Banner (quick win, high visibility)
2. WhatsApp Button (quick win, high conversion for Indian market)
3. Exit-Intent Popup (medium effort, prevents bounces)
4. Bundle Discounts (medium effort, increases average order value)
5. Abandoned Cart Emails (higher effort, recovers lost sales)

