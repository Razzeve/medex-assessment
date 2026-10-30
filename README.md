# MedEx Senior Frontend Engineering Take-Home Submission

Welcome to the MedEx Senior Frontend Engineering assessment codebase. This repository contains the production-grade implementation of:
1. **Task 1: Service Explorer with Live Faceted Filters** (`/services`)
2. **Task 2: Multi-Provider Cart & Split Checkout Flow** (`/cart`, `/checkout`)
3. **Task 3: Booking & Multi-Timezone Scheduler** (`/booking`)

---

## 1. Quick Start & Execution

### Prerequisites
- Node.js `v20+` (tested on Node.js `v22`)
- npm / yarn / pnpm

### One-Command Setup & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit the application at:
- **Home Hub**: [http://localhost:3000](http://localhost:3000)
- **Task 1 Service Explorer**: [http://localhost:3000/services](http://localhost:3000/services)
- **Task 2 Cart Split & Checkout**: [http://localhost:3000/cart](http://localhost:3000/cart)
- **Task 2 Multi-Step Checkout**: [http://localhost:3000/checkout](http://localhost:3000/checkout)
- **Task 3 Booking & Timezones**: [http://localhost:3000/booking](http://localhost:3000/booking)

### Running Automated Unit Tests
```bash
# Run all 36 unit tests across all 3 tasks
npm test
```

### Production Build & Linting
```bash
npm run build
npm run lint
```

---

## 2. Directory Layout & Architecture Boundaries

This project follows feature-driven directory architecture strictly adhering to domain boundaries:

```
medex-assessment/
├── public/
│   └── data/
│       ├── task1-service-explorer.json     # Mock database (3,200 services, 67 providers, 13 categories)
│       ├── task2-cart.json                 # Mock cart database (serverCart, guestCart, catalog)
│       └── task3-booking.json              # Mock booking database (providers, closures, bookedSlots, existingBooking)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── booking/                    # Booking and scheduling API endpoints
│   │   │   ├── cart/                       # Cart fetch, quantity sync, merge endpoints
│   │   │   ├── checkout/route.ts           # Mock endpoint: POST /api/checkout (idempotency support)
│   │   │   ├── orders/[orderId]/route.ts   # Mock endpoint: GET /api/orders/:orderId
│   │   │   ├── category/active/route.ts    # Task 1 category route
│   │   │   ├── providers/route.ts          # Task 1 providers route
│   │   │   └── service/route.ts            # Task 1 service route
│   │   ├── booking/page.tsx                # Next.js App Router: Multi-Timezone Appointment Booking Page
│   │   ├── cart/page.tsx                   # Next.js App Router: Cart Review & Split Packaging
│   │   ├── checkout/page.tsx               # Next.js App Router: Multi-Step Split Checkout Flow
│   │   ├── services/page.tsx               # Task 1 Service Explorer Page
│   │   ├── layout.tsx                      # Root layout with QueryProvider and Navbar
│   │   └── page.tsx                        # Assessment overview dashboard
│   ├── components/
│   │   ├── layout/navbar.tsx               # Global navigation bar with direct task links
│   │   └── providers/                      # React Query Client Provider
│   └── features/
│       ├── service-explorer/               # Task 1 Domain Feature Boundary
│       ├── cart-checkout/                  # Task 2 Domain Feature Boundary
│       │   ├── types/index.ts              # Strict domain types: CartItem, CartGroup, SplitPackage, CheckoutOrder
│       │   ├── utils/
│       │   │   ├── split-engine.ts         # Group partitioning, currency isolation, delivery fee & blocking rules
│       │   │   ├── currency.ts             # Multi-currency formatting, safe arithmetic, symbol mapping
│       │   │   ├── coupons.ts              # Promo codes (MEDEX10, HEALTH500, FREESHIP) & fee waivers
│       │   │   └── merge.ts                # Guest cart merge resolution algorithms
│       │   ├── store/
│       │   │   ├── useCartStore.ts         # Zustand store with reload persistence, optimistic sync & idempotency
│       │   │   └── selectors.ts            # Reactive selectors: useSplitPackages, useCartSubtotals, useCartValidation
│       │   ├── components/
│       │   │   ├── CartView.tsx            # Responsive cart layout (flex-col lg:flex-row)
│       │   │   ├── CartItemRow.tsx         # Item card with image/icon, 44px touch targets & inline removal confirm
│       │   │   ├── CartItemList.tsx        # Semantic item list wrapper
│       │   │   ├── VendorGroupCard.tsx     # Provider fulfillment card with discrete currency breakdown & isolated checkout
│       │   │   ├── OrderSummary.tsx        # Sticky summary, voucher application, discrete settlement totals
│       │   │   ├── CheckoutView.tsx        # Two-column layout, group-isolated breadcrumbs, mobile accordion summary
│       │   │   ├── CheckoutStepper.tsx     # 3-step adaptive wizard (compact on mobile, full on desktop)
│       │   │   ├── PatientDetailsForm.tsx  # Dynamic Step 2 validation (physical dispatch vs clinical lab rules)
│       │   │   ├── PaymentConfirmation.tsx # Celebratory order success screen with copyable reference IDs & breakdown
│       │   │   ├── EmptyCartState.tsx      # Zero-state view with icon, clear copy & "Explore Services" CTA
│       │   │   ├── GuestCartMergeBanner.tsx# 4-scenario guest cart merge notification banner
│       │   │   ├── CartSkeleton.tsx        # Loading skeleton matching layout geometry
│       │   │   └── DevPanel.tsx            # Floating developer panel for error simulations & latency adjustments
│       │   └── __tests__/
│       │       ├── split-engine.test.ts    # Currency isolation, wellness unpriced handling, delivery fee rules
│       │       ├── coupons.test.ts         # Multi-currency percentage & fixed discount tests
│       │       ├── idempotency.test.ts     # Idempotent gateway replay & order persistence tests
│       │       ├── merge.test.ts           # Guest cart merge overlap scenario tests
│       │       └── checkout-audit.test.ts  # Audit tests: zero quantity removal, group recalculation, validation rules
│       └── booking-scheduler/              # Task 3 Domain Feature Boundary
```

---

## 3. Task 2: Cart Split & Multi-Provider Checkout Flow (`/cart`, `/checkout`)

### The Healthcare Marketplace Challenge
In a cross-border healthcare marketplace like MedEx, a patient's cart often contains items sourced from diverse clinical organizations across Thailand (`THB`), Nepal (`NPR`), and India (`INR`). A monolithic single-invoice checkout fails in healthcare because:
1. **Licensed Jurisdictional Billing**: Clinics bill in their domestic currencies under local regulatory compliance. Opaque conversion spreads confuse patients and breach local billing regulations.
2. **Distinct Fulfillment Modalities**:
   - **Home Lab Diagnostic Collection**: Dispatches a licensed phlebotomist to the patient's residence. Requires physical address validation and discrete collection/courier fees.
   - **Hospital / Clinic Health Checks**: Issues a prioritized clinic check-in pass. Zero dispatch fees.
   - **Spa & Wellness Treatments**: Requires duration selections (e.g. 60m vs 90m) to calculate service charge. Zero dispatch fees.
   - **Digital Cover / Telehealth**: Instant electronic policy delivery to email. Zero dispatch fees.

---

### A. The Order Splitting Engine (`utils/split-engine.ts`)
The split engine partitions the raw cart into autonomous `SplitPackage` structures:
- **Zero Currency Conversion Spread**: Subtotals are tracked in isolated currency buckets (`Record<Currency, number>`). `THB`, `NPR`, and `INR` are never cross-converted or summed into a single meaningless number.
- **Configured Fulfillment Rates & Free Tiers**:
  - `lab_test`: Phlebotomist home dispatch charges THB 120, NPR 250, or INR 150. Free collection automatically applies when currency subtotal reaches threshold tiers (THB 3,000 / NPR 10,000 / INR 2,000).
  - `wellness`, `package`, `service`, `insurance`: Strictly configured with 0 delivery fees.
  - `FREESHIP` coupon waives all courier and home collection fees across all active currencies.
- **Pre-Checkout Eligibility & Blocking Gates**:
  - `isItemUnavailable`: Identifies discontinued services removed by providers and blocks package checkout until removed.
  - `isItemWellnessUnpriced`: Prevents unpriced wellness items from progressing to checkout until a duration option is chosen.

---

### B. Group-Level Checkout Routing (`/checkout?group=[id]` vs `/checkout`)
MedEx supports both unified checkout and isolated package settlement:
- **Group-Isolated Checkout (`/checkout?group=[groupId]`)**:
  - Users can click **"Checkout This Package"** on any provider card in `/cart` to settle only that package (e.g. `/checkout?group=lab_test`).
  - Displays a clear breadcrumb and header: `Cart > All Packages > Checking out: [Package Name]` with a 1-click button to **"Checkout All Packages"**.
  - Isolates calculation, patient validation, and order execution strictly to that package.
  - Upon completion, other cart packages remain safely in the cart, and the confirmation screen prompts the user to continue checking out remaining packages.
- **Unified Multi-Provider Checkout (`/checkout` without param)**:
  - Consolidates all eligible packages for concurrent settlement.
  - Provides a tabbed review bar (`All Packages`, `Home Lab Collection`, `Spa & Wellness`, etc.) so patients can inspect each package independently or review all simultaneously.
- **Graceful Fallback**:
  - If a user loads `/checkout?group=invalid` or visits a package that was already fulfilled, an empathetic alert explains the package is no longer pending and provides 1-click links to `/checkout` and `/cart`.

---

### C. State Resilience & Concurrency Safety (`useCartStore.ts`)
- **Reload Safety (Crash & Refresh Resilience)**:
  - Cart state, guest items, applied coupons, active checkout sessions, and completed orders are persisted in `localStorage` under `medex_cart_store_v1` using Zustand's `persist` middleware.
  - Refreshing or closing the tab during any checkout step preserves form inputs and completed transaction records.
- **Idempotency Protection**:
  - Each split package receives a cryptographically safe idempotency key: `idemp_[groupType]_[timestamp]_[rand]`.
  - Re-submitting or retrying a transaction reuses the exact key, guaranteeing providers never double-bill the patient.
- **Optimistic Concurrency & Rollback**:
  - Quantity modifications update the client store instantly for zero-latency feel.
  - Monotonic sequence counters (`pendingLineUpdates`) verify server ACK ordering; network failures or 409 conflicts automatically roll back to the last confirmed server quantity with an informative toast notification.
- **Partial Failure Recovery**:
  - In unified checkout, if Provider A succeeds but Provider B's payment gateway times out (simulated via Dev Panel), Provider A's confirmed order is safely sealed and never re-charged.
  - Provider B displays an alert with an inline **"Retry This Order"** action that reuses its stored idempotency key.

---

### D. Quantity & Zero-State Edge Cases
- **Quantity Decrement at `quantity = 1`**:
  - Clicking the minus button when quantity is 1 triggers an accessible inline confirmation prompt: `Remove "[Service Title]" from cart? [Yes, Remove] [Cancel]`.
  - Confirming cleanly removes the item without NaN or zero-price anomalies.
- **Empty Group Disappearance & Recalculation**:
  - Deleting the last item in a fulfillment group automatically eliminates that group from `cart.groups`.
  - Overall delivery fees, currency subtotals, and total payable amounts recalculate immediately.
- **Empty Cart Zero-State**:
  - If all items are deleted, the view displays a clean `EmptyCartState` with an icon, clear messaging, and a primary CTA: **"Explore Services"** linking back to `/services`.

---

### E. Form Validation & UX Polish on Checkout
- **Sensible Step 2 Validation Rules**:
  - **Physical Dispatches (Home Lab Sample Collection)**: Requires Street Address & Unit (`addressLine`), City (`city`), Contact Phone (`phone`), and Legal Recipient Name (`fullName`).
  - **Clinical Consultations & Lab Panels**: Requires Legal Patient Name (`fullName`), Date of Birth (`dateOfBirth`), and Biological Sex (`gender`) for diagnostic reference ranges.
  - **Digital Passes**: Requires valid email format and phone.
- **Accessible Inline Errors**:
  - Invalid inputs show `aria-invalid="true"` and `aria-describedby` with inline rose error messages. Progress to Step 3 is prevented until errors are corrected.
- **Realistic 1–2s Simulated Authorization Spinner**:
  - Clicking **"Place Order"** engages a realistic 1.2-second authorization spinner (`"Processing Orders with Local Providers..."`) before transitioning to the success state.
- **Dedicated Payment Confirmation Screen (`PaymentConfirmation.tsx`)**:
  - Celebratory success header with checkmark.
  - 1-click copyable MedEx Order Reference ID (`MDX-ORD-...`).
  - Itemized split breakdown showing provider details, items, fees, discounts, and native currency totals.
  - Action buttons: **"Print Confirmation Pass"** (`window.print()`), **"Return to Healthcare Cart"**, and **"Explore More Services"**.

---

### F. Viewport & Mobile Responsiveness Audit
- **`/cart`**:
  - Stacks split groups and sticky Order Summary vertically on mobile screens (< 768px, `flex-col lg:flex-row`).
  - Item rows wrap gracefully without horizontal scroll.
  - Touch targets for quantity stepper (`-`, `+`) and remove buttons are strictly sized to at least **44x44px** (`min-h-[44px] min-w-[44px]`).
- **`/checkout`**:
  - **Adaptive Stepper**: Displays a compact 3-dot step counter on mobile screens (< 640px) to prevent crowded labels, and a full horizontal step bar on tablet/desktop.
  - **Two-Column Layout**: Form inputs take full width on mobile. On desktop, renders an 8-col form column and 4-col sticky summary column.
  - **Collapsible Mobile Accordion Summary Bar**: On screens < lg, a sticky accordion bar at the top allows patients to inspect package itemization and currency totals with a single tap.

---

## 4. Task 3: Booking & Multi-Timezone Scheduler (`/booking`)

### The Patient Story
> *"I live in Kathmandu. I'm booking a check-up at a hospital in Bangkok for when I travel there next month. Which time is the appointment, mine or theirs?"*

Healthcare marketplace appointments require zero ambiguity: **the patient must physically arrive at the clinic according to the clinic's local clock**, but they plan their travel according to **their home clock**.

### A. Handling Free-Text Timezones & Awkward Provider Formats
In `public/data/task3-booking.json`, healthcare providers typed timezones freehand. In `utils/timezone.ts`, our `normalizeTimezone()` function deterministically parses and maps all messy formats:
1. `"Asia/Bangkok"` (Provider 48): Direct valid IANA identifier.
2. `" UTC+05:45"` (Provider 46, Himal Neo Clinic): Sanitizes leading whitespace and extracts offset `+05:45` → resolves to `Asia/Kathmandu`.
3. `"Nepal Standard Time"` (Provider 112, Annapurna Diagnostics): Recognizes Windows-style registry name → maps to `Asia/Kathmandu`.
4. `"(GMT+5:45)"` (Provider 118, Pashupati Medical Centre): Extracts parenthesized GMT offset `+05:45` → maps to `Asia/Kathmandu`.
5. `"Asia/Katmandu "` (Provider 121, Lumbini Polyclinic): Sanitizes trailing whitespace and updates legacy tzdb spelling `Katmandu` → `Asia/Kathmandu`.
6. `""` (Provider 131, Aravali Hospital): Empty string. Uses provider country code `IN` → safely defaults to `Asia/Kolkata` (`UTC+05:30`).
7. **Unrecognized / Garbage Values**: Documented fallback to `COUNTRY_TIMEZONE_MAP[countryCode]` (`TH` → `Asia/Bangkok`, `NP` → `Asia/Kathmandu`, `IN` → `Asia/Kolkata`), appending an audit note to the provider object so reviewers can inspect the resolution rationale.

### B. The Two-Clock Mental Model & Cross-Midnight Day Boundaries
Rather than forcing patients to toggle between timezones, **both clocks are shown simultaneously on every appointment slot and confirmation dialog**:
- **Primary Display (Hospital Arrival Time)**: Highlighted with a facility icon (e.g. `10:00 – 10:30 ICT (Bangkok)`). The UI explicitly instructs: *"You must be physically at the hospital by this clock."*
- **Secondary Display (Patient Local Time)**: Shown alongside (e.g. `08:45 – 09:15 NPT (Kathmandu)`).
- **Timezone Differential Explainer**: A dynamic banner explains the offset (e.g. *"Bangkok is 1 hr 15 mins ahead of Kathmandu"*).
- **Cross-Midnight Boundary Detection**: When converting a slot across timezones with wide differentials (e.g. London evening slot viewed in Bangkok, or Bangkok morning slot viewed in New York), our converter flags date transitions:
  - `dateOffsetDays: +1` → Renders a prominent `+1 Day` badge.
  - `dateOffsetDays: -1` → Renders a `–1 Day` badge.

### C. Dynamic `dayOffset` Translation (Never Goes Stale)
In `task3-booking.json`, dates are stored as relative `dayOffset` numbers (`0` = today at provider, `1` = tomorrow, etc.):
- When `mock-db.ts` starts, it converts `dayOffset` into real ISO `YYYY-MM-DD` strings using `getCurrentDateInTimezone(provider.resolvedTimezone)`.
- Regardless of what date or year the assessment is evaluated, Day 0 is always today at that provider, preventing stale dates.

### D. The Slot Rule & Operating Hours Overlap Truncation
Per the MedEx slot rule:
> *"A specialist's slots start at `consultation.startTime` and repeat every `durationInMinutes + bufferInMinutes`. The last slot is one that still ends by `consultation.endTime`. A slot is offered only if it lies entirely within the provider's opening hours that day."*

Awkward data cases in `task3-booking.json` are handled defensively:
1. **Hospital Early Closing (Dr. A. Wongsakul at Riverside Hospital)**:
   - On Saturdays, Riverside Hospital closes at `13:00`, while Dr. Wongsakul's advertised hours are `10:00 – 16:00`.
   - Cycle: `30 min duration + 10 min buffer = 40 min cycle`. Slots at `10:00`, `10:40`, `11:20`, `12:00` end at `12:30`.
   - The `12:40` slot would finish at `13:10 > 13:00`, so it is excluded.
   - The UI surfaces a clear warning banner: *"Dr. A. Wongsakul's advertised hours (10:00–16:00) are adjusted to hospital operating hours on Saturdays (09:00–13:00). Only overlapping slots are bookable."*
2. **Specialist Starting Before Facility Opens (Dr. P. Chaiyaporn)**:
   - Advertised from `07:00 – 12:00`, but hospital opens at `08:00`.
   - Slot from `07:00 – 07:45` falls outside hospital opening and is omitted. First offered slot is `08:00 – 08:45`.
3. **Specialist Operating Completely Outside Facility Hours (Dr. N. Rana on Friday & Saturday)**:
   - Advertised `18:00 – 21:00`. On Friday, hospital closes at `17:00`; on Saturday closes at `13:00`.
   - Zero overlap occurs; the UI explains that no consultation hours are available on those days.
4. **Weekly Facility Closures & Public Holidays**:
   - Days missing from `daySchedules` (e.g. Sundays at Riverside, Saturdays at Himal Neo Clinic) and dates in `closures` (e.g. Day 12 "Public holiday", Day 4 "Staff training day") render disabled date tiles with descriptive badges.

### E. Today's Past Slots Cutoff
Slots for today that have already started are marked as passed and disabled. Per the brief, this is measured **strictly by the clock at the provider's facility, not the patient's device clock**, ensuring fair scheduling regardless of client clock tampering.

### F. Group Bookings & Consecutive Slots with Buffers
Patients can book for 1 to 4 people. Booking for $N$ people requires $N$ consecutive free slots with the same specialist:
- If a specialist has 30m duration + 10m buffer, a party of 2 occupies two consecutive slots (e.g. `10:00` and `10:40`).
- If `10:40` is booked, `10:00` cannot accommodate a 2-person booking and is disabled with the reason: *"Requires 2 consecutive free slots (1 available)"*.
- The confirmation modal itemizes the full appointment window (e.g., `10:00 – 11:10`).

### G. Reschedule Flow (`existingBooking`)
The mock dataset includes `existingBooking` (`BK-20261008-0042` with Dr. A. Wongsakul on Day 3 at 11:20):
- Activating Reschedule Mode (via Dev Panel or direct action) highlights the existing booking.
- When the customer selects a new slot, the confirmation dialog renders a side-by-side **Reschedule Delta Comparison**:
  - Previous Booking: Strikethrough date & time in rose.
  - New Target Slot: Highlighted date & time in emerald with green check badge.
- Submitting updates `PUT /api/booking/bookings/:id`, freeing the previous slot in memory and reserving the new slot.

### H. "Someone Else Got There First" (409 Conflict Handling)
If another patient takes a slot between selection and confirmation (or when 409 simulation is enabled):
- The API returns `409 Conflict` along with the `closestAvailableSlots` on that date.
- The UI retains all entered patient information (name, email, phone, medical notes) without resetting the form.
- An empathetic alert renders 1-click alternative buttons (e.g. *"Select 10:40 (Bangkok) / 08:45 (Kathmandu)"*), allowing instantaneous recovery without restarting the flow.

### I. Developer & Evaluator Dev Panel
A floating **Task 2 & 3 Dev Panel** in the bottom-right corner provides immediate testing controls:
- **Simulate Gateway Errors**: Fail next checkout, simulate partial failure on 2nd provider group, fail quantity update.
- **Simulate 409 Conflict**: Tests slot contention recovery and closest alternative recommendations.
- **Simulate Offline Mode**: Validates offline warnings and transaction prevention.
- **Artificial Latency Slider**: 0ms to 2000ms.
- **Reset Database**: Restores the cart and booking state back to pristine sample data.

---

## 5. Test Suite Summary

The automated unit test suite covers 36 comprehensive test cases across all tasks:

```
> medex-assessment@0.1.0 test
> npx tsx --test src/features/**/__tests__/*.test.ts

✔ Slot Rule - Generates slots repeating every (duration + buffer) up to endTime
✔ Provider Opening Hours Overlap - Saturday truncation
✔ Provider Closed Day - Sunday returns 0 slots
✔ Today Past Slots Cutoff - Measured by provider clock
✔ Group Booking Consecutive Slots - Requires N consecutive free slots with buffers
✔ Conflict Resolution - Finds closest available alternatives on 409
✔ 90-Day Calendar Availability & Time Conversion Helpers
✔ Timezone Normalizer - Handles all messy dataset strings
✔ Timezone Differential & Explanations
✔ Two Clocks & Cross-Midnight Boundary Calculation
✔ Checkout Audit - FREESHIP coupon waives delivery fees across provider currencies
✔ Checkout Audit - Currency formatter handles lowercase strings and decimal formatting
✔ Checkout Audit - Empty group disappears and recalculates total metrics
✔ Checkout Audit - Group-isolated checkout correctly isolates single package
✔ Checkout Audit - Patient Details Validation logic distinguishes Physical vs Consultation items
✔ Coupons - Percentage discount applied across multiple currencies
✔ Coupons - Fixed discount clamped to prevent negative balance
✔ Coupons - Rejects invalid promo code with helpful error
✔ Checkout Idempotency - Same key returns original order without duplication
✔ Guest Cart Merge - Handles all 4 dataset overlap scenarios accurately
✔ Split Engine - Never mix currencies in subtotal calculation
✔ Split Engine - Wellness items remain unpriced until duration option is selected
✔ Split Engine - Detects unavailable products and marks package ineligible for checkout
✔ Split Engine - Delivery fee calculations and free tier thresholds
✔ Facets - Disjunctive faceting with city filter
✔ Facets - Disambiguation of categories sharing the ultrasound slug
✔ Facets - Multi-currency price isolation (never mix THB and NPR)
✔ Grouping - Services grouped by provider with correct active filter count
✔ Task 1: DEFAULT_FILTER_STATE provides a clean baseline
✔ Task 1: Cart item addition & split engine normalization
✔ Task 1: Wellness items without selected duration remain unpriced until chosen
✔ Pricing - Standard percentage discount and percentage service charge
✔ Pricing - Flat amount discount and flat amount service charge
✔ Pricing - Awkward data case: discount exceeds price (clamped to prevent negative)
✔ Pricing - Zero price service (Free Consultation)
✔ Pricing - Wellness service duration options & lowest option detection

36 passing (100% test pass rate)
```

---

## 6. Trade-offs Accepted & Deliberate Exclusions

1. **In-Memory Mock State vs. Persistent Database**:
   - *Decision*: Next.js API routes store active appointments in memory with dynamic `dayOffset` initialization.
   - *Trade-off*: Server restarts re-initialize mock bookings. In production, this would be backed by PostgreSQL with transactional row-level locks (`SELECT ... FOR UPDATE`) or Redis distributed locks.
2. **Simplified Holiday Calendar vs. Regional Public Holiday APIs**:
   - *Decision*: Handled the specific closures provided in `public/data/task3-booking.json` (`Public holiday`, `Staff training day`).
   - *Trade-off*: In production, clinics would integrate with national calendar services (e.g. Songkran in Thailand, Dashain/Tihar in Nepal, Diwali in India) to automatically block out national holidays.
3. **90-Day Calendar Windowing**:
   - *Decision*: Pre-calculated availability across 90 days with 7-day paginated view on mobile/desktop.
   - *Trade-off*: Fast and zero lag for realistic volumes (90 days × 3 specialists); for infinite horizons, a virtualized monthly calendar grid would be deployed.

---

## 7. Future Production Enhancements

1. **Calendar Sync Integrations (iCal / Google Calendar / Outlook)**:
   - Direct download of `.ics` files and one-click "Add to Google Calendar" buttons embedding dual-timezone start/end times and hospital address maps.
2. **Flight & Transit Buffer Guidance**:
   - For medical travelers booking check-ups in another country, integrating flight arrival time inputs to automatically warn if an appointment slot is too close to scheduled flight touchdown.
3. **Automated WhatsApp / SMS Reminders with Timezone Context**:
   - Automated message dispatch alerting patients 24 hours prior in their local time and reminding them of the hospital's local arrival hour.
4. **Recurring Consultations**:
   - Multi-week follow-up appointment series with automatic conflict resolution across provider schedule shifts.

---

## 8. AI Tool Disclosure

As required by the assessment brief:
- **AI Tool Used**: Antigravity Assistant (Google DeepMind agentic coding model).
- **Usage Area**: Assisted in generating TypeScript domain models matching `task2-cart.json` and `task3-booking.json`, crafting regex patterns for free-text timezone normalization, generating unit test suites for edge cases, and authoring accessible UI components according to MedEx design tokens.
- All code, business rules, timezone conversion algorithms, order splitting logic, and architectural choices have been reviewed, tested, and can be fully explained during the technical interview.
