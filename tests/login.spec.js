import { test, expect } from '@playwright/test';

test('shows the login screen', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Pokémon Card Collector' })
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});
