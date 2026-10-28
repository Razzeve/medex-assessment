# MedEx Senior Frontend Engineering Take-Home Submission

Welcome to the MedEx Senior Frontend Engineering assessment codebase. This repository contains the production-grade implementation of:
1. **Task 1: Service Explorer with Live Faceted Filters** (`/services`)
2. **Task 2: Multi-Provider Cart & Split Checkout Flow** (`/cart`, `/checkout`)

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

### Running Automated Unit Tests
```bash
# Run all unit tests (18 tests covering Task 1 pricing/facets + Task 2 split engine, merge, coupons, idempotency)
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
│       └── task3-booking.json              # Mock booking database
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cart/
│   │   │   │   ├── route.ts                # Mock endpoint: GET /api/cart
│   │   │   │   ├── items/[lineId]/route.ts # Mock endpoint: PATCH, DELETE /api/cart/items/:lineId
│   │   │   │   └── merge/route.ts          # Mock endpoint: POST /api/cart/merge
│   │   │   ├── checkout/route.ts           # Mock endpoint: POST /api/checkout (idempotency support)
│   │   │   ├── orders/[orderId]/route.ts   # Mock endpoint: GET /api/orders/:orderId
│   │   │   ├── category/active/route.ts    # Task 1 category route
│   │   │   ├── providers/route.ts          # Task 1 providers route
│   │   │   └── service/route.ts            # Task 1 service route
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
│       │   ├── types/                      # Domain interfaces
│       │   ├── services/                   # Catalog service
│       │   ├── hooks/                      # Filter & query hooks
│       │   ├── utils/                      # Pricing formulas & disjunctive facets
│       │   ├── components/                 # Filter sidebar, search bar, service cards
│       │   └── __tests__/                  # Unit tests for pricing and facets
│       └── cart-checkout/                  # Task 2 Domain Feature Boundary
│           ├── types/
│           │   └── index.ts                # Strict domain types: Cart, SplitPackage, Orders, Coupons
│           ├── services/
│           │   ├── mock-db.ts              # In-memory mock server database with latency & error hooks
│           │   └── cart.service.ts         # Client API service wrapper
│           ├── store/
│           │   ├── useCartStore.ts         # Zustand store with persist, optimistic updates & rollback
│           │   └── selectors.ts            # Resilient memoized selectors to minimize re-renders
│           ├── utils/
│           │   ├── split-engine.ts         # Multi-provider fulfillment partitioning & fee calculations
│           │   ├── currency.ts             # Strict multi-currency formatting & isolation helpers
│           │   ├── merge.ts                # Guest cart merge engine handling all 4 dataset overlaps
│           │   └── coupons.ts              # Multi-currency promotional voucher engine
│           ├── components/
│           │   ├── CartView.tsx            # Main cart page container
│           │   ├── CartItemRow.tsx         # Individual item row with optimistic controls & wellness picker
│           │   ├── VendorGroupCard.tsx     # Partitioned provider package card with discrete fees & timelines
│           │   ├── OrderSummary.tsx        # Multi-currency breakdown, coupon entry, and checkout CTA
│           │   ├── CheckoutView.tsx        # Checkout container
│           │   ├── CheckoutStepper.tsx     # 3-Step Stepper (Split Review -> Patient -> Payment & Execution)
│           │   ├── EmptyCartState.tsx      # Empty state with "Browse Services" and "Restore Sample" CTAs
│           │   ├── GuestCartMergeBanner.tsx# Guest cart detection banner with itemized audit log
│           │   └── DevPanel.tsx            # Test controls (Latency slider, partial failure & 409 toggles)
│           └── __tests__/
│               ├── split-engine.test.ts    # Subtotal isolation, itemCount sums, fee thresholds, unpriced flags
│               ├── merge.test.ts           # 4 guest cart merge cases against public/data/task2-cart.json
│               ├── coupons.test.ts         # Percentage and clamped fixed discount calculations
│               └── idempotency.test.ts     # Duplicate prevention via idempotency keys
```

---

## 3. Task 2: Architecture & Technical Decisions

### A. Domain Modeling & Healthcare Realities
MedEx connects patients across **Thailand (THB)**, **Nepal (NPR)**, and **India (INR)**. Because cross-border healthcare pricing is subject to independent banking and healthcare regulatory systems, MedEx operates under a core business rule:
> **"Our system has no exchange rates. Never add amounts in different currencies together, and never convert silently."**

Our domain models (`src/features/cart-checkout/types/index.ts`) enforce this strictly:
- Group and order subtotals are modeled as `Record<string, number>` (`{ THB?: number; NPR?: number; INR?: number }`).
- Currency formatting utilities in `utils/currency.ts` keep each regional currency isolated.
- The UI never displays an amalgamated total; instead, it renders itemized currency settlements (e.g. `฿16,907 + NPR 12,770 + ₹23,009.50`) with clear customer explanations.

### B. Order Splitting & Fulfillment Packaging Engine
In healthcare e-commerce, services cannot be fulfilled identically:
- **Lab Diagnostic Tests (`lab_test`)**: Dispatches a licensed phlebotomist to the patient's residence for home sample collection (07:00 - 11:00 AM). Delivery fees apply (e.g. ฿120 / NPR 250) unless subtotal exceeds the free threshold (฿3,000 / NPR 10,000).
- **Hospital / Clinic Check-Ups (`package`)**: Generates an arrival pass for priority check-in at medical facilities. Free fulfillment fee.
- **Spa & Wellness Treatments (`wellness`)**: Facility appointment booking. Free fulfillment fee.
- **Doctor Services & Vaccines (`service`)**: Clinical check-in schedule. Free fulfillment fee.
- **Digital Health Cover (`insurance`)**: Instant digital policy certificate dispatched to patient email.

The `createSplitPackage()` utility in `utils/split-engine.ts` dynamically transforms raw cart groups into structured `SplitPackage` domain objects containing fulfillment types, dispatch timelines, discrete delivery fees, and validation checks.

### C. Wellness Pricing & Duration Selection
Wellness offerings (e.g. *Signature Facial*) do not have a flat price (`price: null`, `priceUnknown: true`). Instead, they require a duration option (e.g., 60 minutes vs. 90 minutes):
1. In `CartItemRow.tsx`, wellness items lacking a selected duration are visually highlighted with an interactive duration picker.
2. The item unit price is explicitly displayed as **"Duration required"** and is **never counted as zero**.
3. In `utils/split-engine.ts`, `isItemWellnessUnpriced()` flags the item, incrementing `unpricedItems` and preventing the package from being checked out until a duration is chosen.
4. Once selected, `updateWellnessDuration()` updates the item optimistically and syncs with the server via `PATCH /api/cart/items/:lineId`.

### D. Unavailable / Delisted Items
In `public/data/task2-cart.json`, the `unknown` group contains a service with an empty product definition (`product: {}`), representing a provider who discontinued or delisted the service:
1. `isItemUnavailable()` identifies any product lacking title and metadata.
2. The row renders an informative red alert: *"Discontinued Provider Service: This provider has delisted or altered this offering. It cannot be checked out and must be removed to continue."*
3. A 1-click **"Remove Item"** button enables the patient to clear the blocking item with zero friction.
4. The package is marked `eligibleForCheckout: false` with explicit blocking reason announcements until the item is removed.

### E. Optimistic Updates & Race Condition Prevention
When modifying quantities in high-latency environments:
- Requirement 2 mandates: *"Quantity changes are optimistic. The UI updates immediately. If the server rejects the change, the UI rolls back and tells the customer why. A customer who taps '+' five times quickly must end up with the right quantity, with no flicker, and the five requests must not race and overwrite each other out of order."*
- **Our Implementation**:
  1. `pendingLineUpdates` maintains a monotonic sequence counter per line item.
  2. `confirmedQuantities` tracks the last verified server quantity.
  3. Clicking `+` or `-` updates the local Zustand store immediately, eliminating UI lag or flicker.
  4. The PATCH request dispatches with the target quantity.
  5. If responses arrive out of order, the store discards any payload whose sequence number is older than the current sequence for that item.
  6. If the server rejects the update (e.g. 409 Conflict simulated via DevPanel), the store rolls back to `confirmedQuantities[lineId]` and surfaces an accessible toast notification explaining why the change was reverted.

### F. Multi-Step Split Checkout Flow
Accessible at `/checkout` (or `/checkout?group=...` for single package checkout):
- **Step 1: Multi-Provider Split Review**:
  Displays the partitioned fulfillment packages, assigned partner clinics, dispatch timelines, and discrete currency amounts.
- **Step 2: Patient Profile & Fulfillment Details**:
  Collects patient legal name, email for digital passes, phone for phlebotomist coordination, physical address for sample dispatch, and optional medical notes. Form validation highlights missing fields.
- **Step 3: Multi-Package Settlement & Execution**:
  Allows selecting discrete payment methods per package (`Direct Online Card Payment` vs. `Pay in Person at Clinic`). Patients can execute the entire split order at once or settle packages individually.

### G. Partial Failure & Idempotency Key Architecture
Partial failure is a core real-world challenge in multi-provider marketplaces where one provider gateway may time out while another succeeds:

```
[Start Split Checkout]
         │
         ▼
 ┌───────────────┐
 │ Group 1: Labs │ ───► [POST /api/checkout] ───► Status: PAID (Order #MDX-LAB-...) ✓
 └───────────────┘
         │
         ▼
 ┌───────────────┐
 │ Group 2: Spa  │ ───► [POST /api/checkout] ───► Status: FAILED (Gateway Timeout 500) ✗
 └───────────────┘
         │
         ▼
 ┌───────────────────────┐
 │ Group 3: Health Check │ ───► [POST /api/checkout] ───► Status: PAID (Order #MDX-PAC-...) ✓
 └───────────────────────┘
         │
         ▼
[Customer Feedback & Retry Recovery]
 • Group 1 & Group 3 remain confirmed and safe (NEVER lost or double-billed)
 • Group 2 shows detailed error card with [Retry This Order] button
 • Clicking [Retry] sends the original Idempotency Key:
   Backend verifies idempotency store to prevent duplicate billing
```

- Each group checkout generates or reuses an `idempotencyKey` (`idemp_${groupType}_${timestamp}_${uuid}`).
- In `src/app/api/checkout/route.ts`, if an idempotency key has already been executed, the existing order is returned immediately without creating a new order.
- In `CheckoutStepper.tsx`, retrying a failed package invokes `retryFailedGroupCheckout()`, reusing the identical key.

### H. Reload Safety
- Patient orders and in-flight checkout sessions are stored in Zustand and synchronized to `localStorage` via Zustand's `persist` middleware (`medex_cart_store_v1`).
- If a customer refreshes the browser, loses internet connection, or closes the tab during checkout, returning to `/checkout` or `/cart` restores the exact order statuses, reference numbers, and completed receipts.

### I. Guest Cart Merge Strategy
When a guest logs in, their client-side `guestCart` is merged into their `serverCart` via `POST /api/cart/merge`. Looking at `public/data/task2-cart.json`, all 4 overlap cases are handled deterministically:
1. **Liver Function Profile (`7bcdaf5b...`)**: Exists in server cart (qty 2) and guest cart (qty 3). The merger combines quantities: `2 + 3 = 5`.
2. **Lipid Profile (`6a92d368...`)**: Present in catalog but missing from server cart. Added to the `lab_test` group with quantity 1.
3. **Signature Facial (`5f0c1a52...`)**: Exists in server cart unpriced (no duration). In guest cart, the patient selected duration `a1b2c3d4-0000-4000-8000-000000000090` (90 min). The merge adopts the duration choice, resolving the item to ฿2,040.
4. **Discontinued Item (`6b572fa4...`)**: Not found in catalog. Safely excluded from the cart and logged in the changes audit report.

An interactive `GuestCartMergeBanner` alerts the customer to the detected guest session and provides an expandable audit log of all changes.

### J. Dev & Test Simulation Panel
Reviewers can test awkward and failure states on demand via the floating **Dev & Test Tools** panel in the bottom-right corner:
- **Network Latency Slider**: Toggle between `0ms`, `150ms`, `500ms`, and `1500ms`.
- **Fail Group 2 on Checkout (Req. 6)**: Simulates partial failure during multi-group checkout.
- **Fail Next Quantity (409 Conflict)**: Tests optimistic rollback and conflict toast.
- **Fail Next Payment (402 Declined)**: Tests card decline handling.
- **Simulate Offline Mode**: Validates offline and network error handling.
- **Reset Cart & Orders**: Restores the database back to initial state.

---

## 4. Test Suite

The automated test suite in `src/features/cart-checkout/__tests__/` validates domain invariants:
- `split-engine.test.ts`:
  - Isolates multi-currency subtotals (never sums THB and NPR).
  - Sums `itemCount` by quantities rather than line items.
  - Verifies delivery fee rules and free tier thresholds.
  - Flags unavailable products and marks packages ineligible for checkout.
- `merge.test.ts`:
  - Tests all 4 guest cart merge overlap scenarios from `public/data/task2-cart.json`.
- `coupons.test.ts`:
  - Validates promo codes (`MEDEX10`, `HEALTH500`, `FREESHIP`).
  - Tests percentage discounts across multiple currencies and clamping to avoid negative amounts.
- `idempotency.test.ts`:
  - Verifies that replay requests with the same idempotency key return the original order.

Run with:
```bash
npm test
```

---

## 5. Trade-offs Accepted & Deliberate Exclusions

1. **In-Memory Mock Database vs. External DB**:
   - *Decision*: Simulated Next.js Route Handlers (`/api/cart`, `/api/checkout`, etc.) persist state in memory with local storage backup.
   - *Trade-off*: Server restarts reset the in-memory store, but client state survives via Zustand `persist`. For production, this would connect to PostgreSQL / Redis with row-level locking for inventory reservation.
2. **Sequential vs. Concurrent Split Checkout**:
   - *Decision*: During "Checkout All", packages are executed sequentially in a deterministic loop.
   - *Trade-off*: Takes slightly longer than `Promise.all()`, but provides clear, human-intelligible per-package progress updates and isolates failures without unhandled promise rejections.
3. **Synthetic Payment Gateway Integration**:
   - *Decision*: Simulated card charging and clinic pay vouchers rather than integrating real Stripe / 2C2P SDKs.
   - *Trade-off*: Focuses on frontend UX state resilience, failure recovery, and idempotency guarantees as requested in the brief.

---

## 6. Future Production Enhancements

1. **Split Order Tracking & Webhooks**:
   - A live order tracking dashboard (`/orders/[orderId]`) with real-time WebSocket updates for phlebotomist dispatch and clinic arrival check-in.
2. **Cross-Provider Multi-Currency FX Preview**:
   - While settlements must remain in native currencies, providing an informational "Estimated Total in Your Home Currency (USD/EUR)" with real-time mid-market rates would improve price transparency for medical tourists.
3. **Automated Inventory Reservation Locks**:
   - Utilizing distributed Redis locks with a 15-minute checkout countdown timer to prevent appointment slot contention.

---

## 7. AI Tool Disclosure

As required by the brief:
- **AI Tool Used**: Antigravity Assistant (Google DeepMind agentic coding model).
- **Usage Area**: Assisted in generating TypeScript domain models matching the JSON shape, authoring comprehensive unit test assertions, implementing optimistic rollback state machines, and styling UI components according to MedEx design tokens.
- All code, business rules, split fulfillment logic, and architectural choices have been reviewed, tested, and can be fully explained during the technical interview.
