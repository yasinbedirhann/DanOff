# DanOff - Changelog

All changes to this project are documented here.

---

## [1.5.0] - 2026-05-31

### Testing — Playwright end-to-end test suite (47 tests, 139 total)

Added a comprehensive Playwright E2E layer on top of the existing 92 Jest tests. Tests drive a real Chromium browser against a live Express server and PostgreSQL database — no mocks.

#### New files
- `playwright.config.js` — updated from scaffold to production config: CJS, `webServer` auto-starts `node server.js`, `baseURL` = `http://localhost:3000`, Chromium-only, `workers: 1` to avoid DB contention
- `e2e/globalSetup.js` — creates RS employee (`e2e_rs@danoff.ba`) and Brčko employee (`e2e_brcko@danoff.ba`) with bcrypt-hashed passwords, seeds approved leave requests for all entity × leave-type combinations needed by document tests, and seeds pending requests for manager approval/rejection tests
- `e2e/globalTeardown.js` — removes all `e2e_*` employees and their requests after the suite
- `e2e/helpers/auth.js` — `loginAs()` helper (handles hidden radio buttons, built-in 1.3 s login delay, waits for dashboard visible + `networkidle`) and `setLeaveDates()` helper (drives flatpickr via `app._fpStart/End.setDate`)
- `e2e/app.spec.js` — 47 tests across 7 groups

#### Test coverage (47 tests)
- **Authentication (7):** login for all 5 user types, wrong-password error, logout
- **Employee — FBiH (8):** submit annual / paid / unpaid requests, pending status badge, edit pending, cancel pending, leave balance (20 days), FBiH legal document content
- **Employee — RS (4):** leave balance (18 days), submit request, RS document format, RS-specific legal reference (Službeni glasnik RS)
- **Employee — Brčko (4):** leave balance (20 days), submit request, Brčko ZAHTJEV form, Brčko-specific content
- **Manager (8):** pending kanban, approve → status change, reject → status change, approved card leaves pending column, team member list, request attribution, pending count badge, stat counters
- **Admin (10):** user list, add employee (3 entities), edit employee, delete employee, duplicate-email rejection, view all requests, approve request, delete request
- **Documents (6):** FBiH annual/paid/unpaid legal reference, RS annual legal reference, FBiH vs RS document diff, Brčko ZAHTJEV format

#### Updated files
- `package.json` — added `test:e2e` (`playwright test`) and `test:e2e:ui` (`playwright test --ui`)
- `TESTING.md` — new Playwright section with credentials table, setup/teardown description, and full 47-test case table

#### Results
All 47 Playwright tests pass. Run with: `npm run test:e2e`

---

## [1.4.0] - 2026-05-31

### Testing — Role-based test suite expansion (92 tests total)

Extended the test suite from 30 to 92 tests. Tests are now organized by role and feature area, cover all three entities (FBiH, RS, Brčko) and all three leave types (annual, sick/paid, other/unpaid), and include a standalone document-routing library with its own tests.

#### New files
- `config/entities.js` — shared entitlement config (FBiH: 20 days, RS: 18 days, Brčko: 20 days)
- `lib/pdfRouter.js` — encapsulates the entity + leave-type → PDF function routing logic from `script.js`; testable in Node.js without a browser or jsPDF
- `tests/helpers/seedData.js` — 9 test employees (3 entities × 3 roles) with Bosnian names, emails, positions, salaries; 3 sample leave requests in various states
- `tests/employee.test.js` (15 tests) — leave request submission (all 3 types), view own history, edit/delete, entitlement values per entity, push notification delivery
- `tests/manager.test.js` (10 tests) — view all requests, approve, reject, manager push notification on new submission, employee push on approve/reject, DB error handling
- `tests/admin.test.js` (15 tests) — full user CRUD across all 3 entities, cross-entity request management, role creation (employee/manager/admin), password hashing verification, DB error handling
- `tests/documents.test.js` (12 tests) — 9 entity × leave-type combinations asserting correct download function and legal reference (Zakon o radu FBiH / RS / Brčko Distrikta), plus 3 callback-routing tests
- `tests/middleware.test.js` (6 tests) — `requireAuth` middleware (missing header, valid user, unknown user, DB error), push subscribe and VAPID key endpoints
- `TESTING.md` — full test documentation: framework rationale, file structure, seed data table, and a complete table for all 92 test cases with type (positive/negative), scenario, and expected result

#### `tests/auth.test.js` — expanded from 6 to 10 tests
Added: manager login, admin login, missing email in body, missing password (bcrypt throws on undefined)

#### Results
All 92 tests pass. Run with: `npm test`

---

## [1.3.0] - 2026-05-31

### Testing — Automated API test suite (Jest + Supertest)

Added a full automated test suite covering all three REST API modules. Tests run without a real database — the PostgreSQL pool is mocked with `jest.fn()` so the suite is fully self-contained.

#### Tools used
- **Jest 30** — test runner, assertion library, and mocking framework
- **Supertest 7** — sends real HTTP requests against Express routes without binding to a port

#### `tests/auth.test.js` — 6 tests for `POST /api/auth/login`
| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Positive | Valid email, correct password, matching role | 200 + full user object (id, name, email, role, position, entity) |
| 2 | Positive | Successful login | Password hash must NOT appear in the response body |
| 3 | Negative | Email not found in database | 401 `Invalid credentials` |
| 4 | Negative | Correct email, wrong password | 401 `Invalid credentials` |
| 5 | Negative | Correct credentials but wrong role selected | 401 `Role mismatch` |
| 6 | Negative | Database throws an error | 500 `Server error` |

#### `tests/requests.test.js` — 14 tests for leave request endpoints
| # | Type | Endpoint | Scenario | Expected result |
|---|------|----------|----------|-----------------|
| 1 | Positive | `GET /api/requests` | Requests exist in DB | 200 + array of requests |
| 2 | Negative | `GET /api/requests` | DB error | 500 `Server error` |
| 3 | Positive | `GET /api/requests/employee/:id` | Employee has requests | 200 + filtered array |
| 4 | Positive | `GET /api/requests/employee/:id` | Employee has no requests | 200 + empty array |
| 5 | Positive | `POST /api/requests` | Valid payload | 200 + `{ id: <new id> }` |
| 6 | Negative | `POST /api/requests` | DB insert fails | 500 `Server error` |
| 7 | Positive | `PUT /api/requests/:id` | Status set to `approved` | 200 `{ success: true }` |
| 8 | Positive | `PUT /api/requests/:id` | Status set to `rejected` | 200 `{ success: true }` |
| 9 | Negative | `PUT /api/requests/:id` | DB error | 500 `Server error` |
| 10 | Positive | `PATCH /api/requests/:id` | Edit pending request fields | 200 `{ success: true }` |
| 11 | Negative | `PATCH /api/requests/:id` | DB error | 500 `Server error` |
| 12 | Positive | `DELETE /api/requests/:id` | Request exists | 200 `{ success: true }` |
| 13 | Negative | `DELETE /api/requests/:id` | DB error | 500 `Server error` |

*(Note: push notification functions are mocked out in this file so tests do not require VAPID credentials or live subscribers.)*

#### `tests/users.test.js` — 10 tests for employee management endpoints
| # | Type | Endpoint | Scenario | Expected result |
|---|------|----------|----------|-----------------|
| 1 | Positive | `GET /api/users` | Users exist | 200 + array of users |
| 2 | Positive | `GET /api/users` | Response shape | `password` field absent from every returned object |
| 3 | Negative | `GET /api/users` | DB error | 500 `Server error` |
| 4 | Positive | `POST /api/users` | Valid payload | 200 + `{ id: <new id> }` |
| 5 | Positive | `POST /api/users` | Password handling | `bcrypt.hash` called with plain-text; hashed value inserted — plain-text never reaches DB |
| 6 | Negative | `POST /api/users` | Duplicate email / DB error | 500 `Server error` |
| 7 | Positive | `PUT /api/users/:id` | Valid update payload | 200 `{ success: true }` |
| 8 | Positive | `PUT /api/users/:id` | `entity` omitted from body | Defaults to `fbih` in the SQL call |
| 9 | Negative | `PUT /api/users/:id` | DB error | 500 `Server error` |
| 10 | Positive | `DELETE /api/users/:id` | Valid id | 200 `{ success: true }` |
| 11 | Negative | `DELETE /api/users/:id` | DB error | 500 `Server error` |

#### `package.json`
- `"test"` script changed from error stub to `jest --testPathPatterns=tests/ --forceExit`
- `"jest": { "testEnvironment": "node" }` config block added
- `jest` and `supertest` added to `devDependencies`

#### Results
All 30 tests pass. Run with: `npm test`

---

## [1.2.5] - 2026-05-18

### Feature — Entity selector in Add/Edit User modal

Admins can now choose each employee's legal entity (Federacija BiH, Republika Srpska, or Brčko Distrikt) directly when creating or editing a user. Previously the entity was always inherited from the admin's own session entity, making it impossible to register employees from a different entity.

#### `index.html` — Add/Edit User modal
- Added an entity `<select>` field between Role and Position, with three options: `fbih` (Federacija BiH), `rs` (Republika Srpska), `brcko` (Brčko Distrikt)
- The field uses `data-i18n="entity-label"` for translation

#### `script.js`
- Added `entityLabel` translation key to both `bs` ("Entitet") and `en` ("Entity")
- `showAddUserModal()`: entity select initialised to the admin's current entity (`this.entity || 'fbih'`) as a sensible default
- `editUser()`: entity select pre-filled from `user.entity` so admins see the employee's existing entity when editing
- `saveUser()`: reads entity from `#user-entity-input` and includes it in both the POST body (new user) and the PUT body (edit user); previously the POST always sent the admin's own entity and the PUT never sent entity at all

#### `routes/users.js` — `PUT /api/users/:id`
- Destructures `entity` from `req.body`
- SQL query extended to include `entity=$4`; existing columns shifted to `$5–$8`
- Defaults to `'fbih'` if entity is missing to guard against old clients

---

## [1.2.4] - 2026-05-17

### Feature — Entity-specific legal documents (9 distinct documents)

Each leave request now generates the correct legal document based on the employee's entity (FBiH, RS, or Brčko Distrikt) and leave type (annual, sick, other). Previously a single generic FBiH annual leave template was used for all cases.

#### Document mapping
| Leave type | FBiH | RS | Brčko Distrikt |
|---|---|---|---|
| Annual (`godišnji`) | Rješenje o korištenju godišnjeg odmora | Rešenje o korišćenju godišnjeg odmora | Zahtjev za godišnji odmor |
| Sick (`plaćeno`) | Rješenje o plaćenom odsustvu | Rešenje o plaćenom odsustvu | Zahtjev za plaćeno odsustvo |
| Other (`neplaćeno`) | Rješenje o neplaćenom odsustvu | Rešenje o neplaćenom odsustvu | Zahtjev za neplaćeno odsustvo |

#### Format per entity
- **FBiH**: Paragraph-based Rješenje with legal basis (čl. 52/53/54 Zakona o radu FBiH, Sl. novine 26/16 i 89/18), numbered points, Obrazloženje section, Pouka o pravnom lijeku (30 days), POSLODAVAC signature with stamp line
- **RS**: Paragraph-based Rešenje with italic legal basis header (čl. 192 + čl. 68-75/77/78 Zakona o radu RS, Sl. glasnik RS 24/2005–75/2014), numbered points with 28mm indent, Obrazloženje, Pouka o pravnom leku (60 days, court — not employer), U/Dana location-date block, signature line with label, Dostavljeno list, footnote(s)
- **Brčko**: Two-column table form (Zahtjev) with label/value rows, HR subdivision section (POPUNjAVA PODODJELjENjE ZA OSOBLjE I PLATE), and attachment notice on the neplaćeno form

#### `script.js` changes
- `viewLegalDocument()`: now looks up the employee's entity from `this.users` instead of using the manager's entity; stores it in `this.currentPdfEntity`
- `buildDocumentHTML(req, entity)`: new method — routes to one of 9 HTML preview generators based on entity + type; FBiH/RS produce styled paragraph documents, Brčko produces a bordered two-column HTML table
- `downloadPDF()`: routes to `downloadPdfFbih()`, `downloadPdfRs()`, or `downloadPdfBrcko()` based on `this.currentPdfEntity`
- `downloadPdfFbih(req, year, today, docNumber)`: generates all 3 FBiH PDFs via jsPDF
- `downloadPdfRs(req, year, today, docNumber)`: generates all 3 RS PDFs via jsPDF
- `downloadPdfBrcko(req, year, today, empPhone)`: generates all 3 Brčko PDFs via jsPDF using drawn table rectangles

---

## [1.2.3] - 2026-05-17

### Fix — Employee section search bar not working

#### `script.js` — `searchArchive()` date matching
- Dates are stored as ISO strings (`2024-08-01`) but the search placeholder example shows "august 2023" — the raw string never contains a month name
- Fixed by running each request's start/end date through `formatDate()` before matching, so the search now compares against the human-readable string (e.g. "15. august 2024.")
- Also added matching against the translated type name (e.g. "Godišnji", "Bolovanje") and translated status label (e.g. "Odobreno", "Na čekanju") so users can search in their current language

### Change — Restore ring design to employee dashboard

#### `index.html` — Replaced plain summary text card with ring card
- Restored the SVG circular progress ring (`days-ring` circle with `progress-ring-circle` CSS animation)
- Ring is informational — it fills relative to 365 days (the full calendar year); no enforcement or warning at any point
- Center of the ring shows the total approved days (`days-used-number`) with "dana" label
- To the right of the ring (or below on mobile): section heading "Moj godišnji" and the breakdown text line (`total-entitlement`)
- The three action buttons (Novi zahtjev, Zamjena dana, Tko je na poslu?) remain below the heading text
- Layout is `flex-col sm:flex-row` — ring above on mobile, ring left on desktop

#### `script.js` — `updateEmployeeDashboard()` ring animation
- Added `days-ring` stroke-dashoffset update: `circumference × (1 − min(approvedDays / 365, 1))`
- Added `days-used-number` text update with `approvedDays`
- No balance enforcement added; breakdown text and pending indicator unchanged

---

## [1.2.2] - 2026-05-17

### Change — Remove leave balance ring and unlimited days off

#### Motivation
The circular progress ring gave employees the impression they had a fixed quota of leave days. Medical absences and other leave types should not feel like a countdown. Employees can now request as many days as they need without any system-imposed limit.

#### `index.html` — Balance Ring Card replaced with Leave Summary Card
- Removed the entire SVG circular progress ring (`balance-ring` circle, `stroke-dasharray`/`stroke-dashoffset` animation)
- Removed the centre "days remaining" counter, "balance-title" heading, and "days-used-label" text
- Removed the `carry-over-warning` and `burnout-risk` warning divs from the employee section
- Replaced the card with a plain "Leave Summary Card" showing a short text summary (`total-entitlement`) and the three action buttons (Novi zahtjev, Zamjena dana, Tko je na poslu?) side by side

#### `script.js` — Logic and state cleanup
- Removed `balance` and `used` properties from the app state object
- `updateEmployeeDashboard()`: removed ring fill calculation (`ringMax`, `fillPercent`, circle DOM updates, `balance-title` and `days-used-label` updates); kept the breakdown text that populates `total-entitlement`
- `submitRequest()`: removed the annual leave enforcement block that blocked submission when requested days exceeded the calculated entitlement
- `saveData()`: removed `balance` and `used` from the persisted data object
- `loadData()`: removed restoration of `this.balance` and `this.used` from localStorage
- Session loading: removed line that set `this.balance` from `userEntityData.days` or entity `totalDays`

---

## [1.2.1] - 2026-05-17

### Fix — Three mobile bugs reported after v1.2.0

#### `index.html` — Manager header: Legal Report button covered by global controls
- The "Izvještaj" button was inside the title row at the right edge, directly behind the fixed language/theme/logout buttons (z-60)
- On mobile, the button div in the title row is now `hidden sm:flex` — invisible on phones
- A separate `sm:hidden` button is added at the end of the info row (second header row), using `ml-auto` to push it right — this row sits below the global controls and is never overlapped

#### `index.html` + `script.js` — Legal document preview unusable on mobile
- The outer padding area was `p-8` (32 px each side) and the `pdf-content` wrapper also had `p-8`, resulting in 64 px of horizontal padding on each side — only ~215 px of readable text width on a 375 px screen
- `pdf-content` no longer has its own padding; the JS-generated document div uses `p-4 sm:p-8`
- Outer scrollable area reduced to `p-2 sm:p-8`
- `min-h-[1000px]` removed from the inner div (document height is now driven by its content)
- Signature/delivery footer changed from `flex justify-between` to `flex flex-col sm:flex-row justify-between gap-6` so the two columns stack vertically on narrow screens
- Footer action buttons (`Dodaj u kalendar` + `Preuzmi PDF`) now stack vertically on mobile: `flex-col sm:flex-row items-stretch sm:items-center`; padding reduced `px-4 sm:px-6`

#### `index.html` + `script.js` — Admin tables had unusable horizontal scroll on mobile
- Replaced horizontal-scroll approach with a **CSS card layout** for screens ≤ 639 px:
  - `thead` is hidden; each `tbody tr` becomes a block card (rounded border, light background)
  - Each `td` becomes a `flex` row: label on the left (from `data-label` attribute, styled grey uppercase), value on the right
  - Action buttons (`data-label=""`) hide their label and justify to the right
- Added `responsive-table` CSS class to both admin tables in HTML
- Removed negative-margin scroll hack (`-mx-4 sm:-mx-6 px-4 sm:px-6`); `sm:min-w-[520px]` / `sm:min-w-[580px]` kept for desktop
- `script.js` — users table `<td>` elements: added `data-label` using translated column names (`this.t('nameCol')` etc.); action buttons wrapped in `<div class="flex gap-3">` so they group correctly in the card layout
- `script.js` — requests table `<td>` elements: same treatment with `data-label` for all six columns; action buttons div gets `flex-wrap` so they reflow on narrow cards

---

## [1.2.0] - 2026-05-17

### Improvement — Full mobile optimisation

The app was previously desktop-only in practice. Every screen, header, modal and data table has been made fully functional on phones.

#### `index.html` — Global controls (top-right toolbar)
- Buttons are now smaller on mobile (`p-1.5 sm:p-2`, icons `w-3.5 sm:w-4`), positioned closer to the corner (`top-3 right-3 sm:top-4 sm:right-4`)
- Reduced gap between buttons on mobile (`gap-1.5 sm:gap-2`)
- Container max-width reduced on mobile (`max-w-[180px] sm:max-w-[210px]`) to avoid overlapping page headers

#### `index.html` — All three dashboard headers (Employee, Manager, Admin)
- Sticky header padding reduced: `px-4 sm:px-6 py-3 sm:py-4`
- Back button and title row uses `min-w-0` + `flex-shrink-0` so the title never pushes the back button off-screen
- Title font size: `text-xl sm:text-2xl font-bold truncate` — one size down on phones, truncates if too long
- User info row (avatar + name + role badge) changed to `flex-wrap` with `gap-2`; long names get `truncate max-w-[120px] sm:max-w-none`; role badges get `whitespace-nowrap` so they wrap as a whole chip
- Back button uses `flex-shrink-0` to stay fixed size regardless of title length

#### `index.html` — Manager dashboard header
- "Izvještaj" (Report) button shows icon-only on mobile (`<span class="hidden sm:inline">`) so it fits next to the title; has `flex-shrink-0` to prevent the layout collapsing

#### `index.html` — Admin dashboard — User Management section
- "Dodaj korisnika" button is icon-only on mobile (`<span class="hidden sm:inline">`) with tighter padding (`px-3 sm:px-4`)
- Section heading reduced: `text-base sm:text-xl`

#### `index.html` — Admin dashboard — Data tables
- Both tables (users list and all-requests) wrapped in a negative-margin scroll container (`-mx-4 sm:-mx-6 px-4 sm:px-6`) so horizontal scroll reaches the card edge
- Added explicit `min-w-[520px]` (users table) and `min-w-[580px]` (requests table) — tables now scroll cleanly instead of wrapping into illegible columns

#### `index.html` — Manager + Admin stats grids
- Changed from `grid-cols-1 md:grid-cols-4` to `grid-cols-2 md:grid-cols-4` so stats show in a 2×2 layout on phones instead of four tall stacked cards
- Gap reduced on mobile: `gap-3 sm:gap-4`
- CSS rule added for `max-width: 639px`: stat card padding reduced to `0.75rem`, numbers scaled from `text-3xl` to `1.5rem`, icon containers shrunk to `2rem`

#### `index.html` — Year forecast chart
- Container changed from `grid-cols-12` to `grid-cols-6 sm:grid-cols-12`
- On mobile the 12 month chips render as two rows of six instead of one unreadably narrow row of twelve

#### `index.html` — Kanban board (Manager view)
- Column `min-h-[500px]` reduced to `min-h-[120px] lg:min-h-[500px]` — empty columns no longer force 500 px of blank space on mobile
- Grid gap reduced on mobile: `gap-4 lg:gap-6`

#### `index.html` — Employee dashboard content
- Content area padding: `px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8`
- Balance ring card padding: `p-5 sm:p-8`
- Leave calendar card padding: `p-4 sm:p-6`

#### `index.html` — Bottom-sheet modals (Request, Day Swap, Team Availability)
- All three bottom sheets now show a **drag handle** on mobile (`md:hidden` pill above the header)
- Headers reduced: `px-4 sm:px-6 py-3 sm:py-4`
- `max-h` bumped from `90vh` to `92vh` / `85vh` to reduce scroll cutoff on short phones
- Team Availability body padding: `p-4 sm:p-6`

#### `index.html` — Notification toast
- `min-w-[300px]` → `min-w-[260px] sm:min-w-[300px] max-w-[calc(100vw-2rem)]` — no longer overflows narrow screens

#### `index.html` — Dynamic Island bar (bottom)
- Same fix as toast: `min-w-[260px] sm:min-w-[300px] max-w-[calc(100vw-2rem)]`; horizontal padding reduced on mobile

#### `index.html` — Add/Edit User modal
- Padding: `p-5 sm:p-8`
- Added `max-h-[90vh] overflow-y-auto` so the tall form scrolls inside the modal on short screens

#### `index.html` — Focus Mode overlay
- Padding: `p-4 sm:p-8`; added `overflow-y-auto` for very short screens

#### `index.html` — CSS additions (`<style>` block)
- **iOS safe-area insets**: `@supports (padding-bottom: env(safe-area-inset-bottom))` rule gives all three dashboards extra bottom padding equal to the device's home-indicator height so content is never hidden under it
- **Compact stat cards**: `@media (max-width: 639px)` rule shrinks padding, number font size and icon size inside stat grid cards without touching desktop layout
- **`button` / `[role="button"]` min-height**: `36px` ensures every interactive element meets a minimum touch target size

#### `login.html` — Main content area
- Top padding changed from fixed `pt-24` to `pt-16 sm:pt-20 lg:pt-24` — on short phones the login form no longer sits uncomfortably low

#### `script.js` — Burnout details modal (dynamically created)
- Added `max-h-[90vh] overflow-y-auto` so the modal doesn't overflow on small screens
- Padding: `p-4 sm:p-6`
- Inner list `max-h` reduced from `64` to `48` on mobile: `max-h-48 sm:max-h-64`

---

## [1.1.2] - 2026-04-26

### Fix — Password, haptic menu, focus mode contact, localStorage cleanup

#### `script.js` — `saveUser()`
- Password field value was read from the input but the POST body still sent the hardcoded string `'pass123'`; now sends the actual value from the input
- Success toast now shows the new employee's temporary password so the admin can relay it: `Name — Privremena lozinka: <value>`

#### `script.js` — `showHapticMenu(event, reqId)` (new)
- Added function that positions the context menu at cursor coordinates and sets `currentHapticRequest`
- Menu auto-dismisses on the next click anywhere on the page
- Only opens for pending requests (no-op for approved/rejected)

#### `script.js` — `createRequestCard()`
- Added `oncontextmenu="app.showHapticMenu(event, id)"` to each card so right-clicking opens the haptic menu for that specific request

#### `script.js` — `hapticAction('cancel')`
- Was showing an informational toast instead of actually cancelling the request
- Now calls `await this.cancelRequest(id)` using `currentHapticRequest.id`, which sends `DELETE` to the API

#### `script.js` — `toggleFocusMode()`
- `focus-emergency-contact` element was a hardcoded static string in HTML (`Sara Kovač +387 61 123 456`)
- On entering focus mode, now finds the first manager/admin in `this.users` and sets the element text to their real name and phone number

#### `script.js` — `saveData()` / `loadData()`
- Removed `requests` and `users` from `saveData()` — they now come exclusively from the database, not localStorage
- Removed corresponding `data.requests` and `data.users` reads from `loadData()`

---

## [1.1.1] - 2026-04-26

### Fix — Cancel, delete and edit requests now persist to database

#### `routes/requests.js`
- Added `DELETE /api/requests/:id` — permanently deletes a request from the database
- Added `PATCH /api/requests/:id` — updates an existing pending request's leave type, dates, days and notes

#### `script.js` — `cancelRequest()`
- Was only removing from local memory/localStorage; after a page refresh the request reappeared
- Now sends `DELETE /api/requests/:id`, reloads from DB on success

#### `script.js` — `adminDeleteRequest()`
- Same problem as cancelRequest — only filtered local array
- Now sends `DELETE /api/requests/:id`, reloads from DB on success

#### `script.js` — `submitRequest()`
- Was always sending a `POST` even when editing an existing request, creating duplicate requests
- Now checks `this.editingRequestId`: if set, sends `PATCH` to update the existing record; if not set, sends `POST` as before
- Clears `editingRequestId` on success

---

## [1.1.0] - 2026-04-26

### Fix — Four real data problems resolved

#### Database
- Added `phone` column (`VARCHAR(50) DEFAULT ''`) to the `employees` table

#### `routes/users.js`
- `GET /api/users` — now returns `phone`
- `POST /api/users` — accepts and stores `phone`
- `PUT /api/users/:id` — accepts and updates `phone`

#### `index.html`
- Added phone number input field to the Add/Edit User modal

#### `script.js` — Leave balance enforcement (`submitRequest()`)
- Annual leave requests are now blocked if the requested days exceed the employee's remaining entitlement for the current year
- Entitlement is taken from the entity config (`fbih=20`, `rs=18`, `brcko=20`)
- Days already approved this year are subtracted; if the new request would exceed what's left, an error toast is shown with the remaining count

#### `script.js` — Who is at work (`renderTeamAvailability()`)
- Removed hardcoded team array (5 fictitious people)
- Now uses `this.users` — shows every real employee loaded from the database

#### `script.js` — Day Swap colleague list (`openVacationTrade()`)
- Removed hardcoded colleague options in HTML
- Select is now populated dynamically on open: shows all users except the current one, with their real remaining annual leave days calculated from actual approved requests

#### `script.js` — Emergency contact (`showEmergencyContact()`)
- Removed hardcoded "Sara Kovač: +387 61 123 456"
- Now finds the first manager or admin in `this.users` and shows their name and phone number
- If no phone is set, shows "No phone number set" / "Broj nije unesen"
- If no manager exists in the system, shows a fallback message

#### `script.js` — user modal functions
- `showAddUserModal()` — resets phone field
- `editUser()` — populates phone field
- `saveUser()` — reads and sends phone in both POST and PUT requests
- `loadUsers()` — maps `phone` from API response

#### `script.js` — translations
- Added keys to both `bs` and `en`: `phoneLabel`, `noPhone`, `balanceExceeded`, `balanceExceededMsg`

---

## [1.0.9] - 2026-04-26

### Bug Fix — Day Swap modal not translating

#### `index.html`
- Added `data-i18n="trade-colleague-placeholder"` to the blank option in the colleague select
- Added `data-i18n="day1/day2/day3"` to all day options in both "You give" and "You receive" selects

#### `script.js`
- Added translation keys to both `bs` and `en`: `tradeColleaguePlaceholder`, `day1`, `day2`, `day3`

---

## [1.0.8] - 2026-04-26

### Improvement — Year overview redesigned as clickable month chips

#### `index.html`
- Replaced `flex h-10` bar chart container with `grid grid-cols-12` chip grid
- Removed the single-letter label row (J F M A …) — labels are now inside each chip

#### `script.js` — `renderForecastChart()`
- Complete rewrite: 12 clickable `<button>` chips instead of bars
- Chip colour scales with days: grey (0), light blue (1–3), mid blue (4–7), solid blue (8+)
- Selected month (currently shown in the calendar above) gets a ring highlight
- A small dot marks today's real calendar month
- Added `goToCalendarMonth(month)` — clicking any chip navigates the calendar to that month

---

## [1.0.7] - 2026-04-26

### Feature — Export to Calendar button in PDF document modal

#### `index.html`
- Added "Add to Calendar" button next to "Download PDF" in the legal document preview modal footer
- Button is outlined (secondary style) so Download PDF remains the primary action

#### `script.js`
- Added translation keys `addToCalendar` to both `bs` and `en`

---

## [1.0.6] - 2026-04-26

### Cleanup — Removed dead code

#### `script.js`
- Deleted stub `showAddUserModal()` (showed a "Feature coming soon" toast; shadowed the real implementation below it)
- Deleted `this.currentPdfContent = content.innerHTML` assignment (value was never read anywhere)
- Deleted `shareWhatsApp()` (fully written but no button in the UI called it; WhatsApp sharing removed from scope)
- Deleted `exportEGovernment()` (placeholder stub that only showed a toast; e-Government export not implemented)
- `exportToCalendar()` was kept — it is functional and was wired up in v1.0.7

---

## [1.0.5] - 2026-04-26

### Feature — Leave Calendar with year overview

#### `index.html`
- Replaced the broken forecast bar chart section with a full monthly calendar
- Calendar shows navigation arrows (previous / next month)
- Day headers (Mon–Sun / Pon–Ned) rendered by JS so they translate with the language
- Legend: blue = approved, yellow = pending
- Year overview placeholder added below the calendar (redesigned into chips in v1.0.8)

#### `script.js`
- Added `calendarYear` and `calendarMonth` to app state (initialised to current month)
- `renderLeaveCalendar(myRequests)` — builds the monthly grid, highlights approved days (blue), pending days (yellow), and today (ring); then calls `renderForecastChart` for the year strip
- `prevCalendarMonth()` / `nextCalendarMonth()` — navigate months, re-render
- `updateEmployeeDashboard()` now calls `renderLeaveCalendar` instead of `renderForecastChart` directly
- Added translation keys: `yearOverview`, `calendarDays` (comma-separated day abbreviations for both `bs` and `en`)

---

## [1.0.4] - 2026-04-26

### Feature — Real Leave Cost and Team Health calculations

#### Database
- Added `salary` column (`NUMERIC DEFAULT 0`) to the `employees` table

#### `routes/users.js`
- `GET /api/users` — now returns `salary` field
- `POST /api/users` — accepts and stores `salary`
- `PUT /api/users/:id` — accepts and updates `salary`

#### `index.html`
- Added salary input field (KM/month) to the Add/Edit User modal
- Added `id="health-subtitle"` to the Team Health card subtitle so JS can update it dynamically

#### `script.js` — `updateManagerDashboard()`
- **Leave Cost** — replaced flat `days × 100 KM` with real calculation: each employee's `salary ÷ 22 × approved days`
- Displays `0 KM` if no salaries are set (not a phantom number)

#### `script.js` — new `calculateTeamHealth()`
- Analyses actual leave request data per employee:
  - **Red flag**: more than 5 sick days in the last 90 days
  - **Yellow flag**: 3–5 sick days in 90 days, or no annual leave taken in 6 months despite having approved leave history
- Calculates a health score (100 − 20×red − 10×yellow)
- Updates the card background gradient, score percentage, and subtitle text to green / yellow / red based on score

#### `script.js` — `showBurnoutDetails()`
- Replaced static toast with a real modal listing each flagged employee and the reason
- If no flags, shows "All team members are in good condition"

#### `script.js` — user modal functions
- `showAddUserModal()` — resets salary field
- `editUser()` — populates salary field from loaded user data
- `saveUser()` — reads and sends salary in both POST and PUT requests
- `loadUsers()` — maps `salary` from API response into the users array

#### `script.js` — translations
- Added keys to both `bs` and `en`: `salaryLabel`, `moderateRisk`, `highBurnoutRisk`, `sickDaysIn90`, `noAnnualIn6m`

---

## [1.0.3] - 2026-04-26

### Bug Fix — Bosnian dates showing "MO4/MO5" instead of month names

#### `script.js` — `formatDate()`
- The `bs-BA` locale is not reliably supported in Chromium on Linux, causing month names to render as "MO4", "MO5" etc.
- Fixed by replacing the `bs-BA` locale call with a hardcoded Bosnian month name array: januar, februar, mart, april, maj, juni, juli, august, septembar, oktobar, novembar, decembar
- English dates continue to use `en-GB` locale as before
- Affects all date displays: admin requests table, manager kanban cards, employee request cards, legal documents

---

## [1.0.2] - 2026-04-26

### Bug Fix — Notes placeholder not translating

#### `script.js`
- Added `notesPlaceholder` translation key to both `bs` ("Dodatne informacije...") and `en` ("Additional information...")

#### `index.html`
- Added `data-i18n-placeholder="notes-placeholder"` to the notes textarea in the leave request form

---

## [1.0.1] - 2026-04-26

### Bug Fix — Admin Edit User

#### `routes/users.js`
- Added `PUT /api/users/:id` endpoint — updates `first_name`, `last_name`, `role`, and `position` for a given employee

#### `script.js`
- `editUser()` — fixed ID type mismatch: user IDs from the database are numbers but were compared as strings; now uses `String()` on both sides
- `saveUser()` — implemented the edit path (previously a stub showing "Edit coming soon"): sends a `PUT` request to `/api/users/:id`, closes the modal, reloads users, and refreshes the dashboard on success

---

## [1.0.0] - 2026-04-26

### Initial Setup & Bug Fixes

#### Database
- Set up PostgreSQL connection in `db.js` (user: postgres, database: postgres, port: 5432)
- Created `employees` table with fields: id, first_name, last_name, email, password, role, position, entity, created_at
- Created `leave_requests` table with fields: id, employee_id, leave_type, start_date, end_date, days, status, notes, approved_by, created_at
- Created `push_subscriptions` table with fields: id, employee_id, endpoint, p256dh, auth, created_at
- Seeded 5 demo users with bcrypt-hashed passwords:
  - `zaposlenik@danoff.ba` / `pass123` — Employee (Amar Hodžić)
  - `menadzer@danoff.ba` / `pass123` — Manager (Emina Hadžić)
  - `admin@danoff.ba` / `admin123` — Admin (Admin Sistem)
  - `sara@danoff.ba` / `pass123` — Employee (Sara Kovač)
  - `ema@danoff.ba` / `pass123` — Employee (Ema Hadžić)

#### Authentication (`routes/auth.js`)
- Login endpoint `POST /api/auth/login` queries the database, verifies bcrypt password, and checks role match before returning user session data

#### Server (`server.js`)
- Registered all API routes: `/api/auth`, `/api/users`, `/api/requests`, `/api/push`

---

### Push Notifications

#### New file: `sw.js` (Service Worker)
- Listens for `push` events and displays system notifications with title, body, icon, and vibration
- Listens for `notificationclick` and opens the app when the notification is tapped

#### New file: `routes/push.js`
- VAPID keys configured for web push authentication
- `POST /api/push/subscribe` — saves a user's push subscription (endpoint, p256dh, auth) to the database
- `GET /api/push/vapidPublicKey` — serves the public VAPID key to the frontend
- `notifyEmployee(employeeId, payload)` — sends a push notification to a specific employee
- `notifyManagers(payload)` — sends a push notification to all managers and admins
- Expired subscriptions (HTTP 410) are automatically deleted

#### Updated: `routes/requests.js`
- `POST /` (submit request) — now fires a push notification to all managers/admins when an employee submits a leave request
- `PUT /:id` (approve/reject) — now fires a push notification to the employee when their request is approved or rejected

#### Updated: `script.js` — `requestNotificationPermission()`
- Registers the service worker (`sw.js`)
- After permission is granted, subscribes to push using the VAPID public key from the server
- Sends the push subscription to `/api/push/subscribe` tied to the current user's ID
- Added helper `urlBase64ToUint8Array()` to convert the VAPID key for the browser Push API

#### Updated: `script.js` — `init()`
- Registers the service worker on app load if the browser supports it

---

### Legal Report PDF (`script.js` — `generateLegalReport()`)
- Previously a stub that only showed a toast; now generates and downloads a real PDF
- PDF contains: entity name, date, total employees, days entitlement
- Summary statistics: approved / pending / rejected request counts and total days used
- Full table of all leave requests: employee name, type, start date, end date, days, status
- Handles pagination (new page when content exceeds 270mm)
- File saved as `DanOff_Report_<year>.pdf`
- Toast message is now language-aware (Bosnian/English)

---

### Translations — English / Bosnian (`script.js`, `index.html`, `login.js`)

The following strings were previously hardcoded in Bosnian only and did not change when switching to English. All have been fixed.

#### New translation keys added (both `bs` and `en`):
`daySwap`, `whoIsAtWork`, `whoIsAtWorkToday`, `tradeSend`, `tradeDesc`, `tradeColleague`,
`tradeYouGive`, `tradeYouReceive`, `tradeDuringAbsence`, `leaveCost`, `estimatedCost`,
`teamHealth`, `lowBurnoutRisk`, `other`, `coveragePlaceholder`, `coverageNone`,
`burnoutRisk`, `administration`, `totalUsers`, `activeRequests`, `entity`,
`userManagement`, `addUser`, `nameCol`, `roleCol`, `positionCol`, `actionsCol`,
`allRequests`, `periodCol`, `daysCol`, `typeCol`, `aiConflictTitle`, `aiConflictMsg`,
`showHeatmap`, `dismiss`, `teamHeatmap`, `heatFree`, `heat12`, `heatCritical`,
`onLeave`, `atWork`, `focusTitle`, `focusSubtitle`, `timeRemaining`, `emergency`,
`emergencyContactLabel`, `extendLeave`, `touchToConfirm`, `addUserTitle`, `editUserTitle`,
`fullName`, `roleLabel`, `saveBtn`, `editBtn`, `deleteBtn`, `approveBtn`, `rejectBtn`,
`deleteConfirm`, `deleteRequestConfirm`, `userDeleted`, `userDeletedMsg`, `userAdded`,
`requestDeleted`, `noResults`, `emergencyContactToast`, `tradeSelectError`, `tradeSentMsg`,
`teamHealthMsg`, `hapticCancelled`, `hapticCancelledMsg`, `biometricSuccess`, `biometricMsg`,
`calendarExported`, `noDataError`, `noShareData`, `egovTitle`, `egovMsg`, `permissionError`

#### `index.html` — elements updated with `data-i18n` attributes:

| Element | Key |
|---|---|
| Dynamic island title | `on-leave` |
| Burnout risk warning | `burnout-risk` |
| Admin section heading | `administration` |
| Total users stat label | `total-users` |
| Active requests stat label | `active-requests` |
| Approved this month stat label | `approved-this-month` |
| Entity stat label | `entity` |
| User management heading | `user-management` |
| Add user button | `add-user` |
| Users table headers (Name, Role, Position, Actions) | `name-col`, `role-col`, `position-col`, `actions-col` |
| All requests heading | `all-requests` |
| Requests table headers (Employee, Period, Days, Type, Actions) | `employee`, `period-col`, `days-col`, `type-col`, `actions-col` |
| AI conflict warning title and message | `ai-conflict-title`, `ai-conflict-msg` |
| Show heat map button | `show-heatmap` |
| Dismiss button | `dismiss` |
| Team heatmap modal title | `team-heatmap` |
| Heatmap legend (Free, 1-2 on leave, Critical) | `heat-free`, `heat12`, `heat-critical` |
| Day Swap button and modal title | `day-swap` |
| Who is at work button | `who-is-at-work` |
| Who is at work today modal title | `who-is-at-work-today` |
| Trade modal Cancel, Send buttons | `cancel`, `trade-send` |
| Trade modal description | `trade-desc` |
| Trade modal labels (Colleague, You give, You receive) | `trade-colleague`, `trade-you-give`, `trade-you-receive` |
| Replacement during absence label | `trade-during-absence` |
| Coverage dropdown placeholder | `coverage-placeholder` |
| Nobody covers option | `coverage-none` |
| Other leave type | `other` |
| Leave Cost stat label | `leave-cost` |
| Estimated cost label | `estimated-cost` |
| Team Health stat label | `team-health` |
| Low burnout risk label | `low-burnout-risk` |
| Focus mode title and subtitle | `focus-title`, `focus-subtitle` |
| Time remaining label | `time-remaining` |
| Emergency button | `emergency` |
| Emergency contact label | `emergency-contact-label` |
| Haptic menu (Extend leave, Cancel, Download PDF) | `extend-leave`, `cancel`, `download-pdf` |
| Biometric confirmation prompt | `touch-to-confirm` |
| User modal title | `add-user-title` |
| Full name label | `full-name` |
| Role label | `role-label` |
| Role options (Employee, Manager, Admin) | `employee`, `manager`, `admin` |
| Position label | `position-col` |
| User modal Cancel and Save buttons | `cancel`, `save-btn` |

#### `script.js` — JS methods fixed to use `this.t()`:

| Method | Fix |
|---|---|
| `setRole()` | Permission error toast |
| `updateAdminDashboard()` | Role labels, status labels, leave type labels, no-requests message, Edit/Delete/Approve/Reject buttons |
| `showAddUserModal()` | Modal title |
| `editUser()` | Modal title |
| `deleteUser()` | Confirm dialog, success/error toasts |
| `saveUser()` | Validation error message, success toast, error toasts |
| `adminHandleRequest()` | "dana" → `this.t('days')` |
| `adminDeleteRequest()` | Confirm dialog, deleted toast |
| `createManagerCard()` | "dana" → `this.t('days')` |
| `searchArchive()` | No results message |
| `showEmergencyContact()` | Toast title |
| `renderTeamAvailability()` | On Leave / At work status labels |
| `proposeTrade()` | Error toast, success toast |
| `showBurnoutDetails()` | Toast title and message |
| `hapticAction()` | Cancelled toast |
| `simulateBiometricAuth()` | Biometric success toast |
| `exportToCalendar()` | Calendar event summary, downloaded toast, no data error |
| `shareWhatsApp()` | WhatsApp message template, no data error |
| `exportEGovernment()` | Toast title and message |
