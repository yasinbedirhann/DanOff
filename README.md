# DanOff - Employee Leave Management System

A full-stack web application for managing employee leave requests, built for a QA firm operating across three Bosnian legal jurisdictions. Supports three user roles, entity-specific legal document generation, real-time push notifications, and a 139-test automated test suite.

---

## Features

### Employee
- Submit annual, paid (sick), and unpaid leave requests
- View and manage personal request history
- Edit or cancel pending requests
- Download legally compliant leave documents (entity-specific PDF)
- Receive push notifications when requests are approved or rejected

### Manager
- View all pending requests on a kanban board
- Approve or reject leave requests
- View team member list and request statistics
- Receive push notifications when new requests are submitted

### Admin
- Full employee CRUD (create, edit, delete) across all entities
- Assign roles: employee, manager, admin
- View and manage all leave requests across all entities
- Approve, reject, or delete any request

---

## Legal Document Generation

Each leave request generates the correct legal document based on the employee's entity and leave type - **9 distinct document variants**:

| Leave Type | FBiH | Republika Srpska | Brčko Distrikt |
|------------|------|-----------------|----------------|
| Annual | Rješenje o korištenju godišnjeg odmora | Rešenje o korišćenju godišnjeg odmora | Zahtjev za godišnji odmor |
| Paid (sick) | Rješenje o plaćenom odsustvu | Rešenje o plaćenom odsustvu | Zahtjev za plaćeno odsustvo |
| Unpaid | Rješenje o neplaćenom odsustvu | Rešenje o neplaćenom odsustvu | Zahtjev za neplaćeno odsustvo |

Leave entitlements per entity:
- **FBiH** - 20 days
- **Republika Srpska** - 18 days
- **Brčko Distrikt** - 20 days

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Frontend | Vanilla JavaScript, HTML, CSS, Tailwind |
| PDF Generation | jsPDF |
| Push Notifications | Web Push (VAPID) |
| Testing (unit/integration) | Jest, Supertest |
| Testing (end-to-end) | Playwright |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/danoff.git
cd danoff
npm install
```

### Database Setup

Create a PostgreSQL database and run the schema:

```bash
psql -U postgres -d postgres -f database/schema.sql
```

### Environment

Create a `.env` file in the project root:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=postgres
DB_PASSWORD=your_password
DB_PORT=5432

VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

To generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

### Run the App

```bash
node server.js
```

Then open [http://localhost:3000/login.html](http://localhost:3000/login.html)

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| zaposlenik@danoff.ba | pass123 | Employee (FBiH) |
| menadzer@danoff.ba | pass123 | Manager (FBiH) |
| admin@danoff.ba | admin123 | Admin (FBiH) |

---

## Testing

### Unit & Integration Tests (Jest + Supertest)

Runs 92 tests across 8 test files. No database connection required - PostgreSQL is fully mocked.

```bash
npm test
```

**Coverage:**

| File | Tests | What it covers |
|------|-------|---------------|
| `tests/auth.test.js` | 10 | Login for all 3 roles, error cases |
| `tests/employee.test.js` | 15 | Leave submission, history, edit, delete, entitlements, push |
| `tests/manager.test.js` | 10 | Approve, reject, team list, push notifications |
| `tests/admin.test.js` | 15 | User CRUD across all entities, role creation, password hashing |
| `tests/documents.test.js` | 12 | PDF routing - 3 entities × 3 leave types |
| `tests/middleware.test.js` | 6 | Auth middleware, push subscribe, VAPID key |
| `tests/requests.test.js` | 13 | Leave request API endpoints |
| `tests/users.test.js` | 11 | User API endpoints |

### End-to-End Tests (Playwright)

Runs 47 tests in a real Chromium browser against a live server and database.

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode (watch tests run live)
```

**Coverage:** Authentication, employee workflows across all 3 entities, manager kanban, admin panel, legal document content verification.

> **Total: 139 tests - all passing.**

---

## Project Structure

```
danoff/
├── routes/
│   ├── auth.js          # Login endpoint
│   ├── users.js         # Employee CRUD
│   ├── requests.js      # Leave request management
│   └── push.js          # Web push notifications
├── middleware/
│   └── auth.js          # x-user-id authentication
├── config/
│   └── entities.js      # Leave entitlements per entity
├── lib/
│   └── pdfRouter.js     # PDF variant routing logic
├── database/
│   └── schema.sql       # Database schema
├── tests/               # Jest unit/integration tests
├── e2e/                 # Playwright end-to-end tests
├── server.js            # Express app entry point
├── db.js                # PostgreSQL connection
├── script.js            # Frontend logic
├── index.html           # Main app
└── login.html           # Login page
```

---

## Academic Context

Built as a Software Engineering course project. Documentation includes:
- `TESTING.md` - full test documentation (139 tests, framework rationale, test case tables)
- `CHANGELOG.md` - complete version history from v1.0.0 to v1.5.0

---

## Author

Kemal - Software Engineering Student
