import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Управление пользователями', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/users');
  });

  test('страница пользователей загружается', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /пользовател/i })).toBeVisible();
  });

  test('кнопка добавления пользователя присутствует', async ({ page }) => {
    await expect(page.getByRole('button', { name: /добавить пользователя/i })).toBeVisible();
  });

  test('список пользователей отображается', async ({ page }) => {
    // Должен быть хотя бы один пользователь (admin)
    await expect(page.getByText('admin').first()).toBeVisible({ timeout: 10_000 });
  });

  test('роли пользователей отображаются', async ({ page }) => {
    const hasRole = await page.getByText(/администратор|менеджер|механик/i).first().isVisible();
    expect(hasRole).toBeTruthy();
  });

  test('форма создания пользователя открывается', async ({ page }) => {
    await page.getByRole('button', { name: /добавить пользователя/i }).click();
    await expect(page.getByText(/роль/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /отмена|закрыть/i })).toBeVisible();
  });

  test('форма создания пользователя закрывается', async ({ page }) => {
    await page.getByRole('button', { name: /добавить пользователя/i }).click();
    await page.getByRole('button', { name: /отмена|закрыть/i }).click();
    await expect(page.getByRole('button', { name: /отмена|закрыть/i })).not.toBeVisible();
  });

});
