import { test, expect } from '@playwright/test';
import { login, ADMIN } from './helpers';

test.describe('Авторизация', () => {

  test('страница входа отображается корректно', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/login/);
    await expect(page.getByText('АвтоСервис')).toBeVisible();
    await expect(page.getByText('Вход в систему')).toBeVisible();
    await expect(page.getByPlaceholder('Введите логин')).toBeVisible();
    await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();
  });

  test('кнопка активируется после заполнения полей', async ({ page }) => {
    await page.goto('/login');
    const btn = page.getByRole('button', { name: 'Войти' });
    await expect(btn).toBeDisabled();

    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('pass');
    await expect(btn).toBeEnabled();
  });

  test('успешный вход администратора', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL('/');
    // После входа должен показываться дашборд
    await expect(page.getByText(/дашборд|заказы|статистика/i).first()).toBeVisible();
  });

  test('неверный пароль не пускает в систему', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('wrongpassword');
    await page.getByRole('button', { name: 'Войти' }).click();
    // Остаёмся на странице логина
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('незалогиненный пользователь перенаправляется на /login', async ({ page }) => {
    await page.goto('/warehouse');
    await expect(page).toHaveURL(/login/);
  });

  test('показать/скрыть пароль', async ({ page }) => {
    await page.goto('/login');
    const input = page.getByPlaceholder('Введите пароль');
    await expect(input).toHaveAttribute('type', 'password');

    await page.locator('button[type="button"]').click();
    await expect(input).toHaveAttribute('type', 'text');

    await page.locator('button[type="button"]').click();
    await expect(input).toHaveAttribute('type', 'password');
  });

});
