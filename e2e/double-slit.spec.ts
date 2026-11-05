import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function predict(page: Page) {
  await page.getByRole('button', { name: 'Make a prediction', exact: true }).click();
  await page.getByRole('radio', { name: 'Two bright bands' }).check();
  await page.getByRole('button', { name: /lock in my prediction/i }).click();
  await expect(page.getByRole('button', { name: 'Experiment' })).toHaveAttribute('aria-current', 'step');
}

test('hall links to the double slit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /double slit/i }).click();
  await expect(page.getByRole('heading', { name: /can one photon go through two slits/i })).toBeVisible();
});

test('full journey through all five steps with photons landing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/double-slit');
  await predict(page);
  await page.getByRole('button', { name: 'Fire one photon', exact: true }).click();
  await expect(page.getByTestId('arrivals')).toHaveText('1');
  await page.getByRole('button', { name: 'Fire continuously', exact: true }).click();
  await expect
    .poll(async () => Number((await page.getByTestId('arrivals').textContent())!.replace(/,/g, '')))
    .toBeGreaterThan(50);
  await page.getByRole('button', { name: 'Stop' }).click();
  // a discovery should have appeared
  await expect(page.getByRole('status').filter({ hasText: /discovery/i })).toBeVisible();
  await page.getByRole('button', { name: 'Explain' }).click();
  await expect(page.locator('.hotspot')).toHaveCount(4);
  await page.locator('.hotspot button').first().click();
  await expect(page.getByRole('note')).toBeVisible();
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.katex').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('on-stage handles work from the keyboard and change the simulation', async ({ page }) => {
  await page.goto('/double-slit');
  await predict(page);
  const sep = page.getByRole('slider', { name: /slit separation \(drag/i });
  await sep.focus();
  await page.keyboard.press('ArrowUp');
  await expect(sep).toHaveAttribute('aria-valuenow', '0.26');
  await expect(page.getByRole('slider', { name: 'Slit separation', exact: true })).toHaveValue('0.26');
  const dist = page.getByRole('slider', { name: /screen distance \(drag/i });
  await dist.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Screen distance', exact: true })).toHaveValue('1.55');
  await page.getByRole('button', { name: /top slit: open/i }).click();
  await expect(page.getByRole('radio', { name: 'Bottom only' })).toBeChecked();
  await page.getByRole('button', { name: /detector off/i }).click();
  await expect(page.getByRole('switch', { name: /which-slit detector/i })).toBeChecked();
});

test('stage handles respond to dragging', async ({ page }) => {
  await page.goto('/double-slit');
  await predict(page);
  const screenKnob = page.getByRole('slider', { name: /screen distance \(drag/i });
  await screenKnob.scrollIntoViewIfNeeded();
  const box = (await screenKnob.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 120, box.y + box.height / 2, { steps: 5 });
  await page.mouse.up();
  const v = Number(await page.getByRole('slider', { name: 'Screen distance', exact: true }).inputValue());
  expect(v).toBeLessThan(1.5);
});

test('no horizontal page scroll and no accessibility violations', async ({ page }) => {
  // scan the settled page: with reduced motion the panel fade is instant, so colours are final
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/double-slit');
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
  await page.goto('/');
  const hall = await new AxeBuilder({ page }).analyze();
  expect(hall.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
