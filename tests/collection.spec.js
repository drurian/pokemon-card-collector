import { test, expect } from '@playwright/test';

const login = async (page, username, password) => {
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

test('can search, add to collection, and add to wishlist', async ({ page }) => {
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
      name: 'Stone Ember',
      set: { name: 'Mock Set' },
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
    if (url.includes('/v2/en/cards?')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockCards)
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await login(page, 'admin', 'admin123');

  const searchInput = page.getByPlaceholder('Search by name...');
  await searchInput.fill('River');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('button', { name: 'Back to Featured' })).toBeVisible();

  const cards = page.locator('main .relative.cursor-pointer');
  await expect(cards).toHaveCount(2);

  await cards.first().click();
  await page.getByRole('button', { name: 'Add to Collection' }).click();
  await page.getByRole('button', { name: 'Add to Wishlist' }).click();
  await page.locator('.fixed.inset-0').click();

  await expect(page.getByTestId('nav-tab-collection')).toContainText('(1)');
  await expect(page.getByTestId('nav-tab-wishlist')).toContainText('(1)');
});
