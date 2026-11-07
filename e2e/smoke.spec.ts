import { expect, test } from "@playwright/test";

test.describe("calculator", () => {
  test("recalculates and persists an input-only draft", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("targetAmountInput")).toHaveValue("30");
    await page.getByTestId("targetAmountInput").fill("45");

    // 6 mg/mL * 45 mL / 100 mg/mL = 2.7 mL of nicotine.
    await expect(page.getByRole("row", { name: /^Nicotine/ })).toContainText("2.7mL");
    await page.reload();
    await expect(page.getByTestId("targetAmountInput")).toHaveValue("45");

    const draft = await page.evaluate(
      () => JSON.parse(localStorage.getItem("calculator") ?? "null") as {
        version?: number;
        flavors?: Array<Record<string, unknown>>;
      },
    );
    expect(draft.version).toBe(2);
    expect(draft.flavors?.[0]).not.toHaveProperty("amount");
  });

  test("sizes icons on first paint and does not inject Font Awesome CSS after hydration", async ({ page }) => {
    // Keep the server-rendered HTML but stop client chunks so no Font Awesome
    // runtime CSS can arrive; this is the state seen while reloading.
    let blockClientJs = true;
    await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, (route) =>
      blockClientJs ? route.abort() : route.continue(),
    );

    await page.goto("/");
    const addFlavor = page.getByTestId("flavorAddBtn");
    await expect(addFlavor).toBeVisible();
    expect((await addFlavor.locator("svg").boundingBox())!.height).toBeLessThan(20);
    expect((await addFlavor.boundingBox())!.height).toBeLessThan(60);

    blockClientJs = false;
    await page.reload();
    // The draft write proves hydration completed.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("calculator") !== null))
      .toBe(true);
    expect(
      await page.evaluate(
        () => [...document.head.querySelectorAll("style")].filter(
          (style) => style.textContent?.includes(".svg-inline--fa"),
        ).length,
      ),
    ).toBe(0);
  });

  test("clamps flavor percentages and blocks saving an impossible mix", async ({ page }) => {
    await page.goto("/");
    const percent = page.getByTestId("flavor1PercentInput");
    await percent.fill("150");
    await expect(percent).toHaveValue("100");
    await expect(page.getByTestId("errorMessage")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeDisabled();
  });

  test("edits carriers and adds and removes flavors", async ({ page }) => {
    await page.goto("/");
    const nicotine = page.getByTestId("nicConfigBtn");
    await nicotine.click();
    await expect(nicotine).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("spinbutton", { name: "Undiluted nicotine base PG" }).fill("50");
    await expect(page.getByRole("spinbutton", { name: "Undiluted nicotine base VG" })).toHaveValue("50");
    await page.getByTestId("flavor1ConfigBtn").click();
    await page.getByTestId("flavor1ConfigPgInput").fill("75.5");
    // Preserve the existing controller's whole-percentage carrier rounding.
    await expect(page.getByTestId("flavor1ConfigPgInput")).toHaveValue("76");
    await expect(page.getByTestId("flavor1ConfigVgInput")).toHaveValue("24");
    await page.getByRole("button", { name: "Add flavor", exact: true }).click();
    await expect(page.getByTestId("flavor2NameInput")).toBeVisible();
    await page.getByTestId("flavor2DeleteBtn").click();
    await expect(page.getByTestId("flavor2NameInput")).toHaveCount(0);
  });

  test("guest save opens sign-in without losing the active recipe", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("targetAmountInput").fill("45");
    await page.getByRole("textbox", { name: "Recipe name" }).fill("Guest draft");
    const save = page.getByRole("button", { name: "Save", exact: true });
    await save.click();
    await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(save).toBeFocused();
    await expect(page.getByTestId("targetAmountInput")).toHaveValue("45");
    await expect(page.getByRole("textbox", { name: "Recipe name" })).toHaveValue("Guest draft");
  });

  test("signed-in inline save sends the existing recipe shape and animates its toast", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const profilePicture = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="teal"/></svg>')}`;
    // UI-only session/write stubs: no credentials, database access or real writes.
    await page.route("**/api/user/me", (route) => route.fulfill({ json: {
      _id: "smoke-user", email: "smoke@example.com", hasPassword: true,
      hasGoogleLinked: false, hasTwitterLinked: false,
      googlePicture: profilePicture,
    } }));
    await page.route("**/api/settings", (route) => route.fulfill({ json: {} }));
    await page.route("**/api/recipes", async (route) => {
      expect(route.request().method()).toBe("POST");
      const body = route.request().postDataJSON();
      expect(body).toMatchObject({
        name: "Workbench recipe", amount: 45, strength: 6,
        base: { pg: 30, vg: 70 },
        ingredients: { nicotine: { strength: 100, base: { pg: 100, vg: 0 } } },
      });
      expect(body.ingredients.flavors[0]).not.toHaveProperty("amount");
      await route.fulfill({ json: { ...body, _id: "smoke-recipe" } });
    });
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main navigation" });
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      if (width <= 800) {
        await expect(page.locator("#page-header")).toHaveCSS("padding-top", "14px");
        await expect(page.locator("#page-header")).toHaveCSS("padding-bottom", "0px");
      }
      for (const name of ["Calculator", "Recipes", "Settings", "Account"]) {
        await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
      }
      await expect(nav.getByRole("link", { name: "Calculator" })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("link", { name: /sign out/i })).toHaveCount(0);
      const avatar = page.locator(".user-avatar");
      await expect(avatar).toHaveCSS("width", "34px");
      await expect(avatar).toHaveCSS("height", "34px");
      await expect(avatar).toHaveCSS("padding", "2px");
      expect(await avatar.evaluate(element => getComputedStyle(element).backgroundImage)).toContain("linear-gradient");
      await expect(avatar.locator("img")).toHaveAttribute("src", profilePicture);
      await expect(avatar.locator("img")).toHaveCSS("border-radius", "50%");
      await expect(avatar.locator("img")).toHaveCSS("object-fit", "cover");
      await expect.poll(() => avatar.locator("img").evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.getByTestId("targetAmountInput").fill("45");
    await page.getByRole("textbox", { name: "Recipe name" }).fill("Workbench recipe");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator("#toast-root")).toContainText('"Workbench recipe" has been saved');
    const toast = page.locator(".toast");
    const animations = await toast.evaluate((element) => element.getAnimations().map((animation) => ({
      name: (animation as CSSAnimation).animationName,
      keyframes: (animation.effect as KeyframeEffect | null)?.getKeyframes().map((frame) => Number(frame.opacity)),
    })));
    expect(animations).toEqual([
      { name: "toast-in", keyframes: [0, 1] },
      { name: "toast-out", keyframes: [1, 0] },
    ]);
    const opacity = await toast.evaluate((element) => {
      const effects = element.getAnimations() as CSSAnimation[];
      const entrance = effects.find((effect) => effect.animationName === "toast-in")!;
      const exit = effects.find((effect) => effect.animationName === "toast-out")!;
      entrance.pause();
      entrance.currentTime = 110;
      const entering = Number(getComputedStyle(element).opacity);
      entrance.currentTime = 220;
      exit.pause();
      exit.currentTime = 3690;
      return [entering, Number(getComputedStyle(element).opacity)];
    });
    for (const value of opacity) {
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(toast).toHaveCSS("animation-name", "none");
    await expect(page.getByTestId("targetAmountInput")).toHaveValue("45");
  });
});

test.describe("layout and accessibility", () => {
  test("matches the Workbench responsive layout without overflow or an overlapping header", async ({ page }) => {
    await page.goto("/");
    for (const width of [1440, 1200, 800, 540, 539, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      const metrics = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const header = rect("#page-header"), inputs = rect(".inputs-zone");
        const results = rect(".results-zone"), save = rect(".save-block");
        const amount = rect('[data-testid="targetAmountInput"]');
        const strength = rect('[data-testid="targetNicStrengthInput"]');
        const flavor = [...document.querySelector(".flavor-row")!.children].map(el => el.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          headerPosition: getComputedStyle(document.querySelector("#page-header")!).position,
          headerBottom: header.bottom, inputTop: inputs.top,
          inputsLeft: inputs.left, inputsBottom: inputs.bottom,
          resultsLeft: results.left, resultsBottom: results.bottom,
          saveLeft: save.left, saveTop: save.top,
          amountTop: amount.top, strengthTop: strength.top,
          flavorCenters: flavor.map(box => box.top + box.height / 2),
        };
      });
      expect(metrics.overflow, `${width}px overflow`).toBe(false);
      if (width <= 800) {
        expect(metrics.headerPosition).toBe("static");
        await expect(page.locator("#page-header")).toHaveCSS("padding-top", "14px");
        await expect(page.locator("#page-header")).toHaveCSS("padding-bottom", "14px");
        expect(metrics.headerBottom).toBeLessThanOrEqual(metrics.inputTop);
      } else {
        expect(metrics.headerPosition).toBe("fixed");
      }
      if (width > 1200) {
        expect(metrics.resultsLeft).toBeGreaterThan(metrics.inputsLeft);
        expect(metrics.saveLeft).toBe(metrics.inputsLeft);
        expect(metrics.saveTop).toBeGreaterThanOrEqual(metrics.inputsBottom);
      } else {
        expect(metrics.resultsLeft).toBe(metrics.inputsLeft);
        expect(metrics.saveTop).toBeGreaterThanOrEqual(metrics.resultsBottom);
      }
      if (width >= 540) expect(metrics.amountTop).toBe(metrics.strengthTop);
      else expect(metrics.strengthTop).toBeGreaterThan(metrics.amountTop);
      expect(Math.max(...metrics.flavorCenters) - Math.min(...metrics.flavorCenters)).toBeLessThan(1);
    }
  });

  test("provides a keyboard skip link and visible focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
    await page.keyboard.press("Tab");
    const decrease = page.getByRole("button", { name: "Decrease Amount", exact: true });
    await expect(decrease).toBeFocused();
    await expect(decrease).toHaveCSS("outline-style", "solid");
  });

  test("keeps closed auth inert, traps focus, opens on the email form and restores focus on Escape", async ({ page }) => {
    await page.goto("/");
    const drawer = page.locator('[role="dialog"][aria-label="Sign in"]');
    await expect(drawer).toHaveAttribute("inert", "");
    const signIn = page.getByRole("button", { name: "Sign in", exact: true });
    await signIn.click();
    await expect(drawer).not.toHaveAttribute("inert", "");
    const close = drawer.getByRole("button", { name: "Close sign in" });
    await expect(close).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(drawer.getByRole("button", { name: "Sign up" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(close).toBeFocused();
    await expect(drawer.getByLabel("Email", { exact: true })).toBeVisible();
    await expect(drawer.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      drawer.getByRole("button", { name: "Sign in with email" }),
    ).toHaveCount(0);
    const signInProviderHrefs = await drawer
      .locator(".provider-buttons a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    await drawer.getByRole("button", { name: "Sign up" }).click();
    await expect(
      drawer.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();
    const signupProviders = drawer.locator(".provider-buttons a");
    await expect(signupProviders).toHaveCount(signInProviderHrefs.length);
    expect(
      await signupProviders.evaluateAll((links) =>
        links.map((link) => link.getAttribute("href")),
      ),
    ).toEqual(signInProviderHrefs);
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveAttribute("inert", "");
    await expect(signIn).toBeFocused();
  });

  test("retains informational page copy, links and list semantics in the new shell", async ({ page }) => {
    for (const [path, heading, excerpt] of [
      ["/about", "About ejuicr", "The goal of ejuicr is to a vaper's fist choice for a convenient and easy-to-use ejuice calculator."],
      ["/help", "Help", "We appreciate any feedback you'd like to share!"],
      ["/contribute", "Contribute", "Feel free to submit pull request if you'd like to contribute to the codebase."],
    ]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole("main")).toContainText(excerpt);
      await expect(page.getByRole("contentinfo").getByRole("link", { name: "Help", exact: true })).toBeVisible();
    }
    await page.goto("/privacy-policy");
    await expect(page.locator("ol").first()).toHaveCSS("list-style-type", "decimal");
  });
});

test.describe("workspace pages", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/user/me", (route) => route.fulfill({ json: {
      _id: "smoke-user", email: "smoke@example.com", hasPassword: true,
      hasGoogleLinked: false, hasTwitterLinked: false,
    } }));
  });

  test("saves calculator defaults and uses them on returning to the calculator", async ({ page }) => {
    let settings = {
      theme: "dark", units: "both", amount: 30, strength: 6,
      base: { pg: 30, vg: 70 }, zeroNicotineMode: false,
      nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
      flavor: { percentage: 5, base: { pg: 100, vg: 0 } },
    };
    await page.route("**/api/settings", async (route) => {
      if (route.request().method() === "POST") settings = route.request().postDataJSON();
      await route.fulfill({ json: settings });
    });
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Calculator Defaults", exact: true })).toBeVisible();
    expect(await page.getByRole("heading", { name: "Calculator Defaults", exact: true }).evaluate(element => getComputedStyle(element).fontFamily)).toContain("Bebas");
    await expect(page.getByRole("heading", { name: "Batch", exact: true })).toBeVisible();
    for (const width of [1440, 800, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await expect(page.getByRole("spinbutton", { name: "Amount", exact: true })).toBeVisible();
    }
    await page.getByRole("spinbutton", { name: "Amount", exact: true }).fill("90");
    await page.getByRole("combobox", { name: "Mixing units" }).selectOption("volume");
    await page.getByRole("button", { name: "Save settings", exact: true }).click();
    await expect(page.locator("#toast-root")).toContainText("Settings saved.");
    expect(settings.amount).toBe(90);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Calculator", exact: true }).click();
    await expect(page.getByTestId("targetAmountInput")).toHaveValue("90");
    await expect(page.getByRole("row", { name: /^Nicotine/ }).getByRole("cell")).toHaveCount(2);
  });

  test("sorts, links to, and confirms deletion of saved recipes", async ({ page }) => {
    let recipes = [
      { _id: "zest", name: "Zest", updatedAt: "2026-11-02T00:00:00Z" },
      { _id: "alpha", name: "Alpha", updatedAt: "2026-11-01T00:00:00Z" },
    ];
    await page.route("**/api/recipes", (route) => route.fulfill({ json: recipes }));
    await page.route("**/api/recipes/zest", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      recipes = recipes.filter((recipe) => recipe._id !== "zest");
      await route.fulfill({ status: 204 });
    });
    await page.goto("/recipes");
    await expect(page.locator(".recipe-title").first()).toHaveText("Zest");
    await page.getByRole("combobox", { name: "Sort recipes" }).selectOption("title");
    await expect(page.locator(".recipe-title").first()).toHaveText("Alpha");
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    const remove = page.getByRole("button", { name: "Delete Zest", exact: true });
    await remove.click();
    await expect(page.getByRole("dialog", { name: /Delete.*Zest/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(remove).toBeFocused();
    await remove.click();
    await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByRole("button", { name: "Delete Zest", exact: true })).toHaveCount(0);
    await expect(page.locator("#toast-root")).toContainText("Recipe deleted.");
    await expect(page.getByRole("link", { name: /Alpha Updated/ })).toHaveAttribute("href", "/recipes/alpha");
  });

  test("offers retry for a failed recipe request and handles an empty list", async ({ page }) => {
    let attempts = 0;
    await page.route("**/api/recipes", (route) => {
      attempts++;
      return attempts === 1
        ? route.fulfill({ status: 503, json: { message: "Temporarily unavailable" } })
        : route.fulfill({ json: [] });
    });
    await page.goto("/recipes");
    await expect(page.getByText("Temporarily unavailable", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No saved recipes", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open calculator", exact: true })).toHaveAttribute("href", "/");
  });

  test("protects provider-only accounts, sets a password, and keeps failed deletion recoverable", async ({ page }) => {
    const user = {
      _id: "smoke-user", email: "smoke@example.com", hasPassword: false,
      hasGoogleLinked: true, hasTwitterLinked: false,
    };
    await page.route("**/api/user/me", (route) => route.fulfill({ json: user }));
    await page.route("**/api/recipes?count=1", (route) => route.fulfill({ json: { count: 2 } }));
    await page.route("**/api/user/set-password", async (route) => {
      expect(route.request().postDataJSON()).toEqual({ password: "new-password" });
      user.hasPassword = true;
      await route.fulfill({ json: { message: "Password set." } });
    });
    await page.route("**/api/user/google", async (route) => {
      expect(route.request().method()).toBe("DELETE");
      user.hasGoogleLinked = false;
      await route.fulfill({ status: 204 });
    });
    await page.route("**/api/user", (route) => route.fulfill({ status: 503, json: { message: "Please retry deletion." } }));
    await page.goto("/myaccount");
    await expect(page.getByRole("button", { name: "Set Password", exact: true })).toBeVisible();
    for (const width of [1440, 800, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    const deleteButton = page.locator(".delete-section").getByRole("button", { name: "Delete Account", exact: true });
    const border = await deleteButton.evaluate(element => getComputedStyle(element).borderTopColor);
    await expect(page.locator(".delete-section")).toHaveCSS("border-top-color", border);
    await expect(page.getByRole("button", { name: "Set Password", exact: true })).toHaveCSS("border-left-width", "0px");
    await page.getByRole("button", { name: "Unlink", exact: true }).click();
    const protection = page.getByRole("dialog", { name: "Set a password first" });
    await expect(protection).toBeVisible();
    await expect(protection.getByRole("button")).toHaveCount(1);
    await protection.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByLabel("New password", { exact: true }).fill("new-password");
    await page.getByLabel("Confirm new password", { exact: true }).fill("new-password");
    await page.getByRole("button", { name: "Set Password", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Change Password", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Unlink", exact: true }).click();
    await page.getByRole("dialog", { name: "Unlink Google?" }).getByRole("button", { name: "Unlink", exact: true }).click();
    await expect(page.getByRole("button", { name: "Unlink", exact: true })).toHaveCount(0);
    await deleteButton.click();
    await page.getByRole("dialog", { name: "Delete your account?" }).getByRole("button", { name: "Delete Account", exact: true }).click();
    await expect(page.locator(".account-details").getByRole("alert")).toContainText("Please retry deletion.");
    await expect(deleteButton).toBeEnabled();
  });
});

test.describe("authentication states", () => {
  test("shows a provider failure as an error toast and clears the error parameter", async ({ page }) => {
    await page.goto("/?authError=google-email-unverified&keep=1#main");
    const toast = page.locator("#toast-root .toast.error");
    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText("Google has not verified that email address");
    await expect(page).not.toHaveURL(/authError=/);
    await expect(page).toHaveURL(/\?keep=1#main$/);
  });

  test("requests a reset with generic confirmation and recovers from an expired link", async ({ page }) => {
    await page.route("**/api/user/reset-password", (route) => route.fulfill({ json: { message: "Check your email." } }));
    await page.route("**/api/user/reset-password/expired-test-token", (route) => route.fulfill({ status: 400, json: { message: "Reset token is invalid or already been used." } }));
    await page.goto("/update-password/expired-test-token");
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    }
    await page.getByLabel("New password", { exact: true }).fill("new-password");
    await page.getByLabel("Confirm new password", { exact: true }).fill("new-password");
    await page.getByRole("button", { name: "Update password", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Reset link expired", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Request a new link", exact: true }).click();
    await page.locator(".auth-panel").getByLabel("Email", { exact: true }).fill("unknown@example.test");
    await page.getByRole("button", { name: "Send reset link", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Check your email", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Return to sign in", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Sign in" })).toBeVisible();
  });
});
