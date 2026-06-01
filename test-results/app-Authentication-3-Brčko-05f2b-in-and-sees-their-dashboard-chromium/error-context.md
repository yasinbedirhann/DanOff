# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> Authentication >> 3. Brčko employee can log in and sees their dashboard
- Location: e2e/app.spec.js:101:9

# Error details

```
Error: page.waitForURL: Target page, context or browser has been closed
=========================== logs ===========================
waiting for navigation to "**/index.html**" until "load"
  navigated to "http://localhost:3000/index.html?role=employee&auth=true"
============================================================
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Log in to DanOff and wait for the correct dashboard to fully load.
  5  |  * @param {import('@playwright/test').Page} page
  6  |  * @param {{ entity: string, role: string, email: string, password: string }} opts
  7  |  */
  8  | export async function loginAs(page, { entity, role, email, password }) {
  9  |     await page.goto('/login.html');
  10 |     // Entity and role radios are visually hidden (sr-only); force-click the input element
  11 |     await page.locator(`input[name="entity"][value="${entity}"]`).click({ force: true });
  12 |     await page.locator(`input[name="role"][value="${role}"]`).click({ force: true });
  13 |     await page.fill('#email', email);
  14 |     await page.fill('#password', password);
  15 |     await page.click('#login-btn');
  16 | 
  17 |     // login.js delays 800 ms + 500 ms before redirecting
> 18 |     await page.waitForURL('**/index.html**', { timeout: 15000 });
     |                ^ Error: page.waitForURL: Target page, context or browser has been closed
  19 | 
  20 |     // setRole() fires after a 100 ms timeout — wait for the dashboard div to be shown
  21 |     const dashboardId = `#${role}-dashboard`;
  22 |     await expect(page.locator(dashboardId)).toBeVisible({ timeout: 10000 });
  23 | 
  24 |     // Wait until both loadRequests() and loadUsers() API calls have settled
  25 |     await page.waitForLoadState('networkidle', { timeout: 15000 });
  26 | }
  27 | 
  28 | /**
  29 |  * Set both flatpickr date pickers and wait for calculated-days to update.
  30 |  * Must be called after the request sheet is already open.
  31 |  * @param {import('@playwright/test').Page} page
  32 |  * @param {string} start - YYYY-MM-DD
  33 |  * @param {string} end   - YYYY-MM-DD
  34 |  */
  35 | export async function setLeaveDates(page, start, end) {
  36 |     // app is declared with const in script.js (global scope, not window property)
  37 |     await page.evaluate(
  38 |         ([s, e]) => {
  39 |             app._fpStart.setDate(s, true);
  40 |             app._fpEnd.setDate(e, true);
  41 |         },
  42 |         [start, end]
  43 |     );
  44 |     await page.waitForFunction(
  45 |         () => parseInt(document.getElementById('calculated-days').textContent) > 0,
  46 |         { timeout: 5000 }
  47 |     );
  48 | }
  49 | 
```