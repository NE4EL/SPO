import { Page } from '@playwright/test';

export const ADMIN = { username: 'admin', password: 'admin123' };

export async function login(page: Page, username = ADMIN.username, password = ADMIN.password) {
  await page.goto('/');
  await page.waitForTimeout(500);
  await page.getByPlaceholder('Введите логин').pressSequentially(username, { delay: 100 });
  await page.waitForTimeout(400);
  await page.getByPlaceholder('Введите пароль').pressSequentially(password, { delay: 100 });
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('/');
}

export async function logout(page: Page) {
  await page.goto('/profile');
  const logoutBtn = page.getByRole('button', { name: /выйти/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
}
