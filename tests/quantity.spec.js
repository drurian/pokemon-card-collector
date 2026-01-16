import { test, expect } from '@playwright/test';

const login = async (page, username, password, { navigate = true } = {}) => {
  if (navigate) {
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await page.goto('/');
  }
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

const openAdminPanel = async (page) => {
  await page.getByTestId('open-admin-panel').click();
  const adminPanel = page.locator('.fixed.inset-0').filter({
    has: page.getByRole('heading', { name: 'Admin Panel' })
  });
  await expect(adminPanel).toBeVisible();
  return adminPanel;
};

const getTabCount = async (locator) => {
  const text = await locator.textContent();
  const match = text ? text.match(/\((\d+)\)/) : null;
  return match ? parseInt(match[1], 10) : 0;
};

test('updates quantity and summary counts', async ({ page }) => {
  const adminHash = await (async () => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update('admin123').digest('hex');
  })();
  const quantityUserHash = await (async () => {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update('quantity123').digest('hex');
  })();

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
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/pokemon_users**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { username: 'admin', password: adminHash, is_admin: true },
      { username: 'quantity-user', password: quantityUserHash, is_admin: false }
    ])
  }));

  await page.route('**/rest/v1/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([])
  }));

  await login(page, 'admin', 'admin123');

  const adminPanel = await openAdminPanel(page);
  await adminPanel.getByPlaceholder('Username').fill('quantity-user');
  await adminPanel.getByPlaceholder('Password').fill('quantity123');
  await adminPanel.getByTestId('add-user').click();
  await expect(adminPanel.getByTestId('user-row-quantity-user')).toBeVisible();
  await page.getByTestId('admin-panel-close').click();

  await page.getByTestId('logout').click();
  await login(page, 'quantity-user', 'quantity123', { navigate: false });

  const collectionTab = page.getByTestId('nav-tab-collection');

  const cards = page.locator('main .relative.cursor-pointer');
  await expect(cards).toHaveCount(2);

  await cards.first().click();
  const modal = page.locator('.fixed.inset-0');
  await expect(modal).toBeVisible();
  const collectedButton = page.getByRole('button', { name: 'Collected ✓' });
  if (await collectedButton.count()) {
    await collectedButton.click();
  }
  const collectionBaseline = await getTabCount(collectionTab);
  await page.getByRole('button', { name: 'Add to Collection' }).click();
  await modal.click({ position: { x: 10, y: 10 } });
  await expect(modal).toBeHidden();

  await page.getByTestId('nav-tab-collection').click();
  await expect
    .poll(() => getTabCount(collectionTab))
    .toBe(collectionBaseline + 1);

  await cards.first().click();
  const decrement = page.getByRole('button', { name: '−' });
  const increment = page.getByRole('button', { name: '+' });
  const qtyInput = page.getByRole('spinbutton');
  await expect(qtyInput).toHaveValue('1');
  await increment.click();
  await expect(qtyInput).toHaveValue('2');
  await decrement.click();
  await expect(qtyInput).toHaveValue('1');
  await qtyInput.fill('3');
  await expect(qtyInput).toHaveValue('3');
  await modal.click({ position: { x: 10, y: 10 } });
  await expect(modal).toBeHidden();

  await expect(page.getByText('Total copies:')).toBeVisible();
  await expect(page.getByText('Total copies:').locator('..')).toContainText('3');
  await expect(page.getByText('Duplicates:').locator('..')).toContainText('2');
});
