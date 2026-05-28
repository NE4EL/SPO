import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Дашборд', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
  });

  test('страница дашборда загружается', async ({ page }) => {
    await expect(page.getByText('Выручка (завершённые)')).toBeVisible();
  });

  test('карточки статистики отображаются', async ({ page }) => {
    await expect(page.getByText('Активные заказы')).toBeVisible();
    await expect(page.getByText('Автомобилей в базе')).toBeVisible();
    await expect(page.getByText('Запчастей на складе')).toBeVisible();
  });

  test('графики отображаются', async ({ page }) => {
    await expect(page.getByText('Выручка по месяцам')).toBeVisible();
    await expect(page.getByText('Статусы заказов')).toBeVisible();
  });

  test('блок последних заказов присутствует', async ({ page }) => {
    await expect(page.getByText('Последние заказы')).toBeVisible();
  });

});
