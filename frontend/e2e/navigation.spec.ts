import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Навигация', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('сайдбар содержит все основные разделы', async ({ page }) => {
    await expect(page.getByRole('link', { name: /заказы/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /склад|запчасти/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /автомобили/i })).toBeVisible();
  });

  test('переход на страницу заказов', async ({ page }) => {
    await page.getByRole('link', { name: /заказы/i }).click();
    await expect(page).toHaveURL('/orders');
  });

  test('переход на страницу склада', async ({ page }) => {
    await page.getByRole('link', { name: /склад|запчасти/i }).click();
    await expect(page).toHaveURL('/warehouse');
  });

  test('переход на страницу автомобилей', async ({ page }) => {
    await page.getByRole('link', { name: /автомобили/i }).click();
    await expect(page).toHaveURL('/vehicles');
  });

  test('переход на профиль', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL('/profile');
    await expect(page.getByText(/профиль|выйти/i).first()).toBeVisible();
  });

});
