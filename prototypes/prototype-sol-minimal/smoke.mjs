import assert from "node:assert/strict";
import { firefox } from "@playwright/test";

// Start the static server from README.md first. No application or database needed.
const browser = await firefox.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("http://localhost:3200");
    for (const name of ["My recipes", "About", "Calculator"]) {
      await page.getByRole("navigation").getByRole("link", { name }).click();
      assert.equal(await page.locator("[data-view]:visible").count(), 1);
      assert.equal(await page.getByRole("navigation").locator('[aria-current="page"]').textContent(), name);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} overflows at ${width}px`);
    }
    assert.equal(await page.locator("input:not([readonly])").count(), 0);
    assert.equal(await page.locator("button:not([disabled])").count(), 0);
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/ejuicr-sol-${width}.png`, fullPage: true });
    }
  }
  await page.goto("http://localhost:3200/#unknown");
  assert.equal(await page.locator('[data-view="calculator"]').isVisible(), true);
  assert.deepEqual(errors, []);
  console.log("Prototype smoke passed: navigation, read-only controls, and layouts at 1440, 768, 390, and 320px.");
} finally {
  await browser.close();
}
