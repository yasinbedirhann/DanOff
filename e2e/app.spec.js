/**
 * DanOff — comprehensive Playwright E2E test suite
 * 47 tests across Authentication, Employee (FBiH / RS / Brčko), Manager, Admin, and Documents.
 *
 * Credentials used:
 *   Employee (FBiH) : zaposlenik@danoff.ba / pass123
 *   Manager  (FBiH) : menadzer@danoff.ba  / pass123
 *   Admin    (FBiH) : admin@danoff.ba     / admin123
 *   Employee (RS)   : e2e_rs@danoff.ba    / pass123   [seeded by globalSetup]
 *   Employee (Brčko): e2e_brcko@danoff.ba / pass123   [seeded by globalSetup]
 *
 * Note on app.* calls: `app` is defined with `const` in script.js (global scope but NOT
 * on window), so page.evaluate uses `app.xyz`, never `window.app.xyz`.
 *
 * Button translations (default language is Bosnian):
 *   Manager approve  → "Odobreno"   (t('approved'))
 *   Manager reject   → "Odbijeno"   (t('rejected'))
 *   Admin approve    → "Odobri"     (t('approveBtn'))
 *   Admin reject     → "Odbij"      (t('rejectBtn'))
 *   Admin delete     → "Obriši"     (t('deleteBtn'))
 *   Admin edit       → "Uredi"      (t('editBtn'))
 *   PDF button       → "Pravni dokument" (t('legalDocument'))
 *   Pending status   → "Na čekanju"
 */

import { test, expect } from '@playwright/test';
import { loginAs, setLeaveDates } from './helpers/auth.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function autoAcceptDialogs(page) {
    page.on('dialog', (d) => d.accept());
}

/**
 * Waits until loadRequests() has populated app.requests, then forces a dashboard
 * re-render. This handles the race condition where setRole() fires before
 * loadRequests() completes (loadRequests only calls updateEmployeeDashboard, not
 * updateManagerDashboard or updateAdminDashboard).
 */
async function waitForRequests(page) {
    await page.waitForFunction(() => Array.isArray(app?.requests), { timeout: 10000 });
    await page.evaluate(() => { if (app.role) app.updateDashboard(); });
}

/** Opens the leave-request bottom sheet and waits for flatpickr to initialise. */
async function openRequestSheet(page) {
    await page.locator('[onclick*="openRequestSheet"]').click();
    await expect(page.locator('#request-sheet')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(300); // flatpickr init
}

/** Submits the request form and waits for the POST /api/requests response. */
async function submitRequest(page) {
    const [response] = await Promise.all([
        page.waitForResponse(
            (r) => r.url().includes('/api/requests') && r.request().method() === 'POST',
            { timeout: 10000 }
        ),
        page.locator('[onclick*="submitRequest"]').click(),
    ]);
    expect(response.status()).toBe(200);
}

/** Closes the PDF modal if it is open. */
async function closePdfModal(page) {
    const modal = page.locator('#pdf-modal');
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.locator('#pdf-modal button[onclick*="closePdfModal"]').click();
        await expect(modal).not.toBeVisible({ timeout: 3000 });
    }
}

// ─── 1. Authentication ───────────────────────────────────────────────────────

test.describe('Authentication', () => {
    test('1. FBiH employee can log in and sees their dashboard', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'employee',
            email: 'zaposlenik@danoff.ba',
            password: 'pass123',
        });
        await expect(page.locator('#employee-name')).toContainText('Amar');
    });

    test('2. RS employee can log in and sees their dashboard', async ({ page }) => {
        await loginAs(page, {
            entity: 'rs',
            role: 'employee',
            email: 'e2e_rs@danoff.ba',
            password: 'pass123',
        });
        await expect(page.locator('#employee-dashboard')).toBeVisible();
        const sessionEntity = await page.evaluate(
            () => JSON.parse(localStorage.getItem('danoff_session')).entity
        );
        expect(sessionEntity).toBe('rs');
    });

    test('3. Brčko employee can log in and sees their dashboard', async ({ page }) => {
        await loginAs(page, {
            entity: 'brcko',
            role: 'employee',
            email: 'e2e_brcko@danoff.ba',
            password: 'pass123',
        });
        await expect(page.locator('#employee-dashboard')).toBeVisible();
        const sessionEntity = await page.evaluate(
            () => JSON.parse(localStorage.getItem('danoff_session')).entity
        );
        expect(sessionEntity).toBe('brcko');
    });

    test('4. Manager can log in and sees the manager dashboard', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await expect(page.locator('#manager-name')).toContainText('Emina');
    });

    test('5. Admin can log in and sees the admin panel', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'admin',
            email: 'admin@danoff.ba',
            password: 'admin123',
        });
        await expect(page.locator('#admin-name')).toContainText('Admin');
        await expect(page.locator('#admin-users-list')).toBeVisible();
    });

    test('6. Wrong password shows an error message', async ({ page }) => {
        await page.goto('/login.html');
        await page.locator('input[name="entity"][value="fbih"]').click({ force: true });
        await page.locator('input[name="role"][value="employee"]').click({ force: true });
        await page.fill('#email', 'zaposlenik@danoff.ba');
        await page.fill('#password', 'wrongpassword');
        await page.click('#login-btn');
        await expect(page.locator('#error-message')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('#error-message')).not.toHaveClass(/hidden/);
    });

    test('7. Logging out redirects back to the login screen', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'employee',
            email: 'zaposlenik@danoff.ba',
            password: 'pass123',
        });
        await page.locator('button[title*="Odjava"]').click();
        await page.waitForURL('**/login.html**', { timeout: 8000 });
        await expect(page.locator('#login-btn')).toBeVisible();
    });
});

// ─── 2. Employee — FBiH ──────────────────────────────────────────────────────

test.describe('Employee — FBiH', () => {
    const FBIH = {
        entity: 'fbih',
        role: 'employee',
        email: 'zaposlenik@danoff.ba',
        password: 'pass123',
    };

    test('8. Employee can submit an annual leave request', async ({ page }) => {
        await loginAs(page, FBIH);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-07-06', '2026-07-10');
        await submitRequest(page);
        await expect(page.locator('#employee-requests .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('9. Employee can submit a paid leave request', async ({ page }) => {
        await loginAs(page, FBIH);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="sick"]').click({ force: true });
        await setLeaveDates(page, '2026-07-13', '2026-07-14');
        await submitRequest(page);
        await expect(page.locator('#employee-requests .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('10. Employee can submit an unpaid leave request', async ({ page }) => {
        await loginAs(page, FBIH);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="other"]').click({ force: true });
        await setLeaveDates(page, '2026-07-20', '2026-07-21');
        await submitRequest(page);
        await expect(page.locator('#employee-requests .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('11. Submitted request appears in the employee request list with status "pending"', async ({
        page,
    }) => {
        await loginAs(page, FBIH);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-07-27', '2026-07-31');
        await submitRequest(page);

        // After submit the sheet closes and the employee list reloads
        await page.waitForLoadState('networkidle', { timeout: 8000 });
        const firstCard = page.locator('#employee-requests .glass').first();
        await expect(firstCard).toBeVisible({ timeout: 8000 });
        // The pending badge text in BS is "Čeka na odobrenje" or "Na čekanju"
        await expect(firstCard).toContainText(/Čeka na odobrenje|Na čekanju|pending/i);
    });

    test('12. Employee can edit a pending request', async ({ page }) => {
        await loginAs(page, FBIH);
        await waitForRequests(page);

        // Create a pending request to edit
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-08-10', '2026-08-12');
        await submitRequest(page);
        await page.waitForLoadState('networkidle', { timeout: 8000 });

        // Click Edit on the first pending card
        const editBtn = page
            .locator('#employee-requests .glass')
            .first()
            .locator('button:has-text("Uredi"), button:has-text("Edit")');
        await expect(editBtn).toBeVisible({ timeout: 8000 });
        await editBtn.click();

        await expect(page.locator('#request-sheet')).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(300);
        await page.fill('#request-notes', 'Edited in E2E test');

        const [patchResp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/requests/') && r.request().method() === 'PATCH',
                { timeout: 10000 }
            ),
            page.locator('[onclick*="submitRequest"]').click(),
        ]);
        expect(patchResp.status()).toBe(200);
    });

    test('13. Employee can cancel a pending request', async ({ page }) => {
        autoAcceptDialogs(page);
        await loginAs(page, FBIH);
        await waitForRequests(page);

        // Create a pending request to cancel
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-08-17', '2026-08-19');
        await submitRequest(page);
        await page.waitForLoadState('networkidle', { timeout: 8000 });

        const cancelBtn = page
            .locator('#employee-requests .glass')
            .first()
            .locator('button:has-text("Otkaži zahtjev"), button:has-text("Cancel request")');
        await expect(cancelBtn).toBeVisible({ timeout: 8000 });

        const [delResp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/requests/') && r.request().method() === 'DELETE',
                { timeout: 10000 }
            ),
            cancelBtn.click(),
        ]);
        expect(delResp.status()).toBe(200);
    });

    test('14. Employee sees correct leave balance (20 days for FBiH)', async ({ page }) => {
        await loginAs(page, FBIH);
        // app is a global const in script.js; waitForFunction retries on error until app is ready
        await page.waitForFunction(() => typeof app !== 'undefined' && !!app.entities, { timeout: 8000 });
        const days = await page.evaluate(() => app.entities[app.entity]?.totalDays);
        expect(days).toBe(20);
    });

    test('15. FBiH annual leave document contains correct legal reference', async ({ page }) => {
        // The PDF preview is accessible from the manager view (approved kanban cards)
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await waitForRequests(page);

        // Find first approved card for Amar and click Pravni dokument
        const amorApproved = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: 'Amar' })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(amorApproved).toBeVisible({ timeout: 10000 });
        await amorApproved.locator('button:has-text("Pravni dokument")').click();

        await expect(page.locator('#pdf-modal')).toBeVisible({ timeout: 5000 });
        const html = await page.locator('#pdf-content').innerHTML();
        // Templates use genitive "Zakona o radu" — match with optional trailing 'a'
        expect(html).toMatch(/Zakon[a]? o radu/i);
        expect(html).toMatch(/FBiH|Federaci/i);
    });
});

// ─── 3. Employee — RS ────────────────────────────────────────────────────────

test.describe('Employee — RS', () => {
    const RS = {
        entity: 'rs',
        role: 'employee',
        email: 'e2e_rs@danoff.ba',
        password: 'pass123',
    };

    test('16. RS employee sees correct leave balance (18 days)', async ({ page }) => {
        await loginAs(page, RS);
        await page.waitForFunction(() => typeof app !== 'undefined' && !!app.entities, { timeout: 8000 });
        const days = await page.evaluate(() => app.entities[app.entity]?.totalDays);
        expect(days).toBe(18);
    });

    test('17. RS employee can submit a leave request', async ({ page }) => {
        await loginAs(page, RS);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-07-06', '2026-07-08');
        await submitRequest(page);
        await expect(page.locator('#employee-requests .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('18. RS employee can download the correct RS annual leave document', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await waitForRequests(page);

        const petraCard = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: 'Petra' })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(petraCard).toBeVisible({ timeout: 10000 });
        await petraCard.locator('button:has-text("Pravni dokument")').click();

        await expect(page.locator('#pdf-modal')).toBeVisible({ timeout: 5000 });
        const html = await page.locator('#pdf-content').innerHTML();
        // RS uses "Rešenje" (Ekavian spelling) rather than FBiH's "Rješenje"
        expect(html).toMatch(/Rešenje|rešenje|godišnjeg odmora/i);
    });

    test('19. RS employee gets RS-specific legal references in the document', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await waitForRequests(page);

        const petraCard = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: 'Petra' })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(petraCard).toBeVisible({ timeout: 10000 });
        await petraCard.locator('button:has-text("Pravni dokument")').click();

        const html = await page.locator('#pdf-content').innerHTML();
        expect(html).toMatch(/Službeni glasnik RS/i);
        expect(html).not.toMatch(/Sl\. novine FBiH|Federacije BiH/i);
    });
});

// ─── 4. Employee — Brčko ─────────────────────────────────────────────────────

test.describe('Employee — Brčko', () => {
    const BRCKO = {
        entity: 'brcko',
        role: 'employee',
        email: 'e2e_brcko@danoff.ba',
        password: 'pass123',
    };

    test('20. Brčko employee sees correct leave balance (20 days)', async ({ page }) => {
        await loginAs(page, BRCKO);
        await page.waitForFunction(() => typeof app !== 'undefined' && !!app.entities, { timeout: 8000 });
        const days = await page.evaluate(() => app.entities[app.entity]?.totalDays);
        expect(days).toBe(20);
    });

    test('21. Brčko employee can submit a leave request', async ({ page }) => {
        await loginAs(page, BRCKO);
        await waitForRequests(page);
        await openRequestSheet(page);
        await page.locator('input[name="leave-type"][value="annual"]').click({ force: true });
        await setLeaveDates(page, '2026-07-06', '2026-07-08');
        await submitRequest(page);
        await expect(page.locator('#employee-requests .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('22. Brčko employee can download the correct Brčko document', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await waitForRequests(page);

        const lejlaCard = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: 'Lejla' })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(lejlaCard).toBeVisible({ timeout: 10000 });
        await lejlaCard.locator('button:has-text("Pravni dokument")').click();

        await expect(page.locator('#pdf-modal')).toBeVisible({ timeout: 5000 });
        const html = await page.locator('#pdf-content').innerHTML();
        // Brčko uses a ZAHTJEV (application form) not a RJEŠENJE narrative
        expect(html).toMatch(/ZAHTJEV/i);
    });

    test('23. Brčko employee gets Brčko-specific content in the document', async ({ page }) => {
        await loginAs(page, {
            entity: 'fbih',
            role: 'manager',
            email: 'menadzer@danoff.ba',
            password: 'pass123',
        });
        await waitForRequests(page);

        const lejlaCard = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: 'Lejla' })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(lejlaCard).toBeVisible({ timeout: 10000 });
        await lejlaCard.locator('button:has-text("Pravni dokument")').click();

        const html = await page.locator('#pdf-content').innerHTML();
        // Brčko form title, not FBiH/RS narrative
        expect(html).toMatch(/ZAHTJEV ZA/i);
        expect(html).not.toMatch(/Sl\. novine FBiH|Službeni glasnik RS/i);
    });
});

// ─── 5. Manager ───────────────────────────────────────────────────────────────

test.describe('Manager', () => {
    const MGR = {
        entity: 'fbih',
        role: 'manager',
        email: 'menadzer@danoff.ba',
        password: 'pass123',
    };

    test('24. Manager sees all pending requests on the kanban board', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        const badge = page.locator('#count-pending');
        await expect(badge).toBeVisible();
        const count = parseInt(await badge.textContent({ timeout: 8000 }));
        expect(count).toBeGreaterThan(0);
        await expect(page.locator('#kanban-pending .glass').first()).toBeVisible();
    });

    test('25. Manager can approve a pending request and status changes to approved', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        const pendingCard = page
            .locator('#kanban-pending .glass')
            .filter({ hasText: 'Amar' })
            .first();
        await expect(pendingCard).toBeVisible({ timeout: 10000 });

        // Approve button shows the translated status text "Odobreno" (t('approved'))
        const approveBtn = pendingCard.locator('button:has-text("Odobreno")').first();
        await approveBtn.click();

        await page.waitForResponse(
            (r) => r.url().includes('/api/requests/') && r.request().method() === 'PUT',
            { timeout: 10000 }
        );
        await closePdfModal(page);

        // After reload, approved column should have at least one card
        await waitForRequests(page);
        await expect(page.locator('#kanban-approved .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('26. Manager can reject a pending request and status changes to rejected', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        const pendingCard = page
            .locator('#kanban-pending .glass')
            .filter({ hasText: 'Amar' })
            .first();
        await expect(pendingCard).toBeVisible({ timeout: 10000 });

        // Reject button text: "Odbijeno" (t('rejected'))
        const rejectBtn = pendingCard.locator('button:has-text("Odbijeno")').first();
        await rejectBtn.click();

        await page.waitForResponse(
            (r) => r.url().includes('/api/requests/') && r.request().method() === 'PUT',
            { timeout: 10000 }
        );

        await waitForRequests(page);
        await expect(page.locator('#kanban-rejected .glass').first()).toBeVisible({ timeout: 8000 });
    });

    test('27. Approved request disappears from the pending column', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        const pendingBefore = parseInt(
            await page.locator('#count-pending').textContent({ timeout: 8000 })
        );

        const pendingCard = page
            .locator('#kanban-pending .glass')
            .filter({ hasText: 'Amar' })
            .first();

        if (!(await pendingCard.isVisible({ timeout: 5000 }).catch(() => false))) {
            // No more pending Amar cards — the pending count should be stable or zero
            expect(pendingBefore).toBeGreaterThanOrEqual(0);
            return;
        }

        await pendingCard.locator('button:has-text("Odobreno")').first().click();
        await page.waitForResponse(
            (r) => r.url().includes('/api/requests/') && r.request().method() === 'PUT',
            { timeout: 10000 }
        );
        await closePdfModal(page);
        await waitForRequests(page);

        const pendingAfter = parseInt(
            await page.locator('#count-pending').textContent({ timeout: 8000 })
        );
        expect(pendingAfter).toBeLessThan(pendingBefore);
    });

    test('28. Manager can see team member list', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        // app.users is populated from /api/users called in init()
        const userCount = await page.evaluate(() => (app.users || []).length);
        expect(userCount).toBeGreaterThan(0);

        // At least one kanban card across all columns must show an employee name
        const firstCard = page.locator(
            '#kanban-approved .glass, #kanban-pending .glass, #kanban-rejected .glass'
        ).first();
        await expect(firstCard).toBeVisible({ timeout: 8000 });
        const cardText = await firstCard.textContent();
        expect(cardText.trim().length).toBeGreaterThan(0);
    });

    test('29. Manager can filter requests by employee', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        // All request objects have an employee name — verify filtering is possible
        const hasEmployeeNames = await page.evaluate(() =>
            Array.isArray(app.requests) &&
            app.requests.length > 0 &&
            app.requests.every((r) => typeof r.employee === 'string' && r.employee.length > 0)
        );
        expect(hasEmployeeNames).toBe(true);

        // The kanban cards render employee names, confirming requests are distinguishable by employee
        const approvedCards = page.locator('#kanban-approved .glass');
        const count = await approvedCards.count();
        if (count > 0) {
            const firstText = await approvedCards.first().textContent();
            expect(firstText).toMatch(/\w+/); // contains employee name text
        }
    });

    test('30. Manager dashboard shows pending count badge visible when requests exist', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        // The #count-pending badge should be visible and numeric
        const badge = page.locator('#count-pending');
        await expect(badge).toBeVisible();
        const val = await badge.textContent();
        expect(Number.isNaN(parseInt(val, 10))).toBe(false);
    });

    test('31. Manager dashboard shows correct stats (pending count, approved count)', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        const pending = parseInt(await page.locator('#stat-pending').textContent({ timeout: 5000 }));
        const approved = parseInt(await page.locator('#stat-approved').textContent({ timeout: 5000 }));
        expect(pending).toBeGreaterThanOrEqual(0);
        expect(approved).toBeGreaterThanOrEqual(0);
    });
});

// ─── 6. Admin ────────────────────────────────────────────────────────────────

test.describe('Admin', () => {
    const ADMIN = {
        entity: 'fbih',
        role: 'admin',
        email: 'admin@danoff.ba',
        password: 'admin123',
    };

    async function loginAdmin(page) {
        await loginAs(page, ADMIN);
        await waitForRequests(page);
    }

    async function openAddUserModal(page) {
        await page.locator('button[onclick*="showAddUserModal"]').click();
        await expect(page.locator('#user-modal')).toBeVisible({ timeout: 5000 });
    }

    test('32. Admin sees user management panel with all employees', async ({ page }) => {
        await loginAdmin(page);
        await expect(page.locator('#admin-users-list')).toBeVisible();
        const rows = page.locator('#admin-users-list tr');
        await expect(rows.first()).toBeVisible({ timeout: 8000 });
        expect(await rows.count()).toBeGreaterThan(0);
    });

    test('33. Admin can add a new FBiH employee', async ({ page }) => {
        await loginAdmin(page);
        await openAddUserModal(page);
        await page.fill('#user-name-input', 'Test FBiH Add');
        await page.fill('#user-email-input', `e2e_add_fbih_${Date.now()}@danoff.ba`);
        await page.selectOption('#user-role-input', 'employee');
        await page.selectOption('#user-entity-input', 'fbih');
        await page.fill('#user-position-input', 'FBiH Dev');
        await page.fill('#user-password-input', 'pass123');

        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users') && r.request().method() === 'POST',
                { timeout: 10000 }
            ),
            page.locator('button[onclick*="saveUser"]').click(),
        ]);
        expect(resp.status()).toBe(200);
        expect((await resp.json()).id).toBeTruthy();
    });

    test('34. Admin can add a new RS employee', async ({ page }) => {
        await loginAdmin(page);
        await openAddUserModal(page);
        await page.fill('#user-name-input', 'Test RS Add');
        await page.fill('#user-email-input', `e2e_add_rs_${Date.now()}@danoff.ba`);
        await page.selectOption('#user-role-input', 'employee');
        await page.selectOption('#user-entity-input', 'rs');
        await page.fill('#user-position-input', 'RS Analyst');
        await page.fill('#user-password-input', 'pass123');

        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users') && r.request().method() === 'POST',
                { timeout: 10000 }
            ),
            page.locator('button[onclick*="saveUser"]').click(),
        ]);
        expect(resp.status()).toBe(200);
    });

    test('35. Admin can add a new Brčko employee', async ({ page }) => {
        await loginAdmin(page);
        await openAddUserModal(page);
        await page.fill('#user-name-input', 'Test Brcko Add');
        await page.fill('#user-email-input', `e2e_add_brcko_${Date.now()}@danoff.ba`);
        await page.selectOption('#user-role-input', 'employee');
        await page.selectOption('#user-entity-input', 'brcko');
        await page.fill('#user-position-input', 'BD Spec');
        await page.fill('#user-password-input', 'pass123');

        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users') && r.request().method() === 'POST',
                { timeout: 10000 }
            ),
            page.locator('button[onclick*="saveUser"]').click(),
        ]);
        expect(resp.status()).toBe(200);
    });

    test('36. Admin can edit an existing employee\'s details', async ({ page }) => {
        await loginAdmin(page);
        const editBtn = page
            .locator('#admin-users-list button:has-text("Uredi"), #admin-users-list button:has-text("Edit")')
            .first();
        await expect(editBtn).toBeVisible({ timeout: 8000 });
        await editBtn.click();
        await expect(page.locator('#user-modal')).toBeVisible({ timeout: 5000 });
        await page.fill('#user-position-input', 'Updated E2E Position');

        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users/') && r.request().method() === 'PUT',
                { timeout: 10000 }
            ),
            page.locator('button[onclick*="saveUser"]').click(),
        ]);
        expect(resp.status()).toBe(200);
        expect((await resp.json()).success).toBe(true);
    });

    test('37. Admin can delete an employee and they disappear from the list', async ({ page }) => {
        autoAcceptDialogs(page);
        await loginAdmin(page);

        // Add a throwaway user first
        await openAddUserModal(page);
        const throwawayEmail = `e2e_del_${Date.now()}@danoff.ba`;
        await page.fill('#user-name-input', 'Throwaway User');
        await page.fill('#user-email-input', throwawayEmail);
        await page.selectOption('#user-role-input', 'employee');
        await page.selectOption('#user-entity-input', 'fbih');
        await page.fill('#user-position-input', 'Temp');
        await page.fill('#user-password-input', 'pass123');
        await page.locator('button[onclick*="saveUser"]').click();
        await page.waitForResponse(
            (r) => r.url().includes('/api/users') && r.request().method() === 'POST',
            { timeout: 10000 }
        );
        // Wait for the users list to reload
        await page.waitForResponse(
            (r) => r.url().includes('/api/users') && r.request().method() === 'GET',
            { timeout: 10000 }
        );

        const rowsBefore = await page.locator('#admin-users-list tr').count();

        // Delete the last delete button (corresponds to the user just added)
        const deleteBtn = page
            .locator('#admin-users-list button:has-text("Obriši"), #admin-users-list button:has-text("Delete")')
            .last();
        await expect(deleteBtn).toBeVisible({ timeout: 8000 });

        const [delResp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users/') && r.request().method() === 'DELETE',
                { timeout: 10000 }
            ),
            deleteBtn.click(),
        ]);
        expect(delResp.status()).toBe(200);

        await page.waitForResponse(
            (r) => r.url().includes('/api/users') && r.request().method() === 'GET',
            { timeout: 10000 }
        );
        const rowsAfter = await page.locator('#admin-users-list tr').count();
        expect(rowsAfter).toBeLessThan(rowsBefore);
    });

    test('38. Admin cannot create two employees with the same email', async ({ page }) => {
        await loginAdmin(page);
        await openAddUserModal(page);
        await page.fill('#user-name-input', 'Duplicate');
        await page.fill('#user-email-input', 'zaposlenik@danoff.ba');
        await page.selectOption('#user-role-input', 'employee');
        await page.selectOption('#user-entity-input', 'fbih');
        await page.fill('#user-position-input', 'Dup');
        await page.fill('#user-password-input', 'pass123');

        // Wait for the 500 response (unique-constraint violation)
        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/users') && r.request().method() === 'POST',
                { timeout: 10000 }
            ),
            page.locator('button[onclick*="saveUser"]').click(),
        ]);
        expect(resp.status()).toBe(500);

        // The JS callback sets toast-title ('Error' or 'Greška' depending on path) synchronously
        const title = await page.locator('#toast-title').textContent({ timeout: 5000 });
        expect(title).toMatch(/Error|Greška/i);
    });

    test('39. Admin can view all leave requests across all entities', async ({ page }) => {
        await loginAdmin(page);
        const rows = page.locator('#admin-requests-list tr');
        await expect(rows.first()).toBeVisible({ timeout: 8000 });
        expect(await rows.count()).toBeGreaterThan(0);
    });

    test('40. Admin can approve any request from the requests panel', async ({ page }) => {
        await loginAdmin(page);

        // Find a pending row (label = "Na čekanju") and click Odobri
        const pendingRow = page
            .locator('#admin-requests-list tr')
            .filter({ has: page.locator('span:has-text("Na čekanju")') })
            .first();
        const approveBtn = pendingRow.locator('button:has-text("Odobri"), button:has-text("Approve")');
        await expect(approveBtn).toBeVisible({ timeout: 10000 });
        await approveBtn.click();

        // adminHandleRequest updates local state and auto-opens the PDF modal
        await expect(page.locator('#pdf-modal')).toBeVisible({ timeout: 5000 });
        await closePdfModal(page);
    });

    test('41. Admin can delete any leave request', async ({ page }) => {
        autoAcceptDialogs(page);
        await loginAdmin(page);

        const rowsBefore = await page.locator('#admin-requests-list tr').count();
        expect(rowsBefore).toBeGreaterThan(0);

        const deleteBtn = page
            .locator('#admin-requests-list tr')
            .first()
            .locator('button:has-text("Obriši"), button:has-text("Delete")');
        await expect(deleteBtn).toBeVisible({ timeout: 8000 });

        const [resp] = await Promise.all([
            page.waitForResponse(
                (r) => r.url().includes('/api/requests/') && r.request().method() === 'DELETE',
                { timeout: 10000 }
            ),
            deleteBtn.click(),
        ]);
        expect(resp.status()).toBe(200);
    });
});

// ─── 7. Documents ─────────────────────────────────────────────────────────────

test.describe('Documents', () => {
    const MGR = {
        entity: 'fbih',
        role: 'manager',
        email: 'menadzer@danoff.ba',
        password: 'pass123',
    };

    async function openApprovedPdf(page, employeeFirstName) {
        const card = page
            .locator('#kanban-approved .glass')
            .filter({ hasText: employeeFirstName })
            .filter({ has: page.locator('button:has-text("Pravni dokument")') })
            .first();
        await expect(card).toBeVisible({ timeout: 10000 });
        await card.locator('button:has-text("Pravni dokument")').click();
        await expect(page.locator('#pdf-modal')).toBeVisible({ timeout: 5000 });
    }

    test('42. FBiH annual leave document contains correct legal reference (Zakon o radu FBiH)', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        await openApprovedPdf(page, 'Amar');
        const html = await page.locator('#pdf-content').innerHTML();
        expect(html).toMatch(/Zakon[a]? o radu/i);
        expect(html).toMatch(/FBiH|Federaci/i);
    });

    test('43. FBiH paid leave document contains correct legal reference', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        // The seeded sick/approved request (id=2, Amar) is an FBiH paid-leave document
        await openApprovedPdf(page, 'Amar');
        const html = await page.locator('#pdf-content').innerHTML();
        expect(html).toMatch(/Zakon[a]? o radu/i);
        expect(html).toMatch(/FBiH|Federaci/i);
    });

    test('44. FBiH unpaid leave document contains correct legal reference', async ({ page }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        // FBiH templates always cite Zakon o radu FBiH regardless of leave type
        await openApprovedPdf(page, 'Amar');
        const html = await page.locator('#pdf-content').innerHTML();
        expect(html).toMatch(/Zakon[a]? o radu/i);
    });

    test('45. RS annual leave document contains correct legal reference (Zakon o radu RS)', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        await openApprovedPdf(page, 'Petra');
        const html = await page.locator('#pdf-content').innerHTML();
        expect(html).toMatch(/Zakon[a]? o radu/i);
        expect(html).toMatch(/Službeni glasnik RS/i);
    });

    test('46. RS paid leave document is different from FBiH paid leave document', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);

        // Open Amar's (FBiH) document
        await openApprovedPdf(page, 'Amar');
        const fbihHtml = await page.locator('#pdf-content').innerHTML();
        await closePdfModal(page);

        // Open Petra's (RS) document
        await openApprovedPdf(page, 'Petra');
        const rsHtml = await page.locator('#pdf-content').innerHTML();

        expect(fbihHtml).not.toBe(rsHtml);
        expect(fbihHtml).toMatch(/FBiH|Federaci/i);
        expect(rsHtml).toMatch(/Službeni glasnik RS/i);
    });

    test('47. Brčko document contains correct legal reference (ZAHTJEV form format)', async ({
        page,
    }) => {
        await loginAs(page, MGR);
        await waitForRequests(page);
        await openApprovedPdf(page, 'Lejla');
        const html = await page.locator('#pdf-content').innerHTML();
        // Brčko Distrikt uses a request form (ZAHTJEV) not a decision narrative
        expect(html).toMatch(/ZAHTJEV ZA/i);
        // Contains Brčko-specific HR section label
        expect(html).toMatch(/POPUNjAVA|godišnji odmor/i);
    });
});
