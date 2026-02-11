import { test, expect } from '@playwright/test';

const login = async (page, username, password) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Pokémon Card Collector' })
  ).toBeVisible();

  const loginHeading = page.getByRole('heading', { name: 'Pokémon Cards' });
  const loginError = page.getByText('Invalid username or password');
  const loginButton = page.getByRole('button', { name: 'Sign In' });

  let loggedIn = false;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByPlaceholder('Username').fill(username);
    await page.getByPlaceholder('Password').fill(password);
    await loginButton.click();

    await expect(loginHeading.or(loginError)).toBeVisible({ timeout: 3000 });
    if (await loginHeading.isVisible()) {
      loggedIn = true;
      break;
    }

    await page.waitForTimeout(800);
  }

  if (!loggedIn) {
    throw new Error(`Login failed for ${username}`);
  }
};

const getTabCount = async (locator) => {
  const text = await locator.textContent();
  const match = text ? text.match(/\((\d+)\)/) : null;
  return match ? parseInt(match[1], 10) : 0;
};

test('can remove from collection and wishlist and update counts', async ({ page }) => {
  const adminHash = await (async () => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update('admin123').digest('hex');
  })();

  const mockCards = [
    {
      id: 'test-1',
      name: 'River Spark',
      set: { name: 'Base Set' },
      number: '1',
      rarity: 'Common',
      types: ['Water'],
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Z2a8AAAAASUVORK5CYII='
    },
    {
      id: 'test-2',
      name: 'Stone Ember',
      set: { name: 'Base Set' },
      number: '2',
      rarity: 'Rare',
      types: ['Fire']
    }
  ];

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

  await page.route('**/rest/v1/**', (route) => {
    const url = route.request().url();
    if (url.includes('/pokemon_users')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ username: 'admin', password: adminHash, is_admin: true }])
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await login(page, 'admin', 'admin123');

  const collectionTab = page.getByTestId('nav-tab-collection');
  const wishlistTab = page.getByTestId('nav-tab-wishlist');
  const cards = page.locator('main .relative.cursor-pointer');
  await expect(cards).toHaveCount(2);

  await cards.first().click();
  const modal = page.locator('.fixed.inset-0');
  await expect(modal).toBeVisible();
  const collectedButton = page.getByRole('button', { name: 'Collected ✓' });
  if (await collectedButton.count()) {
    await collectedButton.click();
  }
  const wantedButton = page.getByRole('button', { name: 'Wanted ✓' });
  if (await wantedButton.count()) {
    await wantedButton.click();
  }
  const collectionBaseline = await getTabCount(collectionTab);
  const wishlistBaseline = await getTabCount(wishlistTab);
  await page.getByRole('button', { name: 'Add to Collection' }).click();
  await page.getByRole('button', { name: 'Add to Wishlist' }).click();
  await modal.click({ position: { x: 10, y: 10 } });
  await expect(modal).toBeHidden();

  await expect
    .poll(() => getTabCount(collectionTab))
    .toBe(collectionBaseline + 1);
  await expect
    .poll(() => getTabCount(wishlistTab))
    .toBe(wishlistBaseline + 1);

  await cards.first().click();
  await expect(modal).toBeVisible();
  const collectionAfterAdd = await getTabCount(collectionTab);
  const wishlistAfterAdd = await getTabCount(wishlistTab);
  if (await collectedButton.count()) {
    await collectedButton.click();
  }
  if (await wantedButton.count()) {
    await wantedButton.click();
  }
  await modal.click({ position: { x: 10, y: 10 } });
  await expect(modal).toBeHidden();

  await expect
    .poll(() => getTabCount(collectionTab))
    .toBe(collectionAfterAdd - 1);
  await expect
    .poll(() => getTabCount(wishlistTab))
    .toBe(wishlistAfterAdd - 1);
});
