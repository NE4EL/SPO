import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Автомобили', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/vehicles');
  });

  test('страница автомобилей загружается', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /автомобили/i })).toBeVisible();
  });

  test('кнопка добавления автомобиля присутствует', async ({ page }) => {
    const btn = page.getByRole('button', { name: /добавить|новый/i });
    await expect(btn).toBeVisible();
  });

  test('поле поиска по автомобилям присутствует', async ({ page }) => {
    const search = page.getByPlaceholder(/поиск по марке/i);
    await expect(search).toBeVisible();
  });

  test('поиск фильтрует список', async ({ page }) => {
    const search = page.getByPlaceholder(/поиск по марке/i);
    await search.fill('XYZ_НЕСУЩЕСТВУЮЩИЙ_АВТОМОБИЛЬ_12345');
    await page.waitForTimeout(500);
    // При несуществующем запросе должно появиться сообщение "не найдены"
    await expect(page.getByText(/не найден/i)).toBeVisible({ timeout: 5_000 });
  });

  test('форма добавления автомобиля открывается', async ({ page }) => {
    await page.getByRole('button', { name: /добавить|новый/i }).click();
    // Поле "Марка" в форме
    await expect(page.getByText(/марка|марку/i).first()).toBeVisible();
  });

  test('форма добавления закрывается кнопкой отмена', async ({ page }) => {
    await page.getByRole('button', { name: /добавить|новый/i }).click();
    await page.getByRole('button', { name: /отмена|закрыть/i }).click();
    // После закрытия форма исчезает
    await expect(page.getByRole('button', { name: /отмена|закрыть/i })).not.toBeVisible();
  });

});
