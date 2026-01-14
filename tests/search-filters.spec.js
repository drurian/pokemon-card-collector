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

test('search filters apply and reset returns to featured cards', async ({ page }) => {
  const featuredCards = [
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
        body: JSON.stringify({ cards: featuredCards })
      });
    }
    if (url.includes('/v2/en/cards?')) {
      const params = new URL(url).searchParams;
      const typeFilter = params.get('types');
      const rarityFilter = params.get('rarity');
      const filtered = featuredCards.filter((card) => {
        const typeMatch = !typeFilter || card.types?.includes(typeFilter);
        const rarityMatch = !rarityFilter || card.rarity === rarityFilter;
        return typeMatch && rarityMatch;
      });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered)
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await login(page, 'admin', 'admin123');

  await page.getByRole('button', { name: 'Toggle filters' }).click();
  const filters = page.locator('main select');
  await expect(filters).toHaveCount(2);
  await filters.nth(0).selectOption({ label: 'Water' });
  await filters.nth(1).selectOption({ label: 'Common' });

  await page.getByRole('button', { name: 'Search' }).click();

  const cards = page.locator('main .relative.cursor-pointer');
  await expect(cards).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Back to Featured' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Featured' }).click();
  await expect(page.getByText('Featured set')).toBeVisible();
  await expect(page.getByPlaceholder('Search by name...')).toHaveValue('');
  await expect(filters.nth(0)).toHaveValue('');
  await expect(filters.nth(1)).toHaveValue('');
});
