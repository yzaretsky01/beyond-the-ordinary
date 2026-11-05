import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function predict(page: Page) {
  await page.getByRole('button', { name: 'Make a prediction', exact: true }).click();
  await page.getByRole('radio', { name: 'Always 0' }).check();
  await page.getByRole('button', { name: /lock in my prediction/i }).click();
  await expect(page.getByRole('button', { name: 'Experiment', exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
}

test('quantum computing: build a Bell pair by hand and measure it', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/quantum-computing');
  await predict(page);
  await page.getByRole('button', { name: 'Clear circuit' }).click();
  await page.getByRole('radio', { name: '2' }).check();
  await page.getByRole('button', { name: 'H', exact: true }).click();
  await page.getByRole('button', { name: /qubit 0, step 1: empty/i }).click();
  await page.getByRole('button', { name: 'CNOT', exact: true }).click();
  await page.getByRole('button', { name: /qubit 0, step 2: empty/i }).click();
  await expect(page.getByRole('img', { name: /\|11⟩: probability 50 percent/ })).toBeVisible();
  await page.getByRole('button', { name: 'Measure 100 times' }).click();
  await expect(page.getByTestId('shots')).toHaveText('100');
  await page.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(page.locator('.qc-hotspot')).not.toHaveCount(0);
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('quantum computing: Grover preset always finds 11', async ({ page }) => {
  await page.goto('/quantum-computing');
  await predict(page);
  await page.getByRole('button', { name: 'Grover’s search for 11' }).click();
  await page.getByRole('button', { name: 'Measure 100 times' }).click();
  await expect(page.getByTestId('last')).toHaveText('|11⟩');
});

test('quantum computing: no horizontal page scroll and no accessibility violations', async ({ page }) => {
  // scan the settled page: with reduced motion the panel fade is instant, so colours are final
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/quantum-computing');
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
