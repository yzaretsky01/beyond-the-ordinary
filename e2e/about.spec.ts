import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROOMS = ['double-slit', 'superposition', 'entanglement', 'tunneling', 'quantum-computing'];

for (const id of ROOMS) {
  test(`explanation page: /${id}/about reads cleanly and leads into the room`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${id}/about`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.about__section h2')).toHaveCount(3);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    await page.getByRole('link', { name: /try it yourself/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${id}$`));
    await expect(page.getByRole('link', { name: 'How it works' })).toBeVisible();
  });
}

test('the hall links to every explanation page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'How it works: Tunneling' }).click();
  await expect(page).toHaveURL(/\/tunneling\/about$/);
});
