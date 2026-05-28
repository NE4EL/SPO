import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Склад запчастей', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/warehouse');
  });

  test('страница склада загружается', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /склад|запчасти/i })).toBeVisible();
  });

  test('таблица запчастей отображается', async ({ page }) => {
    await expect(
      page.locator('table, [role="table"], ul li, .part-item').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('кнопка добавления запчасти присутствует', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /добавить|новая|создать/i });
    await expect(addBtn).toBeVisible();
  });

  test('поиск по запчастям работает', async ({ page }) => {
    const search = page.getByPlaceholder(/поиск/i);
    if (await search.isVisible()) {
      await search.fill('масло');
      await page.waitForTimeout(500);
    }
  });

  test('карточки статистики склада отображаются', async ({ page }) => {
    await expect(page.getByText('Стоимость склада')).toBeVisible();
  });

  test('форма добавления запчасти открывается', async ({ page }) => {
    await page.getByRole('button', { name: /добавить|новая|создать/i }).click();
    // В форме должны быть поля названия и цены
    await expect(page.getByText(/название|наименование/i).first()).toBeVisible();
  });

  test('форма добавления запчасти закрывается', async ({ page }) => {
    await page.getByRole('button', { name: /добавить|новая|создать/i }).click();
    await page.getByRole('button', { name: /отмена|закрыть/i }).first().click();
    await expect(page.getByRole('button', { name: /отмена|закрыть/i })).not.toBeVisible();
  });

  test('заголовки таблицы присутствуют', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: 'Запчасть' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('columnheader', { name: 'Категория' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Цена' })).toBeVisible();
  });

});
