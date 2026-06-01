# DanOff — Testing Documentation

## Overview

This document covers the complete automated test suite for the DanOff leave management system.  Tests are split into two layers:

| Layer | Tool | Tests | Scope |
|-------|------|-------|-------|
| **Unit / Integration** | Jest + Supertest | 92 | Routes, business logic, no live DB |
| **End-to-End** | Playwright | 47 | Full browser, real server, real PostgreSQL DB |

**Total: 139 tests — all passing.**

---

## Testing Framework and Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Jest** | 30.x | Test runner, assertion library, built-in mocking |
| **Supertest** | 7.x | Sends real HTTP requests to Express apps without binding to a port |

### Why Jest + Supertest?

Jest is the industry-standard testing framework for Node.js. It provides everything needed in a single package: test runner, assertion library (`expect`), and a powerful mocking system (`jest.mock`, `jest.fn`, `mockResolvedValueOnce`). No additional assertion library is required.

Supertest pairs naturally with Express — it wraps the app and sends HTTP requests over an in-memory socket. This means tests exercise the actual route handlers, middleware, and error paths without starting a real server or requiring a live database connection.

### Standards followed

- Each test file creates its own isolated Express `app` instance with only the relevant routers mounted.
- `jest.mock('../db', () => ({ query: jest.fn() }))` replaces the PostgreSQL pool with a controllable mock — no real database is ever used.
- `jest.mock('../routes/push', ...)` replaces the web-push notification module where it would otherwise trigger VAPID initialization and network calls.
- `beforeEach(() => jest.clearAllMocks())` is called in every `describe` block so mock state never leaks between tests.
- `mockResolvedValueOnce` / `mockRejectedValueOnce` are used instead of global `mockReturnValue` so each test controls exactly what the database returns for that test only.
- Tests are grouped with `describe` (feature area) and named with `it` (specific scenario), matching Jest's recommended structure.

---

## Test File Structure

```
tests/
├── helpers/
│   └── seedData.js          Shared fixtures: 9 employees (3 entities × 3 roles) + sample requests
├── auth.test.js             Authentication (10 tests)
├── employee.test.js         Employee role (15 tests)
├── manager.test.js          Manager role (10 tests)
├── admin.test.js            Admin role (15 tests)
├── documents.test.js        PDF document routing — 3 entities × 3 leave types (12 tests)
├── middleware.test.js        requireAuth middleware + push endpoints (6 tests)
├── requests.test.js         Leave request API — low-level endpoint coverage (13 tests)
└── users.test.js            Users API — low-level endpoint coverage (11 tests)

config/
└── entities.js              Leave entitlement data (20/18/20 days per entity)

lib/
└── pdfRouter.js             PDF variant selection logic — mirrors script.js downloadPDF()
```

---

## Seed Data (tests/helpers/seedData.js)

Nine test employees covering every role × entity combination:

| Key | Name | Role | Entity |
|-----|------|------|--------|
| `employee_fbih` | Amar Hodžić | employee | fbih |
| `manager_fbih` | Emina Hadžić | manager | fbih |
| `admin_fbih` | Admin Sistem | admin | fbih |
| `employee_rs` | Milena Stanić | employee | rs |
| `manager_rs` | Dragan Marković | manager | rs |
| `admin_rs` | Sanja Jović | admin | rs |
| `employee_brcko` | Lejla Begić | employee | brcko |
| `manager_brcko` | Nermin Selimović | manager | brcko |
| `admin_brcko` | Amila Kadić | admin | brcko |

---

## Test Cases

### `tests/auth.test.js` — Authentication (10 tests)

| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Positive | Valid employee credentials | 200 + user object with id, name, email, role, entity |
| 2 | Positive | Valid manager credentials | 200 + user object with role = "manager" |
| 3 | Positive | Valid admin credentials | 200 + user object with role = "admin" |
| 4 | Positive | Successful login | `password` field is absent from the response body |
| 5 | Negative | Email does not exist in DB | 401 `Invalid credentials` |
| 6 | Negative | Correct email, wrong password | 401 `Invalid credentials` |
| 7 | Negative | Employee tries to log in as manager (role mismatch) | 401 `Role mismatch` |
| 8 | Negative | `email` field missing from request body | 401 `Invalid credentials` |
| 9 | Negative | `password` field missing (bcrypt throws on undefined) | 500 `Server error` |
| 10 | Negative | Database throws during query | 500 `Server error` |

---

### `tests/employee.test.js` — Employee role (15 tests)

| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Positive | Submit annual leave request | 200 + `{ id }` |
| 2 | Positive | Submit paid leave (sick) request | 200 + `{ id }` |
| 3 | Positive | Submit unpaid leave (other) request | 200 + `{ id }` |
| 4 | Negative | Submit request with missing required fields | 500 `Server error` (DB constraint violation) |
| 5 | Positive | Retrieve own request history | 200 + array containing own requests |
| 6 | Informational | Retrieve another employee's history | 200 — API has no per-user access restriction; documents the behavior |
| 7 | Positive | Edit a pending request | 200 `{ success: true }` |
| 8 | Informational | Edit an approved request | 200 — server does not check status before PATCH; access-control gap documented |
| 9 | Positive | Cancel (delete) a pending request | 200 `{ success: true }` |
| 10 | Informational | Cancel an approved request | 200 — server does not check status before DELETE; access-control gap documented |
| 11 | Positive | FBiH annual leave entitlement | `entities.fbih.totalDays === 20` |
| 12 | Positive | RS annual leave entitlement | `entities.rs.totalDays === 18` |
| 13 | Positive | Brčko Distrikt annual leave entitlement | `entities.brcko.totalDays === 20` |
| 14 | Positive | Request approved → push sent to employee | `notifyEmployee` called with `title: "Leave Request Approved"` |
| 15 | Positive | Request rejected → push sent to employee | `notifyEmployee` called with `title: "Leave Request Rejected"` |

---

### `tests/manager.test.js` — Manager role (10 tests)

| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Positive | View all leave requests (all statuses, all employees) | 200 + full array |
| 2 | Positive | Approve a pending request | 200 `{ success: true }` |
| 3 | Positive | Reject a pending request | 200 `{ success: true }` |
| 4 | Informational | Approve an already-approved request | 200 — API overwrites status without checking current state |
| 5 | Positive | View all team members | 200 + array of 9 employees |
| 6 | Positive | New leave submitted → push sent to managers | `notifyManagers` called with `title: "New Leave Request"` |
| 7 | Positive | Filter requests by specific employee | 200 + array filtered to that employee_id |
| 8 | Positive | Approving sends push to the employee | `notifyEmployee` called with `title: "Leave Request Approved"` |
| 9 | Positive | Rejecting sends push to the employee | `notifyEmployee` called with `title: "Leave Request Rejected"` |
| 10 | Negative | Database error during approve/reject | 500 `Server error` |

---

### `tests/admin.test.js` — Admin role (15 tests)

| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Positive | View all employees | 200 + array of all 9 users |
| 2 | Positive | Create employee in FBiH | 200 + `{ id }` |
| 3 | Positive | Create employee in Republika Srpska | 200 + `{ id }` |
| 4 | Positive | Create employee in Brčko Distrikt | 200 + `{ id }` |
| 5 | Positive | Update an employee's details | 200 `{ success: true }` |
| 6 | Positive | Delete an employee | 200 `{ success: true }` |
| 7 | Negative | Create employee with duplicate email | 500 `Server error` (unique constraint violation) |
| 8 | Positive | View all requests across all entities | 200 + array; FBiH and RS employee IDs both present |
| 9 | Positive | Approve any leave request | 200 `{ success: true }` |
| 10 | Positive | Reject any leave request | 200 `{ success: true }` |
| 11 | Positive | Delete any leave request | 200 `{ success: true }` |
| 12 | Positive | Password hashed before storage | `bcrypt.hash` called with plain text; hashed value in INSERT params; plain text absent |
| 13 | Positive | Create a manager account | 200 + `{ id }` |
| 14 | Positive | Create another admin account | 200 + `{ id }` |
| 15 | Negative | Database error on any admin operation | 500 `Server error` |

---

### `tests/documents.test.js` — PDF document routing (12 tests)

Tests `lib/pdfRouter.js`, which mirrors the entity + leave-type routing logic in `script.js` (`downloadPDF()` → `downloadPdfFbih()` / `downloadPdfRs()` / `downloadPdfBrcko()`).

| # | Type | Entity | Leave type | Expected download function | Expected legal reference |
|---|------|--------|-----------|---------------------------|--------------------------|
| 1 | Positive | FBiH | annual | `downloadPdfFbih` | contains "Zakon o radu FBiH" |
| 2 | Positive | FBiH | sick (paid) | `downloadPdfFbih` | contains "Zakon o radu FBiH" |
| 3 | Positive | FBiH | other (unpaid) | `downloadPdfFbih` | contains "Zakon o radu FBiH" |
| 4 | Positive | RS | annual | `downloadPdfRs` | contains "Zakon o radu RS" |
| 5 | Positive | RS | sick (paid) | `downloadPdfRs` | contains "Zakon o radu RS" |
| 6 | Positive | RS | other (unpaid) | `downloadPdfRs` | contains "Zakon o radu RS" |
| 7 | Positive | Brčko | annual | `downloadPdfBrcko` | contains "Zakon o radu Brčko Distrikta" |
| 8 | Positive | Brčko | sick (paid) | `downloadPdfBrcko` | contains "Zakon o radu Brčko Distrikta" |
| 9 | Positive | Brčko | other (unpaid) | `downloadPdfBrcko` | contains "Zakon o radu Brčko Distrikta" |
| 10 | Positive | FBiH entity routing | — | `onFbih` callback called once | `onRs` and `onBrcko` not called |
| 11 | Positive | RS entity routing | — | `onRs` callback called once | `onFbih` and `onBrcko` not called |
| 12 | Positive | Brčko entity routing | — | `onBrcko` callback called once | `onFbih` and `onRs` not called |

---

### `tests/middleware.test.js` — Auth middleware + push endpoints (6 tests)

| # | Type | Scenario | Expected result |
|---|------|----------|-----------------|
| 1 | Negative | Request arrives with no `x-user-id` header | 401 `Unauthorized` |
| 2 | Positive | `x-user-id` resolves to a real user in DB | 200; `req.user` contains `{ id, role }` |
| 3 | Negative | `x-user-id` value not found in DB | 401 `Unauthorized` |
| 4 | Negative | Database throws during auth lookup | 500 `Server error` |
| 5 | Positive | `POST /api/push/subscribe` with valid subscription object | 200 `{ success: true }` |
| 6 | Positive | `GET /api/push/vapidPublicKey` | 200; `key` is a non-empty string |

---

### `tests/requests.test.js` — Leave request API, low-level (13 tests)

| # | Type | Endpoint | Scenario | Expected result |
|---|------|----------|----------|-----------------|
| 1 | Positive | `GET /api/requests` | Requests in DB | 200 + array |
| 2 | Negative | `GET /api/requests` | DB error | 500 `Server error` |
| 3 | Positive | `GET /api/requests/employee/:id` | Employee has requests | 200 + filtered array |
| 4 | Positive | `GET /api/requests/employee/:id` | No requests for that ID | 200 + empty array |
| 5 | Positive | `POST /api/requests` | Valid payload | 200 + `{ id }` |
| 6 | Negative | `POST /api/requests` | DB insert fails | 500 `Server error` |
| 7 | Positive | `PUT /api/requests/:id` | Status → `approved` | 200 `{ success: true }` |
| 8 | Positive | `PUT /api/requests/:id` | Status → `rejected` | 200 `{ success: true }` |
| 9 | Negative | `PUT /api/requests/:id` | DB error | 500 `Server error` |
| 10 | Positive | `PATCH /api/requests/:id` | Edit pending request | 200 `{ success: true }` |
| 11 | Negative | `PATCH /api/requests/:id` | DB error | 500 `Server error` |
| 12 | Positive | `DELETE /api/requests/:id` | Valid id | 200 `{ success: true }` |
| 13 | Negative | `DELETE /api/requests/:id` | DB error | 500 `Server error` |

---

### `tests/users.test.js` — Users API, low-level (11 tests)

| # | Type | Endpoint | Scenario | Expected result |
|---|------|----------|----------|-----------------|
| 1 | Positive | `GET /api/users` | Users exist | 200 + array |
| 2 | Positive | `GET /api/users` | Response shape | `password` field absent from every object |
| 3 | Negative | `GET /api/users` | DB error | 500 `Server error` |
| 4 | Positive | `POST /api/users` | Valid payload | 200 + `{ id }` |
| 5 | Positive | `POST /api/users` | Password security | `bcrypt.hash` called; hashed value in INSERT; plain text absent |
| 6 | Negative | `POST /api/users` | Duplicate email / DB error | 500 `Server error` |
| 7 | Positive | `PUT /api/users/:id` | Valid update payload | 200 `{ success: true }` |
| 8 | Positive | `PUT /api/users/:id` | `entity` omitted from body | Defaults to `"fbih"` in the SQL call |
| 9 | Negative | `PUT /api/users/:id` | DB error | 500 `Server error` |
| 10 | Positive | `DELETE /api/users/:id` | Valid id | 200 `{ success: true }` |
| 11 | Negative | `DELETE /api/users/:id` | DB error | 500 `Server error` |

---

## Jest Test Results

```
Test Suites: 8 passed, 8 total
Tests:       92 passed, 92 total
Snapshots:   0 total
Time:        ~3.5 s
```

Run with: `npm test`

---

## Playwright End-to-End Tests

### Framework and tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Playwright** | 1.60.x | Browser automation, real Chrome, real HTTP |
| **PostgreSQL** | live DB | Actual data persistence (no mocks) |

**Why Playwright?**

Playwright was the natural choice as it was already used in the System Testing and Maintenance course, meaning the team had prior hands-on experience with it — reducing setup time and avoiding a learning curve during a tight deadline. The project was built for a QA firm, making browser-level end-to-end testing not just appropriate but expected — a QA firm demands proof that the application works correctly from the user's perspective, not just at the API level. Playwright tests the entire stack end-to-end (real browser, real HTTP, real PostgreSQL), catching UI and integration bugs that Jest and Supertest cannot detect. Its built-in auto-waiting and retry logic makes async UI testing reliable without manual timeouts or sleep() calls. Chromium was selected as the target browser since the app targets modern browsers.

**Standards Followed**

Tests use Playwright's recommended locator strategies (CSS selectors, evaluate for app state checks). globalSetup/globalTeardown handle all database seeding and cleanup, keeping individual tests clean and independent — this is the Playwright-recommended approach for shared state. The loginAs() and setLeaveDates() helpers in e2e/helpers/auth.js are reusable components that eliminate repeated logic across all 47 tests. workers: 1 is set in playwright.config.js to prevent database race conditions. Page Object Model (POM) was not applied — the app is a single-page application with a flat UI structure, and the team's prior Playwright experience confirmed that POM would add unnecessary overhead for a project of this scope.

Playwright tests exercise the entire stack — browser UI → Express API → PostgreSQL.  They run against a live `node server.js` instance (started automatically by `webServer` in `playwright.config.js`) and a real database.

**Global setup / teardown** (`e2e/globalSetup.js` / `e2e/globalTeardown.js`):
- Creates two extra test employees before the suite: `e2e_rs@danoff.ba` (RS entity) and `e2e_brcko@danoff.ba` (Brčko entity).
- Seeds approved leave requests for all entity × leave-type combinations used by document tests.
- Removes all `e2e_*` rows after the suite completes.

### Credentials

| User | Email | Password | Role | Entity |
|------|-------|----------|------|--------|
| Amar Hodžić | `zaposlenik@danoff.ba` | `pass123` | employee | fbih |
| Emina Hadžić | `menadzer@danoff.ba` | `pass123` | manager | fbih |
| Admin Sistem | `admin@danoff.ba` | `admin123` | admin | fbih |
| Petra Testić *(seeded)* | `e2e_rs@danoff.ba` | `pass123` | employee | rs |
| Lejla Begić *(seeded)* | `e2e_brcko@danoff.ba` | `pass123` | employee | brcko |

### Test cases (47 tests across 7 groups)

#### Authentication (7 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 1 | FBiH employee login | `#employee-dashboard` visible, name contains "Amar" |
| 2 | RS employee login | `#employee-dashboard` visible, session entity = `rs` |
| 3 | Brčko employee login | `#employee-dashboard` visible, session entity = `brcko` |
| 4 | Manager login | `#manager-dashboard` visible, name contains "Emina" |
| 5 | Admin login | `#admin-dashboard` visible, user list rendered |
| 6 | Wrong password | `#error-message` visible |
| 7 | Logout | Redirects to `login.html` |

#### Employee — FBiH (8 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 8 | Submit annual leave request | POST /api/requests 200; card appears |
| 9 | Submit paid (sick) leave request | POST 200; card appears |
| 10 | Submit unpaid (other) leave request | POST 200; card appears |
| 11 | Submitted request shows "pending" status | Badge text matches `Čeka na odobrenje` |
| 12 | Edit pending request | PATCH /api/requests/:id 200 |
| 13 | Cancel pending request | DELETE /api/requests/:id 200 |
| 14 | Leave balance = 20 days for FBiH | `app.entities['fbih'].totalDays === 20` |
| 15 | FBiH annual leave document | PDF modal HTML contains "Zakon[a]? o radu" + "FBiH\|Federaci" |

#### Employee — RS (4 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 16 | Leave balance = 18 days for RS | `app.entities['rs'].totalDays === 18` |
| 17 | Submit leave request | POST 200; card appears |
| 18 | RS annual leave document format | HTML contains "Rešenje\|godišnjeg odmora" |
| 19 | RS-specific legal reference | HTML contains "Službeni glasnik RS"; no "FBiH" |

#### Employee — Brčko (4 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 20 | Leave balance = 20 days for Brčko | `app.entities['brcko'].totalDays === 20` |
| 21 | Submit leave request | POST 200; card appears |
| 22 | Brčko document is a ZAHTJEV form | HTML contains "ZAHTJEV" |
| 23 | Brčko-specific content | HTML matches "ZAHTJEV ZA"; no FBiH/RS legal text |

#### Manager (8 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 24 | Sees pending requests on kanban | `#count-pending` > 0; pending card visible |
| 25 | Approves pending request | PUT /api/requests/:id 200; approved card appears |
| 26 | Rejects pending request | PUT 200; rejected card appears |
| 27 | Approved request disappears from pending | `#count-pending` decreases by 1 |
| 28 | Team member list | `app.users.length > 0`; kanban card has text |
| 29 | Requests attributed to employees | All `app.requests` entries have non-empty `employee` |
| 30 | Pending count badge visible | `#count-pending` renders a numeric value |
| 31 | Dashboard stats | `#stat-pending` and `#stat-approved` ≥ 0 |

#### Admin (10 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 32 | User management panel loads | `#admin-users-list` has at least one row |
| 33 | Add FBiH employee | POST /api/users 200; response has `id` |
| 34 | Add RS employee | POST 200 |
| 35 | Add Brčko employee | POST 200 |
| 36 | Edit employee details | PUT /api/users/:id 200; `success: true` |
| 37 | Delete employee | DELETE /api/users/:id 200; row count decreases |
| 38 | Duplicate email rejected | POST returns 500; toast shows "Error\|Greška" |
| 39 | View all leave requests | `#admin-requests-list` has rows |
| 40 | Approve request from admin panel | `adminHandleRequest` runs; PDF modal opens |
| 41 | Delete leave request | DELETE /api/requests/:id 200 |

#### Documents (6 tests)

| # | Scenario | Assertion |
|---|----------|-----------|
| 42 | FBiH annual — Zakon o radu FBiH | HTML ∋ `/Zakon[a]? o radu/i` + `/FBiH\|Federaci/i` |
| 43 | FBiH paid leave — same legal reference | Same as above |
| 44 | FBiH unpaid leave — same legal reference | `/Zakon[a]? o radu/i` |
| 45 | RS annual — Zakon o radu RS | `/Zakon[a]? o radu/i` + `/Službeni glasnik RS/i` |
| 46 | RS paid document differs from FBiH | `fbihHtml !== rsHtml`; each contains its own ref |
| 47 | Brčko document is ZAHTJEV form | HTML ∋ "ZAHTJEV ZA"; no FBiH/RS legal text |

### Playwright Test Results

```
Tests:  47 passed, 47 total  (49 with example.spec.js)
Time:   ~4.3 min
```

Run with:
```
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive Playwright UI
```
