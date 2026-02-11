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

const openAdminPanel = async (page) => {
  await page.getByTestId('open-admin-panel').click();
  const adminPanel = page.locator('.fixed.inset-0').filter({
    has: page.getByRole('heading', { name: 'Admin Panel' })
  });
  await expect(adminPanel).toBeVisible();
  return adminPanel;
};

test('admin can add user, edit user, select avatar, and delete user', async ({ page }) => {
  const username = `testuser-${Date.now()}`;
  const initialPassword = 'pass-1';
  const newPassword = 'pass-2';

  await login(page, 'admin', 'admin123');

  const adminPanel = await openAdminPanel(page);

  await adminPanel.getByPlaceholder('Username').fill(username);
  await adminPanel.getByPlaceholder('Password').fill(initialPassword);
  await adminPanel.getByTestId('add-user').click();

  const userRow = adminPanel.getByTestId(`user-row-${username}`);
  await expect(userRow).toBeVisible();

  await userRow.getByTestId('edit-user').click();

  const editModal = page.getByTestId('edit-user-modal');
  await expect(editModal).toBeVisible();

  await editModal.getByRole('button', { name: 'No avatar' }).click();
  await editModal.getByRole('button', { name: 'Blastoise' }).click();
  await editModal.getByTestId('edit-user-password').fill(newPassword);
  await editModal.getByRole('button', { name: 'Save Changes' }).click();
  try {
    await editModal.waitFor({ state: 'hidden', timeout: 4000 });
  } catch (e) {
    await editModal.getByTestId('edit-user-cancel').click();
    await editModal.waitFor({ state: 'hidden' });
  }

  await page.getByTestId('admin-panel-close').click();
  await page.getByTestId('logout').click();
  await login(page, username, newPassword);
  await expect(page.getByText(username, { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: `${username} avatar` })).toHaveAttribute('src', /blastoise/i);

  await page.getByTestId('logout').click();
  await login(page, 'admin', 'admin123');

  const adminPanelAgain = await openAdminPanel(page);
  page.on('dialog', (dialog) => dialog.accept());
  const userRowDelete = adminPanelAgain.getByTestId(`user-row-${username}`);
  await userRowDelete.getByTestId('delete-user').click();
  await expect(adminPanelAgain.getByTestId(`user-row-${username}`)).toBeHidden();

  await page.getByTestId('admin-panel-close').click();
  await page.getByTestId('logout').click();
  await login(page, username, newPassword).catch(() => {});
  await expect(page.getByText('Invalid username or password')).toBeVisible();
});
