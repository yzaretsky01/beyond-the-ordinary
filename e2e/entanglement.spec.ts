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

test('entanglement: journey, Bell test beats the classical limit', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/entanglement');
  await predict(page);
  await page.getByRole('button', { name: 'Fire one pair', exact: true }).click();
  await expect(page.getByTestId('pairs')).toHaveText('1');
  await page.getByRole('radio', { name: 'Bell test' }).check();
  await page.getByRole('slider', { name: 'Bob’s polariser', exact: true }).fill('22');
  await page.getByRole('slider', { name: 'Pairs per second', exact: true }).fill('300');
  await page.getByRole('button', { name: 'Fire continuously', exact: true }).click();
  await expect
    .poll(async () => Number(await page.getByTestId('pairs').textContent()), { timeout: 20_000 })
    .toBeGreaterThan(400);
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  const s = Number((await page.getByTestId('s').textContent())!.split(' ')[0]);
  expect(s).toBeGreaterThan(2.2);
  await page.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(page.locator('.hotspot')).toHaveCount(4);
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('entanglement: dials work from the keyboard', async ({ page }) => {
  await page.goto('/entanglement');
  await predict(page);
  const dial = page.getByRole('slider', { name: /alice’s polariser \(drag/i });
  await dial.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('slider', { name: 'Alice’s polariser', exact: true })).toHaveValue('1');
});

test('entanglement: no horizontal scroll and no accessibility violations', async ({ page }) => {
  // scan the settled page: with reduced motion the panel fade is instant, so colours are final
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/entanglement');
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
