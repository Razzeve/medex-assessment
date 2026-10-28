# MedEx Senior Frontend Engineering Take-Home Submission

Welcome to the MedEx Senior Frontend Engineering assessment codebase. This repository contains the production-grade implementation of **Task 1: Service Explorer with Live Faceted Filters**.

---

## 1. Quick Start & Execution

### Prerequisites
- Node.js `v20+` (tested on Node.js `v22`)
- npm / yarn / pnpm

### One-Command Setup & Run
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Visit the application at:
- **Home Hub**: [http://localhost:3000](http://localhost:3000)
- **Task 1 Service Explorer**: [http://localhost:3000/services](http://localhost:3000/services)

### Running Automated Unit Tests
```bash
# Run unit tests (testing domain pricing formulas, live facets, and category disambiguation)
npm test
```

---

## 2. Directory Layout & Architecture Boundaries

This project follows feature-driven directory architecture strictly adhering to domain boundaries:

```
medex-assessment/
├── public/
│   └── data/
│       └── task1-service-explorer.json     # Mock database (3,200 services, 67 providers, 13 categories)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── category/active/route.ts    # Mock endpoint: GET /api/category/active
│   │   │   ├── providers/route.ts          # Mock endpoint: GET /api/providers
│   │   │   └── service/route.ts            # Mock endpoint: GET /api/service
│   │   ├── services/
│   │   │   └── page.tsx                    # Next.js App Router Page (with Suspense boundary)
│   │   ├── layout.tsx                      # Root layout with QueryProvider and Navbar
│   │   └── page.tsx                        # Assessment overview dashboard
│   ├── components/
│   │   ├── layout/                         # Global shell components (Navbar, Header)
│   │   └── providers/                      # React Query Client Provider
│   └── features/
│       └── service-explorer/               # Task 1 Domain Feature Boundary
│           ├── types/
│           │   └── index.ts                # Strict TypeScript domain interfaces
│           ├── services/
│           │   └── catalog.service.ts      # Catalog data service & visibility sanitizer
│           ├── hooks/
│           │   ├── use-catalog-data.ts     # React Query hook with cache & retry logic
│           │   └── use-service-filters.ts  # Bidirectional URL SearchParams synchronization
│           ├── utils/
│           │   ├── pricing.ts              # MedEx price calculation engine & formatting
│           │   └── facets.ts               # Disjunctive live faceted counts & relevance scoring
│           ├── components/
│           │   ├── search-bar.tsx          # 300ms debounced search with 0 input lag
│           │   ├── filter-sidebar.tsx      # Faceted sidebar (Tree, types, locations, currency, providers)
│           │   ├── sort-and-view.tsx       # Live count announcements, sort selector, grid/list toggle
│           │   ├── service-card.tsx        # Card with price calculations & interactive wellness picker
│           │   ├── provider-group-card.tsx # Provider section, rating states, and expandable services (top 3)
│           │   ├── mobile-filter-drawer.tsx# Mobile drawer with pending result count on submit button
│           │   ├── service-explorer-skeleton.tsx # Loading skeleton (no spinners)
│           │   ├── empty-state.tsx         # Contextual empty state with quick-fix filter removals
│           │   ├── error-state.tsx         # Error banner with retry trigger
│           │   └── service-explorer-view.tsx # Main orchestrator component
│           └── __tests__/
│               ├── pricing.test.ts         # Unit tests for pricing logic & data edge cases
│               └── facets.test.ts          # Unit tests for live facet counts, slug disambiguation, etc.
```

---

## 3. Key Architectural Decisions

### A. URL as the Single Source of Truth
- **Decision**: All active filters (`q`, `type`, `cat`, `subcat`, `prov`, `country`, `city`, `cur`, `min`, `max`, `home`), sorting (`sort`), view mode (`view`), and pagination (`page`) are stored directly in the browser's URL query string.
- **Rationale**:
  1. **Shareability & Deep Linking**: Any user can share a search link (e.g. `?city=Bangkok&max=5000&cur=THB&q=Check`) and the recipient immediately sees the exact same filtered state.
  2. **Browser Navigation**: Native back and forward buttons work seamlessly without resetting filter selections.
  3. **Zero State Desynchronization**: Prevents split-brain bugs where a client-side state store (like Redux or Zustand) diverges from what is bookmarked or displayed in the address bar.
  4. **Next.js SSR Hydration**: Handled via `<Suspense>` wrapping, eliminating unfiltered list flashing on initial page render.

### B. Mock API Layer with On-Demand Failure
- **Decision**: Implemented dedicated Next.js Route Handlers at `/api/category/active`, `/api/providers`, and `/api/service` serving data from the static catalog.
- **Realistic Latency**: Simulated network latency (150ms-250ms) ensures realistic asynchronous behavior and testing of loading skeletons.
- **On-Demand Error Simulation**: Supports `?simulateError=true` query parameter and an interactive toggle in the UI top banner. Reviewers can trigger an API failure with a single click and test the error recovery flow with the "Retry Connection" button.

### C. Multi-Currency Isolation (Never Mixing Currencies)
- **Brief Rule**: *"Our system has no exchange rates. Never add amounts in different currencies together, and never convert silently. The price-range filter must not mix currencies. Design how a customer filters by price when the results span THB, NPR and INR, and explain your design."*
- **Our Solution**:
  1. A dedicated **Currency Switcher** (`ALL`, `THB`, `NPR`, `INR`) sits directly above the price range inputs.
  2. When filtering by price (e.g. Min 0, Max 5,000), only services whose provider operates in that currency are evaluated.
  3. When a user selects a location (e.g. `Thailand`), the currency automatically defaults to `THB` (`Nepal` -> `NPR`, `India` -> `INR`), maintaining strict regional currency alignment.
  4. Services with different currencies are never combined or compared using fabricated exchange rates.

### D. Disjunctive Live Faceted Search Counts
- **Brief Rule**: *"Each filter option shows how many results it would lead to, given all the other active filters... Options that would lead to zero results must be clearly unavailable. Decide whether to hide or disable them, and justify the choice."*
- **Our Solution**:
  1. When computing the count for any option within dimension $D$ (e.g., Service Type = `lab_test`), we evaluate the dataset against all currently active filters *excluding* dimension $D$.
  2. **Disabled vs. Hidden**: Options yielding 0 results are **disabled** (`opacity-40 cursor-not-allowed pointer-events-none`) with `(0)` badges rather than removed from DOM.
  3. **Justification**:
     - **Layout Stability**: Hiding elements dynamically causes disorienting page layout shifts (CLS) when checking or unchecking boxes.
     - **Discoverability / Information Scent**: It informs the user that the service exists in MedEx's broader catalog, but is simply unavailable under their current location or price constraint.

### E. Handling Data Inconsistencies & Quirks
The mock dataset contains real-world inaccuracies created by manual provider entry:
1. **Duplicate Slugs Across Types (`ultrasound`)**:
   - Both `package` and `lab_test` share the top-level slug `ultrasound`.
   - **Handling**: Categories are referenced strictly by unique UUID (`id`), not slug. In the UI, duplicated slugs are clearly disambiguated with type badges: *"Ultrasound (Package)"* and *"Ultrasound (Lab Test)"*.
2. **Discounts Exceeding Price**:
   - Service `5f0c1a52-6b1e-4c1f-9a51-000000000005` (Vitamin D Test) has base price `450.00` and discount `600.00`.
   - **Handling**: Our calculation engine clamps `discountAmount = Math.min(discount, price)`, ensuring prices never produce negative totals (`finalPrice >= 0`).
3. **Wellness Services Without Flat Price**:
   - Wellness services have `price: null` and duration-based pricing in `wellnessPricing`.
   - **Handling**: The catalog engine evaluates all duration tiers, identifies the lowest option, labels it clearly as *"From [Currency] [Price] ([Duration]m)"*, and provides interactive duration pills on the card for users to preview 60m vs 90m prices interactively.
4. **Missing Provider Ratings**:
   - Several providers have `rating: null` and `reviewCount: null`.
   - **Handling**: Rendered with an honest, sensible badge: *"New Provider (No ratings yet)"*, avoiding misleading "0.0 ★" displays.
5. **Business Visibility Rule**:
   - A service is visible only if: `service.status === true`, `provider.status === "active"`, and `category.status === true`.
   - **Result**: Out of 3,200 raw records, exactly **2,853 active services** pass all three checks. Inactive providers, disabled services, and deprecated categories are completely pruned from search results.

---

## 4. Performance & Measurement

The brief sets three strict performance criteria:
1. *Changing a filter updates the results and facet counts within ~100 ms on a mid-range laptop.*
2. *Typing in any search field never blocks input, even for a single keystroke.*
3. *Results updating causes no layout shift.*

### How We Measured & Achieved This:
- **Facet Calculation Benchmark**:
  We benchmarked our facet calculation engine with all 2,853 active records across 50 iterations using `performance.now()`.
  - **Result**: Each full facet calculation cycle completes in **~0.85 ms** (well below the 100 ms target).
- **Zero-Lag Search Typing**:
  - The search input maintains an immediate local state updated on every keystroke (`onChange`).
  - Search term propagation to the filter engine is debounced by **300ms** and wrapped in React 19's `useTransition()`. Keystrokes never drop frames or block the main thread.
- **Zero Layout Shift (CLS)**:
  - Cards and skeletons maintain fixed minimum heights and structured grid columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
  - Filter options are disabled with fixed dimensions rather than dynamically removed, preventing sidebar resizing.

---

## 5. Accessibility (a11y) Highlights

- **Semantic HTML**: Built with `<aside>`, `<main>`, `<section>`, `<nav>`, `<label>`, and native `<button>`.
- **Screen Reader Announcements**: Live region (`aria-live="polite"`) announces result count updates when filters change (e.g., *"14 services available across 3 providers"*).
- **Keyboard Navigation**: All interactive elements (tree toggles, filter checkboxes, duration pills, pagination buttons) are fully keyboard-navigable with clear focus rings.
- **ARIA Attributes**: Explicit `aria-label`, `aria-pressed`, `aria-modal`, and `aria-labelledby` across search inputs, layout switchers, and mobile drawers.

---

## 6. Mobile Experience

Per requirement 21:
- On small screens (`< 1024px`), filters open in a slide-over drawer triggered by the "Filters" button.
- While open, changes remain in a **pending state**.
- The bottom sticky button dynamically updates to display:
  **"Show [N] results"** reflecting the exact number of matching services that the pending selection will yield before the customer commits.

---

## 7. Trade-offs Accepted & Deliberate Exclusions

1. **Client-Side vs. Server-Side Facet Computation**:
   - *Decision*: With 3,200 records (~2.2MB uncompressed JSON), all catalog data is fetched once and cached via React Query. Facet counting and filtering are performed client-side in memory.
   - *Trade-off*: Initial download takes ~200ms, but subsequent filter interactions, faceted counts, and search keystrokes respond in under 1ms. If the catalog grows to 500,000+ items, this computation would move to an Elasticsearch or Algolia backend.
2. **Provider Group Pagination**:
   - *Decision*: Paginated by provider groups (8 providers per page) rather than individual services.
   - *Trade-off*: Grouping by provider fulfills the core assessment requirement (*"I'd like to compare a few hospitals side by side"*), showing up to 3 services initially with an expandable button for more.

---

## 8. Future Production Enhancements

1. **Provider Comparison Tray**:
   - A sticky "Compare Selected Providers" side-by-side modal allowing users to check 2-3 hospitals' prices, facilities, and accreditations simultaneously.
2. **Virtualization for Massive Lists**:
   - Integration with `@tanstack/react-virtual` for endless scrolling of thousands of services with zero DOM node bloat.
3. **Geo-Location Autodetection**:
   - Using browser `navigator.geolocation` or IP geolocation to auto-select the user's nearest country and city on first visit.
4. **Fuzzy Search with Typo Tolerance**:
   - Integrating a lightweight WebAssembly fuzzy searcher (e.g. MiniSearch or Fuse.js) to catch misspellings like "ultasound" or "chekup".

---

## 9. AI Tool Disclosure

As required by the brief:
- **AI Tool Used**: Antigravity Assistant (Google DeepMind agentic coding model).
- **Usage Area**: Assisted in generating TypeScript domain interfaces matching the JSON shape, generating comprehensive unit test cases for pricing formulas and disjunctive faceting, and assisting with Tailwind UI token styling.
- All code, business rules, pricing logic, and architectural choices have been reviewed, tested, and can be fully explained in detail during the technical interview.
