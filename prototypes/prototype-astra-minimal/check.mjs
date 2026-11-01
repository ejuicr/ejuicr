import assert from "node:assert/strict";
import { firefox } from "@playwright/test";

const base = "http://127.0.0.1:4178/prototype-astra-minimal/";
const browser = await firefox.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`${base}views.html`);
  const views = await page.locator("[data-view]").evaluateAll(elements => elements.map(element => element.id));
  assert.equal(views.length, 15);
  const ids = await page.locator("[id]").evaluateAll(elements => elements.map(element => element.id));
  assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
  const hashes = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.hash.slice(1)));
  assert(hashes.every(hash => ids.includes(hash)), "Local links must resolve");

  for (const width of [320, 390, 850, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of views) {
      await page.goto(`${base}views.html#${view}`);
      await page.waitForFunction(id => !document.getElementById(id).hidden, view);
      assert.equal(await page.locator("[data-view]:visible").count(), 1);
      assert.equal(await page.locator("h1:visible").count(), 1);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${view} overflows at ${width}`);
      assert.equal(await page.locator("button:not(:disabled), select:not(:disabled), input:not([readonly]):not(:disabled)").count(), 0);
      for (const summary of await page.locator("[data-view]:visible summary").all()) {
        await summary.click();
        assert(await summary.evaluate(element => element.parentElement.open));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Disclosure overflows: ${view}/${width}`);
        await summary.click();
      }
    }
    await page.goto(`${base}index.html`);
    assert.equal(await page.locator(".step, .section-note, .intro").count(), 0);
    assert(await page.getByText("Save your recipe for next time.", { exact: true }).isVisible());
    assert(await page.getByRole("heading", { name: "One to keep?", exact: true }).isVisible());
    assert.equal(await page.locator(".primary").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(139, 233, 253)");
    await page.goto(`${base}index.html#recipe`);
    assert(await page.locator("#recipe-heading").isVisible());
    assert.equal(await page.locator("#save-button").textContent(), "Save changes");
    console.log(`PASS ${width}px: all views, fixed controls, disclosures, calculator copy`);
  }

  await page.goto(`${base}views.html#recipes`);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.waitForFunction(() => !document.getElementById("settings").hidden);
  assert.equal(await page.locator('a[aria-current="page"]').textContent(), "Settings");
  assert.equal(await page.evaluate(() => document.activeElement.id), "settings-title");
  await page.goBack();
  await page.waitForFunction(() => !document.getElementById("recipes").hidden);
  await page.goto(`${base}views.html#unknown`);
  assert(await page.locator("#not-found").isVisible());
  assert.deepEqual(errors, []);
  console.log("PASS navigation history, active links, focus, unknown route, no script errors");
} finally {
  await browser.close();
}
