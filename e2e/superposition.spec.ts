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

test('superposition: full journey, photons follow the model', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/superposition');
  await predict(page);
  for (let i = 0; i < 20; i++)
    await page.getByRole('button', { name: 'Fire one photon', exact: true }).click();
  await expect(page.getByTestId('d1')).toHaveText('20'); // even split, no phase: all to D1
  await expect(page.getByTestId('d2')).toHaveText('0');
  await page.getByRole('slider', { name: 'Phase shift φ', exact: true }).fill('180');
  for (let i = 0; i < 20; i++)
    await page.getByRole('button', { name: 'Fire one photon', exact: true }).click();
  await expect(page.getByTestId('d2')).toHaveText('20'); // half a wave: all to D2
  await page.getByRole('button', { name: 'Explain', exact: true }).click();
  await expect(page.locator('.hotspot')).toHaveCount(4);
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('superposition: on-stage handles work from the keyboard', async ({ page }) => {
  await page.goto('/superposition');
  await predict(page);
  const phase = page.getByRole('slider', { name: /phase shift \(drag/i });
  await phase.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Phase shift φ', exact: true })).toHaveValue('1');
  const split = page.getByRole('slider', { name: /first splitter \(drag/i });
  await split.focus();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('slider', { name: 'First splitter', exact: true })).toHaveValue('91');
  await page.getByRole('button', { name: 'Remove splitter 2' }).click();
  await expect(page.getByRole('switch', { name: /second splitter in place/i })).not.toBeChecked();
});

test('superposition: no horizontal scroll and no accessibility violations', async ({ page }) => {
  // scan the settled page: with reduced motion the panel fade is instant, so colours are final
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/superposition');
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
