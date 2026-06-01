import { expect } from '@playwright/test';

/**
 * Log in to DanOff and wait for the correct dashboard to fully load.
 * @param {import('@playwright/test').Page} page
 * @param {{ entity: string, role: string, email: string, password: string }} opts
 */
export async function loginAs(page, { entity, role, email, password }) {
    await page.goto('/login.html');
    // Entity and role radios are visually hidden (sr-only); force-click the input element
    await page.locator(`input[name="entity"][value="${entity}"]`).click({ force: true });
    await page.locator(`input[name="role"][value="${role}"]`).click({ force: true });
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('#login-btn');

    // login.js delays 800 ms + 500 ms before redirecting
    await page.waitForURL('**/index.html**', { timeout: 15000 });

    // setRole() fires after a 100 ms timeout — wait for the dashboard div to be shown
    const dashboardId = `#${role}-dashboard`;
    await expect(page.locator(dashboardId)).toBeVisible({ timeout: 10000 });

    // Wait until both loadRequests() and loadUsers() API calls have settled
    await page.waitForLoadState('networkidle', { timeout: 15000 });
}

/**
 * Set both flatpickr date pickers and wait for calculated-days to update.
 * Must be called after the request sheet is already open.
 * @param {import('@playwright/test').Page} page
 * @param {string} start - YYYY-MM-DD
 * @param {string} end   - YYYY-MM-DD
 */
export async function setLeaveDates(page, start, end) {
    // app is declared with const in script.js (global scope, not window property)
    await page.evaluate(
        ([s, e]) => {
            app._fpStart.setDate(s, true);
            app._fpEnd.setDate(e, true);
        },
        [start, end]
    );
    await page.waitForFunction(
        () => parseInt(document.getElementById('calculated-days').textContent) > 0,
        { timeout: 5000 }
    );
}
