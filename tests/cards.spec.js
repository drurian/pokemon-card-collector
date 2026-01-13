import { test, expect } from '@playwright/test';

test('shows cards with images and modal details after admin login', async ({ page }) => {
  const consoleErrors = [];
  const mockCards = [
    {
      id: 'test-1',
      name: 'River Spark',
      set: { name: 'Mock Set' },
      number: '1',
      rarity: 'Common',
      types: ['Water'],
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Z2a8AAAAASUVORK5CYII='
    },
    {
      id: 'test-2',
      name: 'No Image',
      set: { name: 'Mock Set' },
      number: '2',
      rarity: 'Rare',
      types: ['Fire']
    }
  ];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  await page.route('https://api.tcgdex.net/**', (route) => {
    const url = route.request().url();
    if (url.endsWith('/v2/en/sets')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'test-set', releaseDate: '2024-01-01' }])
      });
    }
    if (url.includes('/v2/en/sets/test-set')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cards: mockCards })
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
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

  const cards = page.locator('main .relative.cursor-pointer');
  await expect(cards).toHaveCount(2);

  const card = cards.first();
  await expect(card).toBeVisible();

  const cardImg = card.locator('img').first();
  await expect(cardImg).toBeVisible();
  await expect
    .poll(() => cardImg.evaluate((el) => el.naturalWidth))
    .toBeGreaterThan(0);
  await cardImg.evaluate((img) => { img.dispatchEvent(new Event('error')); });
  await expect
    .poll(() => cardImg.getAttribute('src'))
    .toMatch(/svg\+xml/);

  const cardWithoutImage = cards.nth(1);
  const fallbackImg = cardWithoutImage.locator('img').first();
  await expect
    .poll(() => fallbackImg.getAttribute('src'))
    .toMatch(/svg\+xml/);

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
