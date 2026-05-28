import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Профиль', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/profile');
  });

  test('страница профиля загружается', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
  });

  test('блок информации об аккаунте присутствует', async ({ page }) => {
    await expect(page.getByText('Информация об аккаунте')).toBeVisible();
  });

  test('отображается логин пользователя', async ({ page }) => {
    await expect(page.getByText('Логин')).toBeVisible();
    await expect(page.getByText('admin').first()).toBeVisible();
  });

  test('отображается роль пользователя', async ({ page }) => {
    await expect(page.getByText('Роль')).toBeVisible();
    await expect(page.getByText(/администратор|менеджер|механик/i).first()).toBeVisible();
  });

  test('кнопка выхода присутствует', async ({ page }) => {
    await expect(page.getByRole('button', { name: /выйти/i })).toBeVisible();
  });

  test('выход из системы перенаправляет на /login', async ({ page }) => {
    await page.getByRole('button', { name: /выйти/i }).click();
    await expect(page).toHaveURL(/login/);
  });

});
