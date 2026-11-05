import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function predict(page: Page) {
  await page.getByRole('button', { name: 'Make a prediction', exact: true }).click();
  await page.getByRole('button', { name: /lock in my prediction/i }).click();
  await expect(page.getByRole('button', { name: 'Experiment', exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
}

test('tunneling: a launched electron partly gets through and the run finishes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/tunneling');
  await predict(page);
  await page.getByRole('button', { name: 'Launch electron', exact: true }).click();
  await expect(page.getByTestId('status')).toHaveText('finished', { timeout: 30_000 });
  const through = parseFloat((await page.getByTestId('through').textContent())!);
  expect(through).toBeGreaterThan(5);
  expect(through).toBeLessThan(40);
  await page.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(page.locator('.hotspot')).toHaveCount(4);
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('tunneling: on-stage knobs work from the keyboard', async ({ page }) => {
  await page.goto('/tunneling');
  await predict(page);
  const height = page.getByRole('slider', { name: /wall height \(drag/i });
  await height.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('slider', { name: 'Wall height', exact: true })).toHaveValue('7.1');
  const energy = page.getByRole('slider', { name: /electron energy \(drag/i });
  await energy.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('slider', { name: 'Electron energy', exact: true })).toHaveValue('4.9');
});

test('tunneling: no horizontal scroll and no accessibility violations', async ({ page }) => {
  await page.goto('/tunneling');
  await predict(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
  for (const step of ['Experiment', 'Explain', 'Go deeper']) {
    await page.getByRole('button', { name: step, exact: true }).click();
    const results = await new AxeBuilder({ page }).exclude('.katex').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  }
});
