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
# Run all 28 unit tests (Task 1 pricing/facets + Task 2 split engine, merge, coupons, idempotency + Task 3 timezones, slots, buffers, overlaps)
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
│   │   │   ├── booking/
│   │   │   │   ├── providers/route.ts      # Mock endpoint: GET /api/booking/providers (all providers + existingBooking)
│   │   │   │   ├── providers/[providerId]/
│   │   │   │   │   ├── route.ts            # Mock endpoint: GET /api/booking/providers/:id
│   │   │   │   │   └── slots/route.ts      # Mock endpoint: GET /api/booking/providers/:id/slots (calendar & day slots)
│   │   │   │   └── bookings/
│   │   │   │       ├── route.ts            # Mock endpoint: POST /api/booking/bookings (201 / 409 conflict)
│   │   │   │       └── [id]/route.ts       # Mock endpoint: PUT /api/booking/bookings/:id (reschedule 200 / 409)
│   │   │   ├── cart/
│   │   │   │   ├── route.ts                # Mock endpoint: GET /api/cart
│   │   │   │   ├── items/[lineId]/route.ts # Mock endpoint: PATCH, DELETE /api/cart/items/:lineId
│   │   │   │   └── merge/route.ts          # Mock endpoint: POST /api/cart/merge
│   │   │   ├── checkout/route.ts           # Mock endpoint: POST /api/checkout (idempotency support)
│   │   │   ├── orders/[orderId]/route.ts   # Mock endpoint: GET /api/orders/:orderId
│   │   │   ├── category/active/route.ts    # Task 1 category route
│   │   │   ├── providers/route.ts          # Task 1 providers route
│   │   │   └── service/route.ts            # Task 1 service route
│   │   ├── booking/
│   │   │   └── page.tsx                    # Next.js App Router: Multi-Timezone Appointment Booking Page
│   │   ├── cart/
│   │   │   └── page.tsx                    # Next.js App Router: Cart Review & Split Packaging
│   │   ├── checkout/
│   │   │   └── page.tsx                    # Next.js App Router: 3-Step Checkout Flow
│   │   ├── services/
│   │   │   └── page.tsx                    # Task 1 Service Explorer Page
│   │   ├── layout.tsx                      # Root layout with QueryProvider and Navbar
│   │   └── page.tsx                        # Assessment overview dashboard
│   ├── components/
│   │   ├── layout/navbar.tsx               # Global navigation bar with direct task links
│   │   └── providers/                      # React Query Client Provider
│   └── features/
│       ├── service-explorer/               # Task 1 Domain Feature Boundary
│       ├── cart-checkout/                  # Task 2 Domain Feature Boundary
│       └── booking-scheduler/              # Task 3 Domain Feature Boundary
│           ├── types/
│           │   └── index.ts                # Strict domain types: Provider, Specialist, ScheduledSlot, DayAvailability, Booking
│           ├── utils/
│           │   ├── timezone.ts             # Timezone normalizer, offset math, 2-clock converter, cross-midnight boundary detector
│           │   └── slots.ts                # Slot generator, provider hours overlap truncation, past slot filter, consecutive slots
│           ├── services/
│           │   ├── mock-db.ts              # In-memory mock server database with latency & 409 conflict simulator
│           │   └── booking.service.ts      # Typed client API service wrapper
│           ├── hooks/
│           │   └── use-booking-scheduler.ts# React Query hooks for providers, 90-day calendar, day slots, booking & reschedule
│           ├── components/
│           │   ├── PractitionerCard.tsx    # Specialist profile, native timezone badge, hospital hours, overlap warning
│           │   ├── TimezoneSelector.tsx    # Searchable patient timezone selector with live ticking dual-clocks & relative offset banner
│           │   ├── DatePickerCarousel.tsx  # 90-day interactive date carousel with availability badges, week pagination & keyboard nav
│           │   ├── SlotGrid.tsx            # Slots grouped into Morning/Afternoon/Evening with two-clock display on every card
│           │   ├── GroupSizeSelector.tsx   # 1 to 4 people picker with consecutive slot & buffer guidance
│           │   ├── ConflictResolutionBanner.tsx # Empathetic 409 conflict alert with preserved input state & closest slots
│           │   ├── BookingConfirmationModal.tsx # Dual-timezone modal, patient contact inputs, reschedule delta comparison
│           │   ├── DevPanel.tsx            # Floating developer panel (409 conflict, 500 error, offline, latency slider, provider switcher)
│           │   └── BookingSchedulerView.tsx# Orchestrating view component
│           └── __tests__/
│               ├── timezone.test.ts        # Normalization of messy tz strings, country fallback, dual clock, cross-midnight day transition
│               └── slots.test.ts           # Slot rule, Saturday hospital cutoff, Sunday closure, provider past cutoff, group consecutive slots
```

---

## 3. Task 3: Architecture & Technical Decisions

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
A floating **Task 3 Dev Panel** in the bottom-right corner provides immediate testing controls:
- **Provider Switcher**: Switch between Bangkok, Kathmandu, Pokhara, Lumbini, and Gurgaon.
- **Reschedule Flow Toggle**: Toggles modifying `BK-20261008-0042`.
- **Simulate 409 Conflict**: Tests slot contention recovery and closest alternative recommendations.
- **Simulate 500 Error**: Tests API failure banner and inline retry button.
- **Simulate Offline Mode**: Validates offline warnings and booking confirmation prevention.
- **Artificial Latency Slider**: 0ms to 2000ms.
- **Reset Database**: Restores the dataset back to initial state.

---

## 4. Test Suite Summary

The automated unit test suite covers 28 comprehensive test cases across all tasks:

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
✔ Pricing - Standard percentage discount and percentage service charge
✔ Pricing - Flat amount discount and flat amount service charge
✔ Pricing - Awkward data case: discount exceeds price (clamped to prevent negative)
✔ Pricing - Zero price service (Free Consultation)
✔ Pricing - Wellness service duration options & lowest option detection

28 passing (100% test pass rate)
```

---

## 5. Trade-offs Accepted & Deliberate Exclusions

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

## 6. Future Production Enhancements

1. **Calendar Sync Integrations (iCal / Google Calendar / Outlook)**:
   - Direct download of `.ics` files and one-click "Add to Google Calendar" buttons embedding dual-timezone start/end times and hospital address maps.
2. **Flight & Transit Buffer Guidance**:
   - For medical travelers booking check-ups in another country, integrating flight arrival time inputs to automatically warn if an appointment slot is too close to scheduled flight touchdown.
3. **Automated WhatsApp / SMS Reminders with Timezone Context**:
   - Automated message dispatch alerting patients 24 hours prior in their local time and reminding them of the hospital's local arrival hour.
4. **Recurring Consultations**:
   - Multi-week follow-up appointment series with automatic conflict resolution across provider schedule shifts.

---

## 7. AI Tool Disclosure

As required by the assessment brief:
- **AI Tool Used**: Antigravity Assistant (Google DeepMind agentic coding model).
- **Usage Area**: Assisted in generating TypeScript domain models matching `task3-booking.json`, crafting regex patterns for free-text timezone normalization, generating unit test suites for edge cases, and authoring accessible UI components according to MedEx design tokens.
- All code, business rules, timezone conversion algorithms, and architectural choices have been reviewed, tested, and can be fully explained during the technical interview.
