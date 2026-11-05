import { expect, test, type Page } from '@playwright/test';

/**
 * Keyboard-only journeys: every room can be completed with Tab, Shift+Tab, Enter and Space alone,
 * from Wonder through a locked prediction to Explain (including a "Wait, why?") and Go deeper.
 */

async function focusedName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    // the body or a whole panel is not a control: never match on its full text
    if (!el || el === document.body || el.tabIndex < 0) return '';
    const label = el.getAttribute('aria-label');
    if (label) return label;
    if (el instanceof HTMLInputElement && el.labels?.length) return el.labels[0].textContent ?? '';
    return (el.textContent ?? '').trim();
  });
}

/** Press Tab (or Shift+Tab) until the focused element's name matches. */
async function tabTo(page: Page, name: RegExp, backwards = false, max = 250) {
  for (let i = 0; i < max; i++) {
    if (name.test(await focusedName(page))) return;
    await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
  }
  throw new Error(`could not reach ${name} with the keyboard`);
}

// radio groups take one Tab stop; arrow keys move between options, as for any keyboard user
const ROOMS: { path: string; choose?: { first: RegExp; arrows: number } }[] = [
  { path: '/double-slit', choose: { first: /one bright band/i, arrows: 1 } },
  { path: '/superposition' },
  { path: '/entanglement' },
  { path: '/tunneling' },
  { path: '/quantum-computing', choose: { first: /always 0/i, arrows: 0 } },
];

for (const room of ROOMS) {
  test(`keyboard only: ${room.path}`, async ({ page }) => {
    await page.goto(room.path);
    await tabTo(page, /^make a prediction/i);
    await page.keyboard.press('Enter');
    if (room.choose) {
      await tabTo(page, room.choose.first);
      for (let i = 0; i < room.choose.arrows; i++) await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');
    }
    await tabTo(page, /lock in my prediction/i);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Experiment', exact: true })).toHaveAttribute(
      'aria-current',
      'step',
    );

    // back up to the step rail and open Explain
    await tabTo(page, /^explain$/i, true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Explain', exact: true })).toHaveAttribute(
      'aria-current',
      'step',
    );

    // every equation on the page (including the closed math teaser) must render without a KaTeX error
    await expect(page.locator('.katex-error')).toHaveCount(0);

    // open the first "Wait, why?" answer
    await tabTo(page, /^wait, /i);
    await page.keyboard.press('Enter');
    await expect(page.locator('details[open] .ww__body').first()).toBeVisible();

    // and reach the full mathematics
    await tabTo(page, /^see all the math/i);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Go deeper', exact: true })).toHaveAttribute(
      'aria-current',
      'step',
    );
    await expect(page.locator('.katex').first()).toBeVisible();
    await expect(page.locator('.katex-error')).toHaveCount(0);
  });
}
