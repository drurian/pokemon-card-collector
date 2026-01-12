import { test, expect } from '@playwright/test';

test('shows cards with images and modal details after admin login', async ({ page }) => {
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Pokémon Card Collector' })
  ).toBeVisible();

  const loginHeading = page.getByRole('heading', { name: 'Pokémon Cards' });
  const loginError = page.getByText('Invalid username or password');
  const loginButton = page.getByRole('button', { name: 'Sign In' });

  // Users load async; retry login until they are available or timeout.
  let loggedIn = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await loginButton.click();

    await expect(loginHeading.or(loginError)).toBeVisible({ timeout: 3000 });
    if (await loginHeading.isVisible()) {
      loggedIn = true;
      break;
    }

    await page.waitForTimeout(800);
  }

  if (!loggedIn) {
    throw new Error('Login failed for admin/admin123');
  }

  const card = page.locator('main .relative.cursor-pointer').first();
  await expect(card).toBeVisible();

  const cardImg = card.locator('img').first();
  await expect(cardImg).toBeVisible();
  await expect
    .poll(() => cardImg.evaluate((el) => el.naturalWidth))
    .toBeGreaterThan(0);

  await card.click();

  const modal = page.locator('.fixed.inset-0');
  await expect(modal).toBeVisible();
  await expect(modal).toContainText('Set');
  await expect(modal).toContainText('Number');
  await expect(modal).toContainText('Rarity');
  await expect(modal).toContainText('Type');

  const modalImg = modal.locator('img').first();
  await expect(modalImg).toBeVisible();
  await expect
    .poll(() => modalImg.evaluate((el) => el.naturalWidth))
    .toBeGreaterThan(0);

  expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
});
