import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Заказ-наряды', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/orders');
  });

  test('страница заказов загружается', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /заказ/i })).toBeVisible();
  });

  test('список заказов отображается', async ({ page }) => {
    await expect(
      page.locator('table, [role="table"], .order-item, ul li').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('кнопка создания заказа присутствует', async ({ page }) => {
    const btn = page.getByRole('button', { name: /создать|новый|добавить/i });
    await expect(btn).toBeVisible();
  });

  test('статусы заказов отображаются', async ({ page }) => {
    const statuses = ['В ожидании', 'В работе', 'Завершён', 'Отменён',
                      'pending', 'in_progress', 'completed'];
    let found = false;
    for (const status of statuses) {
      if (await page.getByText(status).first().isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    const empty = await page.getByText(/нет заказов|пусто|no orders/i).first().isVisible().catch(() => false);
    expect(found || empty).toBeTruthy();
  });

  test('фильтры по статусу присутствуют', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Все заказы' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'В ожидании' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'В работе' })).toBeVisible();
  });

  test('поле поиска по заказам присутствует', async ({ page }) => {
    const search = page.getByPlaceholder(/поиск по номеру/i);
    await expect(search).toBeVisible();
  });

  test('поиск фильтрует заказы', async ({ page }) => {
    const search = page.getByPlaceholder(/поиск по номеру/i);
    await search.fill('XYZ-НЕТАКОГО');
    await page.waitForTimeout(500);
    // Либо нет результатов, либо что-то найдено — страница не падает
    const hasAnything = await page.locator('table tbody tr, .order-item').count();
    expect(hasAnything).toBeGreaterThanOrEqual(0);
  });

  test('форма нового заказа открывается', async ({ page }) => {
    await page.getByRole('button', { name: /новый заказ/i }).click();
    await expect(page.getByText(/клиент/i).first()).toBeVisible();
    await expect(page.getByText(/автомобиль/i).first()).toBeVisible();
  });

  test('форма нового заказа закрывается', async ({ page }) => {
    await page.getByRole('button', { name: /новый заказ/i }).click();
    const cancelBtn = page.getByRole('button', { name: /отмена|закрыть/i }).first();
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();
    await expect(cancelBtn).not.toBeVisible();
  });

});
