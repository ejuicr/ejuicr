/*
 * ejuicr UI prototype — throwaway code.
 *
 * One in-memory app, three design directions, switchable with ?variant=A|B|C.
 * No backend, no persistence. Calculator maths mirror src/lib/calculator.ts so
 * the designs are judged against real numbers.
 */

(() => {
  "use strict";

  const VARIANTS = {
    A: { name: "Ledger" },
    B: { name: "Instrument" },
    C: { name: "Mix card" },
  };
  const VARIANT_KEYS = Object.keys(VARIANTS);
  const PAGES = [
    "home",
    "recipes",
    "settings",
    "account",
    "about",
    "help",
    "contribute",
    "terms",
    "privacy",
    "signin",
    "signup",
    "reset",
  ];
  const AUTH_PAGES = ["signin", "signup", "reset"];
  const PROTECTED_PAGES = ["recipes", "settings", "account"];
  const TODAY = new Date().toISOString().slice(0, 10);

  /* ------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------ */

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      switch (char) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return char;
      }
    });
  }

  const escAttr = esc;

  function icon(name, className = "") {
    return `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function num(value) {
    const parsed = typeof value === "number" ? value : parseFloat(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  function round2(value) {
    if (!Number.isFinite(value)) return value;
    if (Math.abs(value) >= Number.MAX_SAFE_INTEGER) return value;
    const exponential = Number(`${value}e+2`);
    if (Number.isFinite(exponential)) {
      return Number(`${Math.round(exponential)}e-2`);
    }
    const rounded = Math.round(value * 100) / 100;
    return rounded === 0 ? 0 : rounded;
  }

  function fmt(value) {
    const rounded = round2(value);
    if (rounded === 0 && value > 0) return "<0.01";
    return String(rounded);
  }

  function pct(value) {
    return `${round2(value)}%`;
  }

  function clampInt(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.min(100, Math.round(n));
  }

  function normalized(pg, vg) {
    return (
      Number.isFinite(pg) &&
      Number.isFinite(vg) &&
      pg >= 0 &&
      pg <= 100 &&
      vg >= 0 &&
      vg <= 100 &&
      Math.abs(pg + vg - 100) <= 0.01
    );
  }

  function invalidResult(percentage, volume, weight) {
    return (
      !Number.isFinite(percentage) ||
      !Number.isFinite(volume) ||
      !Number.isFinite(weight) ||
      percentage < 0 ||
      volume < 0 ||
      weight < 0
    );
  }

  function weightOf(volume, pgPercentage, vgPercentage) {
    return (
      (pgPercentage / 100) * volume * 1.036 +
      (vgPercentage / 100) * volume * 1.26
    );
  }

  function sum(list, key) {
    return list.reduce((total, item) => total + item[key], 0);
  }

  function formatDate(iso) {
    if (!iso) return "No date";
    const date = new Date(`${String(iso).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(iso).slice(0, 10);
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function initials(name) {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "EJ";
    return parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }

  function normalizeVariant(value) {
    const key = String(value || "").toUpperCase();
    return VARIANT_KEYS.includes(key) ? key : "A";
  }

  function selected(value, current) {
    return value === current ? "selected" : "";
  }

  function unitsLabel() {
    if (state.settings.units === "volume") return "Volume";
    if (state.settings.units === "weight") return "Weight";
    return "Both";
  }

  function showVolume() {
    return state.settings.units !== "weight";
  }

  function showWeight() {
    return state.settings.units !== "volume";
  }

  /* ------------------------------------------------------------
     Seed data + state
     ------------------------------------------------------------ */

  const guestSettings = {
    theme: "dark",
    units: "both",
    base: { pg: 30, vg: 70 },
    strength: 6,
    amount: 30,
    zeroNicotineMode: false,
    nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
    flavor: { percentage: 5, base: { pg: 100, vg: 0 } },
  };

  function makeUser(provider = "google", overrides = {}) {
    const base = {
      _id: "u_jim",
      email: "jim@ejuicr.example",
      authProvider: provider,
      googleDisplayName: "Jim Farrugia",
      googlePicture: null,
      twitterHandle: "jimfarrugia",
      twitterDisplayName: "Jim Farrugia",
      twitterPicture: null,
      hasPassword: false,
      hasGoogleLinked: provider === "google",
      hasTwitterLinked: provider === "twitter",
    };
    return { ...base, ...overrides };
  }

  const seedRecipes = [
    {
      _id: "r_01",
      name: "Strawberry Custard",
      author: "u_jim",
      strength: 6,
      base: { pg: 30, vg: 70 },
      amount: 60,
      ingredients: {
        nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
        flavors: [
          { name: "Strawberry", percentage: 8, base: { pg: 100, vg: 0 } },
          { name: "Vanilla Custard", percentage: 6, base: { pg: 50, vg: 50 } },
        ],
      },
      updatedAt: "2026-10-29",
    },
    {
      _id: "r_02",
      name: "Menthol Ice",
      author: "u_jim",
      strength: 3,
      base: { pg: 50, vg: 50 },
      amount: 30,
      ingredients: {
        nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
        flavors: [
          { name: "Menthol", percentage: 4, base: { pg: 100, vg: 0 } },
          { name: "Koolada", percentage: 1.5, base: { pg: 100, vg: 0 } },
        ],
      },
      updatedAt: "2026-10-21",
    },
    {
      _id: "r_03",
      name: "Mango Colada",
      author: "u_jim",
      strength: 0,
      base: { pg: 40, vg: 60 },
      amount: 50,
      ingredients: {
        nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
        flavors: [
          { name: "Mango", percentage: 7, base: { pg: 50, vg: 50 } },
          { name: "Coconut", percentage: 3, base: { pg: 100, vg: 0 } },
          { name: "Pineapple", percentage: 2, base: { pg: 100, vg: 0 } },
        ],
      },
      updatedAt: "2026-09-30",
    },
    {
      _id: "r_04",
      name: "Tobacco Reserve",
      author: "u_jim",
      strength: 12,
      base: { pg: 70, vg: 30 },
      amount: 30,
      ingredients: {
        nicotine: { strength: 100, base: { pg: 100, vg: 0 } },
        flavors: [
          { name: "RY4", percentage: 10, base: { pg: 50, vg: 50 } },
          { name: "Acetyl Pyrazine", percentage: 0.5, base: { pg: 100, vg: 0 } },
        ],
      },
      updatedAt: "2026-08-14",
    },
  ];

  function calcFromSettings(settings) {
    return {
      pg: String(settings.base.pg),
      vg: String(settings.base.vg),
      strength: String(settings.zeroNicotineMode ? 0 : settings.strength),
      amount: String(settings.amount),
      nic: {
        strength: String(settings.nicotine.strength),
        pg: String(settings.nicotine.base.pg),
        vg: String(settings.nicotine.base.vg),
      },
      flavors: [
        {
          name: "Flavor 1",
          pct: String(settings.flavor.percentage),
          pg: String(settings.flavor.base.pg),
          vg: String(settings.flavor.base.vg),
        },
      ],
      title: "",
      editingId: null,
      nicOpen: false,
      flavorOpen: {},
    };
  }

  function calcFromRecipe(recipe) {
    return {
      pg: String(recipe.base.pg),
      vg: String(recipe.base.vg),
      strength: String(recipe.strength),
      amount: String(recipe.amount),
      nic: {
        strength: String(recipe.ingredients.nicotine.strength),
        pg: String(recipe.ingredients.nicotine.base.pg),
        vg: String(recipe.ingredients.nicotine.base.vg),
      },
      flavors: recipe.ingredients.flavors.map((flavor) => ({
        name: flavor.name,
        pct: String(flavor.percentage),
        pg: String(flavor.base.pg),
        vg: String(flavor.base.vg),
      })),
      title: recipe.name,
      editingId: recipe._id,
      nicOpen: false,
      flavorOpen: {},
    };
  }

  function isProtected(page) {
    return PROTECTED_PAGES.includes(page);
  }

  function isAuthPage(page) {
    return AUTH_PAGES.includes(page);
  }

  const params = new URLSearchParams(window.location.search);
  const startSignedOut = params.get("signedout") === "1";
  const requestedPage = params.get("page");
  let initialPage = PAGES.includes(requestedPage) ? requestedPage : "home";
  if (!startSignedOut && isProtected(initialPage)) {
    // signed-in demo still lands on the requested page
  } else if (startSignedOut && isProtected(initialPage)) {
    initialPage = "signin";
  }

  const state = {
    variant: normalizeVariant(params.get("variant")),
    page: initialPage,
    user: startSignedOut ? null : makeUser("google"),
    settings: clone(guestSettings),
    calc: null,
    recipes: clone(seedRecipes),
    sort: "date",
    modal: null,
    showSaveAuth: false,
    authError: "",
    authNotice: "",
    mobileMenu: false,
    returnTo: null,
  };
  state.calc = calcFromSettings(state.settings);

  /* ------------------------------------------------------------
     Calculator maths (mirrors src/lib/calculator.ts)
     ------------------------------------------------------------ */

  function compute() {
    const targetPg = num(state.calc.pg);
    const targetVg = num(state.calc.vg);
    const targetStrength = num(state.calc.strength);
    const targetAmount = num(state.calc.amount);
    const nicStrength = num(state.calc.nic.strength);
    const nicPg = num(state.calc.nic.pg);
    const nicVg = num(state.calc.nic.vg);

    let nic = { amount: 0, percentage: 0, pg: 0, vg: 0, weight: 0 };
    if (
      nicStrength > 0 &&
      nicStrength >= targetStrength &&
      targetAmount > 0
    ) {
      nic.amount = (targetStrength * targetAmount) / nicStrength;
      nic.percentage = (nic.amount / targetAmount) * 100;
      nic.pg = (nicPg / 100) * nic.amount;
      nic.vg = (nicVg / 100) * nic.amount;
      nic.weight = weightOf(nic.amount, nicPg, nicVg);
    }

    const flavors = state.calc.flavors.map((flavor) => {
      const percentage = num(flavor.pct);
      const pg = num(flavor.pg);
      const vg = num(flavor.vg);
      const amount = (percentage / 100) * targetAmount;
      const pgAmount = (pg / 100) * amount;
      const vgAmount = (vg / 100) * amount;
      const weight = weightOf(amount, pg, vg);
      return {
        ...flavor,
        percentage,
        pg,
        vg,
        amount,
        pgAmount,
        vgAmount,
        weight,
        invalid: invalidResult(percentage, amount, weight),
      };
    });

    const flavorPg = sum(flavors, "pgAmount");
    const flavorVg = sum(flavors, "vgAmount");
    const pgRequired = (targetPg / 100) * targetAmount - nic.pg - flavorPg;
    const vgRequired = (targetVg / 100) * targetAmount - nic.vg - flavorVg;

    const pgPercentage =
      targetAmount > 0 ? round2((pgRequired / targetAmount) * 100) : 0;
    const vgPercentage =
      targetAmount > 0 ? round2((vgRequired / targetAmount) * 100) : 0;
    const pgWeight = round2(pgRequired * 1.036);
    const vgWeight = round2(vgRequired * 1.26);

    const targetRatioInvalid = !normalized(targetPg, targetVg);
    const nicRatioInvalid = !normalized(nicPg, nicVg);
    const flavorRatioInvalid = state.calc.flavors.some(
      (flavor) => !normalized(num(flavor.pg), num(flavor.vg)),
    );

    const nicInvalid =
      nicRatioInvalid || invalidResult(nic.percentage, nic.amount, nic.weight);
    const pgInvalid =
      targetRatioInvalid || invalidResult(pgPercentage, pgRequired, pgWeight);
    const vgInvalid =
      targetRatioInvalid || invalidResult(vgPercentage, vgRequired, vgWeight);

    const error =
      nicInvalid || pgInvalid || vgInvalid || flavorRatioInvalid
        ? "The formula is not possible with the current values you have entered."
        : nicStrength < targetStrength
          ? `Your desired strength of ${targetStrength}mg is not possible with this nicotine base. You will need to use a nicotine base liquid with a higher strength.`
          : "";

    const flavorTotalPct = state.calc.flavors.reduce(
      (total, flavor) => total + num(flavor.pct),
      0,
    );

    return {
      targetPg,
      targetVg,
      targetStrength,
      targetAmount,
      nicStrength,
      nicPg,
      nicVg,
      nic,
      nicPct: round2(nic.percentage),
      flavors,
      pgRequired,
      vgRequired,
      pgPct: pgPercentage,
      vgPct: vgPercentage,
      pgWeight,
      vgWeight,
      nicInvalid,
      pgInvalid,
      vgInvalid,
      error,
      flavorTotalPct,
      showNic: !state.settings.zeroNicotineMode || targetStrength > 0,
    };
  }

  function stackWidths(c) {
    const values = [
      c.showNic ? Math.max(0, c.nicPct) : 0,
      Math.max(0, c.pgPct),
      Math.max(0, c.vgPct),
      Math.max(0, c.flavorTotalPct),
    ].map((value) => (Number.isFinite(value) ? value : 0));
    const total = values.reduce((a, b) => a + b, 0);
    if (total <= 0) return ["0", "0", "0", "0"];
    return values.map((value) => ((value / total) * 100).toFixed(2));
  }

  /* ------------------------------------------------------------
     URL + navigation helpers
     ------------------------------------------------------------ */

  function pageHref(page) {
    const search = new URLSearchParams(window.location.search);
    search.set("variant", state.variant);
    if (page === "home") search.delete("page");
    else search.set("page", page);
    if (state.user) search.delete("signedout");
    else search.set("signedout", "1");
    return `?${search.toString()}`;
  }

  function syncUrl() {
    const search = new URLSearchParams(window.location.search);
    search.set("variant", state.variant);
    if (state.page === "home") search.delete("page");
    else search.set("page", state.page);
    if (state.user) search.delete("signedout");
    else search.set("signedout", "1");
    const query = search.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }

  function startNewBatch() {
    state.calc = calcFromSettings(state.settings);
  }

  function go(page, options = {}) {
    if (!PAGES.includes(page)) return;
    if (isProtected(page) && !state.user) {
      state.returnTo = page;
      state.page = "signin";
      state.authError = "";
      state.authNotice = "";
      state.mobileMenu = false;
      state.modal = null;
      state.showSaveAuth = false;
      syncUrl();
      render({ top: true });
      return;
    }

    if (
      page === "home" &&
      (Boolean(state.calc.editingId) ||
        !["home", "signin", "signup", "reset"].includes(state.page))
    ) {
      startNewBatch();
    }

    state.page = page;
    state.showSaveAuth = false;
    state.authError = "";
    state.authNotice = "";
    state.mobileMenu = false;
    state.modal = null;
    if (page !== "signin" && page !== "signup" && page !== "reset") {
      state.returnTo = null;
    }
    syncUrl();
    render({ top: true });
  }

  function openRecipe(id) {
    const recipe = state.recipes.find((item) => item._id === id);
    if (!recipe) return;
    state.calc = calcFromRecipe(recipe);
    state.page = "home";
    state.showSaveAuth = false;
    state.modal = null;
    state.mobileMenu = false;
    syncUrl();
    render({ top: true });
  }

  function finishSignIn(user, message) {
    const wasAuthPage = isAuthPage(state.page);
    const target = state.returnTo || "home";
    state.user = user;
    state.authError = "";
    state.authNotice = "";
    state.showSaveAuth = false;
    state.returnTo = null;
    if (wasAuthPage) {
      state.page = PAGES.includes(target) ? target : "home";
    }
    syncUrl();
    render({ top: true });
    showToast(message, "success");
  }

  function signOut() {
    state.user = null;
    state.settings = clone(guestSettings);
    state.page = "home";
    state.returnTo = null;
    state.showSaveAuth = false;
    state.authError = "";
    state.authNotice = "";
    state.modal = null;
    startNewBatch();
    syncUrl();
    render({ top: true });
    showToast("Signed out.", "success");
  }

  function deleteAccount() {
    state.user = null;
    state.settings = clone(guestSettings);
    state.page = "home";
    state.returnTo = null;
    state.showSaveAuth = false;
    state.modal = null;
    startNewBatch();
    syncUrl();
    render({ top: true });
    showToast("Account deleted. Your local calculator still works.", "success");
  }

  /* ------------------------------------------------------------
     Toast + modal
     ------------------------------------------------------------ */

  let toastTimer = null;

  function showToast(message, type = "success") {
    const root = document.getElementById("toast-root");
    if (!root) return;
    root.innerHTML = `<div class="toast ${type}">${icon(
      type === "success" ? "check" : "alert",
    )}<span>${esc(message)}</span></div>`;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      root.innerHTML = "";
    }, 3800);
  }

  function openModal(modal) {
    state.modal = modal;
    render();
  }

  function closeModal() {
    state.modal = null;
    render();
  }

  function renderModal() {
    const modal = state.modal;
    if (!modal) return "";
    const actions = modal.cancelOnly
      ? `<button type="button" data-action="modal-cancel" data-modal-primary>Close</button>`
      : `<button type="button" data-action="modal-cancel">${esc(
          modal.cancelLabel || "Cancel",
        )}</button><button type="button" class="${
          modal.danger === false ? "" : "danger"
        }" data-action="modal-confirm" data-modal-primary>${esc(
          modal.confirmLabel || "Confirm",
        )}</button>`;

    return `<div class="proto-modal-backdrop" data-action="modal-cancel">
      <div class="proto-modal" role="dialog" aria-modal="true" aria-labelledby="proto-modal-title">
        <span class="proto-modal-kicker">Prototype confirmation</span>
        <h2 id="proto-modal-title">${esc(modal.title)}</h2>
        <p>${modal.message}</p>
        <div class="proto-modal-actions">${actions}</div>
      </div>
    </div>`;
  }

  function confirmModal() {
    const modal = state.modal;
    if (!modal) return;
    state.modal = null;

    if (modal.type === "delete-recipe") {
      state.recipes = state.recipes.filter((item) => item._id !== modal.id);
      if (state.calc.editingId === modal.id) startNewBatch();
      showToast("Recipe deleted.", "success");
    } else if (modal.type === "unlink") {
      if (modal.provider === "google") state.user.hasGoogleLinked = false;
      if (modal.provider === "twitter") state.user.hasTwitterLinked = false;
      showToast(
        `${modal.provider === "google" ? "Google" : "X"} account unlinked.`,
        "success",
      );
    } else if (modal.type === "delete-account") {
      deleteAccount();
      return;
    }

    render();
  }

  function requestUnlink(provider) {
    if (!state.user) return;
    const linked =
      (state.user.hasGoogleLinked ? 1 : 0) +
      (state.user.hasTwitterLinked ? 1 : 0);
    if (!state.user.hasPassword && linked < 2) {
      openModal({
        type: "unlink-blocked",
        title: "Set a password first",
        message:
          "You must set a password before you can unlink your only sign-in method.",
        cancelOnly: true,
      });
      return;
    }
    const label = provider === "google" ? "Google" : "X";
    openModal({
      type: "unlink",
      provider,
      title: `Unlink ${label}?`,
      message: `You will no longer be able to sign in to ejuicr with ${label}. Your account and recipes stay where they are.`,
      confirmLabel: "Remove",
    });
  }

  /* ------------------------------------------------------------
     Shared content
     ------------------------------------------------------------ */

  function staticContent(page) {
    switch (page) {
      case "about":
        return `<h1>About ejuicr</h1>
          <p>The goal of ejuicr is to be a vaper&apos;s first choice for a convenient and easy-to-use ejuice calculator.</p>
          <h2>Use it anywhere</h2>
          <p>If it can load a web page, it can run ejuicr.</p>
          <p>We try to keep the UI simple and unobtrusive so you can use ejuicr easily whether you are reaching past a bunch of bottles for your keyboard or pecking at your phone with one hand and mixing juice with the other.</p>
          <p>Install the web app to your desktop or home screen so you can even use ejuicr offline! <strong>(coming soon...)</strong></p>
          <h2>Little to no setup time</h2>
          <p>The faster you can start mixing, the better. So we try to remove as many speed bumps as possible.</p>
          <p>If you sign in, you can save your defaults (nicotine strength, PG/VG ratio, and more) to make mixing your ejuice even faster.</p>
          <h2>No ads or trackers — ever</h2>
          <p>ejuicr is a labour of love. We don&apos;t want your money or your data.</p>
          <p>If there is anything we want from you, it is your <a href="${pageHref(
            "contribute",
          )}" data-action="nav" data-page="contribute">feedback</a>.</p>
          <h2>No unnecessary emails — ever</h2>
          <p>We hate spam. You will never receive emails from us unless you email us for support or request a password reset.</p>`;
      case "help":
        return `<h1>Help</h1>
          <h2>Contact support</h2>
          <p>If you are having trouble with ejuicr and would like to reach out, send a message on X to <a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a> and someone will get back to you. A support email is shown on the live site when one is configured.</p>
          <h2>Send feedback</h2>
          <p>We appreciate any feedback you would like to share. Send a message on X to <a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>.</p>`;
      case "contribute":
        return `<h1>Contribute</h1>
          <h2>Send feedback</h2>
          <p>The easiest way to contribute is to send us your feedback on X at <a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>. We appreciate anything you would like to share.</p>
          <p>If you don&apos;t really have anything to say about ejuicr right now, maybe you could answer one or more of these questions for us:</p>
          <ul>
            <li>How did you find ejuicr?</li>
            <li>How long have you been using ejuicr?</li>
            <li>When and how do you typically use ejuicr?</li>
            <li>Do you find ejuicr easy to use, or did you have trouble at first?</li>
            <li>What is your favourite or least favourite thing about ejuicr?</li>
            <li>Is there a feature you wish ejuicr had?</li>
            <li>Have you ever had a problem with ejuicr? If so, what was it?</li>
            <li>Does ejuicr fail on any devices you have tried?</li>
            <li>How likely are you to recommend ejuicr to a friend?</li>
          </ul>
          <h2>GitHub</h2>
          <p>The source code for ejuicr is available on <a href="https://github.com/ejuicr/ejuicr" target="_blank" rel="noreferrer">GitHub</a>.</p>
          <p>To report a bug or formally suggest a new feature, create a new issue on the <a href="https://github.com/ejuicr/ejuicr/issues" target="_blank" rel="noreferrer">issues page</a>.</p>
          <p>Feel free to submit a pull request if you would like to contribute to the codebase. Please clearly document the changes you have made.</p>`;
      case "terms":
        return `<h1>Terms of Service</h1>
          <p>By using this web app, you agree to be bound by the following terms and conditions:</p>
          <ol>
            <li><strong>Content:</strong> The content of this web app is for general information purposes only. It is subject to change without notice.</li>
            <li><strong>Third-party services:</strong> This web app may use third-party services such as payment processors or analytics tools. By using this web app, you agree to be bound by the terms and conditions of any such third-party services.</li>
            <li><strong>Liability:</strong> We do not warrant or guarantee the accuracy, reliability, or completeness of the content of this web app. We are not liable for any damages arising from your use of this web app.</li>
            <li><strong>Termination:</strong> We may terminate your access to this web app at any time, without notice, for any reason.</li>
            <li><strong>Governing law:</strong> These terms and conditions are governed by the laws of Australia. Any disputes arising from your use of this web app will be resolved in accordance with the laws of Australia.</li>
          </ol>`;
      case "privacy":
        return `<h1>Privacy Policy</h1>
          <p>This privacy policy sets out how we collect, use, and protect any information that you give us when you use this web app.</p>
          <ol>
            <li><strong>Information we collect:</strong> We may collect personal information such as your display name and email address when you sign up to use this web app. We may also collect non-personal information such as your IP address and browser type.</li>
            <li><strong>How we use your information:</strong> We use your personal information to provide you with access to this web app and to communicate with you about your use of this web app.</li>
            <li><strong>How we protect your information:</strong> We are committed to ensuring that your information is secure. We use industry-standard measures to protect your personal information from unauthorised access, disclosure, and use.</li>
            <li><strong>Sharing your information:</strong> We will not sell, distribute, or lease your personal information to third parties unless we have your permission or are required by law to do so.</li>
            <li><strong>Cookies:</strong> This web app may use cookies to improve your user experience. You can choose to accept or decline cookies. Most web browsers automatically accept cookies, but you can usually modify your browser setting to decline cookies if you prefer.</li>
            <li><strong>Links to other websites:</strong> This web app may contain links to other websites. We are not responsible for the privacy practices or content of those websites.</li>
            <li><strong>Changes to this privacy policy:</strong> We may update this privacy policy from time to time by posting a new version on this web app. You should check this page occasionally to ensure that you are happy with any changes.</li>
          </ol>
          <p>By using this web app, you consent to the terms of this privacy policy. If you do not agree to this privacy policy, do not use this web app.</p>`;
      default:
        return "";
    }
  }

  function displayName(user) {
    if (!user) return "";
    if (user.authProvider === "twitter" && user.twitterHandle) {
      return `@${user.twitterHandle}`;
    }
    return (
      user.googleDisplayName ||
      user.twitterDisplayName ||
      user.email ||
      "ejuicr user"
    );
  }

  function providerLabel(user) {
    if (!user) return "";
    if (user.authProvider === "google") return "Google";
    if (user.authProvider === "twitter") return "X";
    return "Email";
  }

  function linkedCount(user) {
    if (!user) return 0;
    return (user.hasGoogleLinked ? 1 : 0) + (user.hasTwitterLinked ? 1 : 0);
  }

  function stepButton(variant, scope, field, step, label, index = null) {
    const className =
      variant === "A" ? "a-step" : variant === "B" ? "b-step" : "c-step";
    return `<button type="button" class="${className}" data-action="step" data-scope="${scope}" data-field="${field}" data-step="${step}"${
      index !== null ? ` data-index="${index}"` : ""
    } aria-label="${escAttr(label)}">${icon(
      step > 0 ? "plus" : "minus",
    )}</button>`;
  }

  /* ------------------------------------------------------------
     Shared renderer helpers
     ------------------------------------------------------------ */

  const NAV_ITEMS = [
    { key: "home", label: "Mix", icon: "flask" },
    { key: "recipes", label: "Recipes", icon: "book" },
    { key: "settings", label: "Settings", icon: "sliders" },
    { key: "account", label: "Account", icon: "user" },
  ];

  function sortedRecipes() {
    return [...state.recipes].sort((a, b) => {
      if (state.sort === "title") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime()
      );
    });
  }

  function measures(amount, weight) {
    let html = "";
    if (showVolume()) html += `<span>${fmt(amount)}mL</span>`;
    if (showWeight()) html += `<span>${fmt(weight)}g</span>`;
    return html;
  }

  function logo(variant) {
    return `<img class="${variant}-logo" src="assets/logo.svg" alt="ejuicr" />`;
  }

  /* ------------------------------------------------------------
     VARIANT A — Ledger (dark, display sans)
     ------------------------------------------------------------ */

  function aBrand() {
    return `<a class="a-brand" href="${pageHref(
      "home",
    )}" data-action="nav" data-page="home" aria-label="ejuicr home">${logo(
      "a",
    )}</a>`;
  }

  function aAuthAction() {
    if (state.user) {
      return `<button type="button" class="a-signout" data-action="sign-out" aria-label="Sign out" title="Sign out">${icon(
        "logout",
      )}</button>`;
    }
    if (isAuthPage(state.page)) return "";
    return `<button type="button" class="a-btn small" data-action="nav" data-page="signin">Sign in</button>`;
  }

  function aNav(active) {
    return `<nav class="a-nav" aria-label="Primary">${NAV_ITEMS.map(
      (item) =>
        `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
          item.key
        }" class="${active === item.key ? "active" : ""}">${icon(
          item.icon,
        )}<span>${item.label}</span></a>`,
    ).join("")}</nav>`;
  }

  function aRail(active) {
    return `<aside class="a-rail">
      ${aBrand()}
      ${aNav(active)}
      <div class="a-rail-foot">
        ${
          state.user
            ? `<div class="a-user-block">
                <button type="button" class="a-user" data-action="nav" data-page="account">
                  <span class="a-avatar">${esc(initials(displayName(state.user)))}</span>
                  <span class="a-user-text"><span class="a-user-name">${esc(
                    displayName(state.user),
                  )}</span><span class="a-user-mail">${esc(
                    state.user.email,
                  )}</span></span>
                </button>
                ${aAuthAction()}
              </div>`
            : isAuthPage(state.page)
              ? `<button type="button" class="a-btn full" data-action="nav" data-page="home">Back to mix</button>`
              : `<button type="button" class="a-btn full" data-action="nav" data-page="signin">Sign in</button>`
        }
      </div>
    </aside>`;
  }

  function aTopbar() {
    return `<header class="a-topbar">${aBrand()}${aAuthAction()}</header>`;
  }

  function aMobileNav(active) {
    return `<nav class="a-mobile-nav" aria-label="Primary">${NAV_ITEMS.map(
      (item) =>
        `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
          item.key
        }" aria-label="${item.label}" class="${
          active === item.key ? "active" : ""
        }">${icon(item.icon)}<span>${item.label}</span></a>`,
    ).join("")}</nav>`;
  }

  function aFooter() {
    return `<footer class="a-foot">
      <div class="a-foot-links">
        <a href="${pageHref("about")}" data-action="nav" data-page="about">About</a>
        <a href="${pageHref("help")}" data-action="nav" data-page="help">Help</a>
        <a href="${pageHref("contribute")}" data-action="nav" data-page="contribute">Contribute</a>
        <a href="https://www.jimfarrugia.com.au" target="_blank" rel="noreferrer">Jim Farrugia</a>
        <a href="https://www.twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>
      </div>
      <div class="a-foot-right">
        <a href="${pageHref("terms")}" data-action="nav" data-page="terms">Terms</a>
        <a href="${pageHref("privacy")}" data-action="nav" data-page="privacy">Privacy</a>
        <img class="a-footer-logo" src="assets/logo-gray.svg" alt="ejuicr" />
      </div>
    </footer>`;
  }

  function aPageHead(title, sub, aside = "") {
    return `<header class="a-page-head">
      <div>
        <h1 class="a-h1">${title}</h1>
        ${sub ? `<p class="a-sub">${sub}</p>` : ""}
      </div>
      ${aside ? `<div class="a-page-aside">${aside}</div>` : ""}
    </header>`;
  }

  function aRatioField(pgField, vgField, obj, scope, ariaPrefix) {
    return `<div>
      <div class="a-number-line">
        <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="${pgField}" data-focus="${pgField}" value="${escAttr(
          obj.pg,
        )}" aria-label="${escAttr(ariaPrefix)} PG percentage" />
        <span class="a-slash">/</span>
        <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="${vgField}" data-focus="${vgField}" value="${escAttr(
          obj.vg,
        )}" aria-label="${escAttr(ariaPrefix)} VG percentage" />
      </div>
      <div class="a-steppers a-config-steppers">
        ${stepButton("A", scope, "pg", -5, `Decrease ${ariaPrefix} PG`)}
        ${stepButton("A", scope, "pg", 5, `Increase ${ariaPrefix} PG`)}
      </div>
    </div>`;
  }

  function aTargetSection(c) {
    return `<section class="a-section">
      <div class="a-section-head">
        <span class="a-section-num">01</span>
        <h2 class="a-section-title">Target</h2>
        <span class="a-section-meta">${fmt(c.targetAmount)}mL batch</span>
      </div>
      <div class="a-field-row">
        <div class="a-field-label">PG / VG</div>
        <div class="a-field-body">
          <div class="a-number-line">
            <input class="a-number" type="number" min="0" max="100" inputmode="numeric" data-field="target-pg" data-focus="target-pg" value="${escAttr(
              state.calc.pg,
            )}" aria-label="Target PG percentage" />
            <span class="a-slash">/</span>
            <input class="a-number" type="number" min="0" max="100" inputmode="numeric" data-field="target-vg" data-focus="target-vg" value="${escAttr(
              state.calc.vg,
            )}" aria-label="Target VG percentage" />
          </div>
          <div class="a-ratio-bar" aria-hidden="true">
            <span class="a-ratio-pg" style="width:${Math.max(
              0,
              Math.min(100, c.targetPg),
            )}%"></span>
            <span class="a-ratio-vg" style="width:${Math.max(
              0,
              Math.min(100, c.targetVg),
            )}%"></span>
          </div>
        </div>
        <div class="a-steppers">
          ${stepButton("A", "target", "pg", -5, "Decrease target PG")}
          ${stepButton("A", "target", "pg", 5, "Increase target PG")}
        </div>
      </div>
      ${
        c.showNic
          ? `<div class="a-field-row">
              <div class="a-field-label">Strength</div>
              <div class="a-field-body">
                <div class="a-number-line">
                  <input class="a-number" type="number" min="0" step="any" inputmode="decimal" data-field="target-strength" data-focus="target-strength" value="${escAttr(
                    state.calc.strength,
                  )}" aria-label="Target nicotine strength" />
                  <span class="a-unit">mg/mL</span>
                </div>
              </div>
              <div class="a-steppers">
                ${stepButton("A", "target", "strength", -1, "Decrease target strength")}
                ${stepButton("A", "target", "strength", 1, "Increase target strength")}
              </div>
            </div>`
          : ""
      }
      <div class="a-field-row">
        <div class="a-field-label">Amount</div>
        <div class="a-field-body">
          <div class="a-number-line">
            <input class="a-number" type="number" min="0" step="any" inputmode="decimal" data-field="target-amount" data-focus="target-amount" value="${escAttr(
              state.calc.amount,
            )}" aria-label="Target amount" />
            <span class="a-unit">mL</span>
          </div>
        </div>
        <div class="a-steppers">
          ${stepButton("A", "target", "amount", -10, "Decrease target amount")}
          ${stepButton("A", "target", "amount", 10, "Increase target amount")}
        </div>
      </div>
      ${c.showNic ? aNicDisclosure() : ""}
    </section>`;
  }

  function aNicDisclosure() {
    const nic = state.calc.nic;
    const open = Boolean(state.calc.nicOpen);
    return `<div class="a-disclosure ${open ? "open" : ""}">
      <button type="button" class="a-disclosure-toggle" data-action="toggle-nic">
        <span class="a-field-label">Nic base</span>
        <span class="a-disclosure-summary">${fmt(num(nic.strength))}mg/mL · ${fmt(
          num(nic.pg),
        )}/${fmt(num(nic.vg))}</span>
        ${icon("chevron-down")}
      </button>
      ${
        open
          ? `<div class="a-disclosure-body">
              <div class="a-subfields">
                <div>
                  <div class="a-field-label">Base PG / VG</div>
                  <div class="a-number-line">
                    <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-pg" data-focus="nic-pg" value="${escAttr(
                      nic.pg,
                    )}" aria-label="Nicotine base PG percentage" />
                    <span class="a-slash">/</span>
                    <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-vg" data-focus="nic-vg" value="${escAttr(
                      nic.vg,
                    )}" aria-label="Nicotine base VG percentage" />
                  </div>
                  <div class="a-steppers a-config-steppers">
                    ${stepButton("A", "nic", "pg", -5, "Decrease nicotine base PG")}
                    ${stepButton("A", "nic", "pg", 5, "Increase nicotine base PG")}
                  </div>
                </div>
                <div>
                  <div class="a-field-label">Strength</div>
                  <div class="a-number-line">
                    <input class="a-number small" type="number" min="0" max="1000" inputmode="numeric" data-field="nic-strength" data-focus="nic-strength" value="${escAttr(
                      nic.strength,
                    )}" aria-label="Nicotine base strength" />
                    <span class="a-unit">mg/mL</span>
                  </div>
                  <div class="a-steppers a-config-steppers">
                    ${stepButton("A", "nic", "strength", -5, "Decrease nicotine base strength")}
                    ${stepButton("A", "nic", "strength", 5, "Increase nicotine base strength")}
                  </div>
                </div>
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function aFlavorsSection(c) {
    return `<section class="a-section">
      <div class="a-section-head">
        <span class="a-section-num">02</span>
        <h2 class="a-section-title">Flavors</h2>
        <span class="a-section-meta">${c.flavors.length} ${
          c.flavors.length === 1 ? "flavor" : "flavors"
        }</span>
      </div>
      ${
        c.flavors.length
          ? c.flavors.map((flavor, index) => aFlavorRow(flavor, index)).join("")
          : `<div class="a-empty"><strong>No flavors yet.</strong>Add one to build the recipe.</div>`
      }
      <button type="button" class="a-add" data-action="add-flavor">${icon(
        "plus",
      )} Add flavor</button>
    </section>`;
  }

  function aFlavorRow(flavor, index) {
    const open = Boolean(state.calc.flavorOpen[index]);
    return `<div class="a-flavor">
      <div class="a-flavor-main">
        <input class="a-flavor-name" type="text" maxlength="60" data-field="flavor-name-${index}" data-focus="flavor-name-${index}" value="${escAttr(
          flavor.name,
        )}" aria-label="Flavor ${index + 1} name" />
        <div class="a-flavor-pct">
          <input class="a-number small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="flavor-pct-${index}" data-focus="flavor-pct-${index}" value="${escAttr(
            flavor.pct,
          )}" aria-label="Flavor ${index + 1} percentage" />
          <span class="a-unit">%</span>
        </div>
        <div class="a-steppers">
          ${stepButton("A", "flavor", "pct", -0.5, `Decrease flavor ${index + 1} percentage`, index)}
          ${stepButton("A", "flavor", "pct", 0.5, `Increase flavor ${index + 1} percentage`, index)}
        </div>
        <div class="a-flavor-actions">
          <button type="button" class="a-icon-btn" data-action="toggle-flavor" data-index="${index}" aria-label="Configure flavor ${
            index + 1
          }" aria-expanded="${open}">${icon("sliders")}</button>
          <button type="button" class="a-icon-btn danger" data-action="remove-flavor" data-index="${index}" aria-label="Delete flavor ${
            index + 1
          }">${icon("trash")}</button>
        </div>
      </div>
      ${
        open
          ? `<div class="a-flavor-config">
              <div class="a-field-label">Base PG / VG</div>
              <div class="a-number-line">
                <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-pg-${index}" data-focus="flavor-pg-${index}" value="${escAttr(
                flavor.pg,
              )}" aria-label="Flavor ${index + 1} base PG percentage" />
                <span class="a-slash">/</span>
                <input class="a-number small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-vg-${index}" data-focus="flavor-vg-${index}" value="${escAttr(
                flavor.vg,
              )}" aria-label="Flavor ${index + 1} base VG percentage" />
              </div>
              <div class="a-steppers a-config-steppers">
                ${stepButton("A", "flavor", "pg", -5, `Decrease flavor ${index + 1} base PG`, index)}
                ${stepButton("A", "flavor", "pg", 5, `Increase flavor ${index + 1} base PG`, index)}
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function aResultRow(name, sub, pctValue, amount, weight, className = "") {
    return `<div class="a-result ${className}">
      <div class="a-result-name"><span>${name}</span>${
        sub ? `<small>${sub}</small>` : ""
      }</div>
      <div class="a-result-values"><span class="a-result-pct">${pct(
        pctValue,
      )}</span>${measures(amount, weight)}</div>
    </div>`;
  }

  function aBatchSheet(c) {
    const widths = stackWidths(c);
    return `<aside class="a-batch">
      <div class="a-sheet">
        <div class="a-sheet-head">
          <span class="a-sheet-title">Batch sheet</span>
          <span class="a-sheet-meta">${c.flavors.length} ${
            c.flavors.length === 1 ? "flavor" : "flavors"
          }</span>
        </div>
        <div class="a-sheet-total">
          <div class="a-total-value">${fmt(
            c.targetAmount,
          )}<small>mL</small></div>
          <div class="a-total-meta">${
            c.showNic
              ? `<strong>${fmt(c.targetStrength)}mg/mL</strong>strength`
              : `<strong>0mg/mL</strong>nicotine-free`
          }</div>
        </div>
        <div class="a-stack" aria-hidden="true">
          <span class="a-stack-nic" style="width:${widths[0]}%"></span>
          <span class="a-stack-pg" style="width:${widths[1]}%"></span>
          <span class="a-stack-vg" style="width:${widths[2]}%"></span>
          <span class="a-stack-flavor" style="width:${widths[3]}%"></span>
        </div>
        <div class="a-results">
          ${
            c.showNic
              ? aResultRow(
                  "Nicotine",
                  `${fmt(c.nicStrength)}mg · ${fmt(c.nicPg)}/${fmt(c.nicVg)}`,
                  c.nicPct,
                  c.nic.amount,
                  c.nic.weight,
                  `nic${c.nicInvalid ? " invalid" : ""}`,
                )
              : ""
          }
          ${aResultRow(
            "Propylene glycol",
            "Carrier",
            c.pgPct,
            c.pgRequired,
            c.pgWeight,
            `pg${c.pgInvalid ? " invalid" : ""}`,
          )}
          ${aResultRow(
            "Vegetable glycerin",
            "Carrier",
            c.vgPct,
            c.vgRequired,
            c.vgWeight,
            `vg${c.vgInvalid ? " invalid" : ""}`,
          )}
          ${c.flavors
            .map((flavor) =>
              aResultRow(
                esc(flavor.name || "Untitled flavor"),
                `Base ${fmt(flavor.pg)}/${fmt(flavor.vg)}`,
                flavor.percentage,
                flavor.amount,
                flavor.weight,
                `flavor${flavor.invalid ? " invalid" : ""}`,
              ),
            )
            .join("")}
        </div>
        ${
          c.error
            ? `<div class="a-error">${icon("alert")}<span>${esc(
                c.error,
              )}</span></div>`
            : ""
        }
        ${aSaveBlock(c)}
      </div>
    </aside>`;
  }

  function aProviderButtons() {
    return `<div class="a-provider-row">
      <button type="button" class="a-provider full" data-action="sign-in-provider" data-provider="google"><img src="assets/google-logo.svg" alt="" />Continue with Google</button>
      <button type="button" class="a-provider full dark" data-action="sign-in-provider" data-provider="twitter"><img src="assets/x-logo.svg" alt="" />Continue with X</button>
      <button type="button" class="a-provider full" data-action="nav" data-page="signin">${icon(
        "mail",
      )}Continue with email</button>
    </div>`;
  }

  function aSaveBlock(c) {
    if (!state.user) {
      if (!state.showSaveAuth) {
        return `<div class="a-save">
          <div class="a-save-label">Keep this batch</div>
          <button type="button" class="a-btn full" data-action="show-save-auth">${icon(
            "user",
          )} Sign in to save</button>
          <p class="a-save-note">The calculator works without an account. Sign in to keep recipes and defaults.</p>
        </div>`;
      }
      return `<div class="a-save">
        <div class="a-save-label">Sign in to save</div>
        ${aProviderButtons()}
        <p class="a-save-note">Your current batch stays exactly as it is.</p>
      </div>`;
    }

    return `<div class="a-save">
      <div class="a-save-label">${
        state.calc.editingId ? "Update recipe" : "Save this batch"
      }</div>
      <div class="a-save-row">
        <input class="a-save-input" type="text" data-field="recipe-title" data-focus="recipe-title" value="${escAttr(
          state.calc.title,
        )}" placeholder="Recipe title" aria-label="Recipe title" />
        <button type="button" class="a-btn" data-action="save-recipe"${
          c.error ? " disabled" : ""
        }>${icon("save")} ${state.calc.editingId ? "Save changes" : "Save"}</button>
      </div>
      <p class="a-save-note">${
        state.calc.editingId
          ? "Changes replace the saved recipe."
          : "Saved to your private recipe list."
      }</p>
    </div>`;
  }

  function aHome() {
    const c = compute();
    const editing = Boolean(state.calc.editingId);
    const title = editing
      ? state.calc.title || "Untitled recipe"
      : "New batch";
    return `${aPageHead(
      esc(title),
      editing
        ? "Edit the recipe, then save your changes."
        : "Set a target. The sheet keeps every measurement in view.",
      `<span>Units · ${unitsLabel()}</span><br /><a href="${pageHref(
        "settings",
      )}" data-action="nav" data-page="settings">Defaults</a>`,
    )}
    <div class="a-home-grid">
      <div>
        ${aTargetSection(c)}
        ${aFlavorsSection(c)}
      </div>
      ${aBatchSheet(c)}
    </div>`;
  }

  function aRecipes() {
    const recipes = sortedRecipes();
    return `${aPageHead(
      "Saved recipes",
      "Every recipe in your account, ready to open.",
      `<span>${recipes.length} ${
        recipes.length === 1 ? "recipe" : "recipes"
      }</span>`,
    )}
    <div class="a-page-toolbar">
      <div class="a-sort" aria-label="Sort recipes">
        <button type="button" data-action="sort" data-sort="date" class="${
          state.sort === "date" ? "active" : ""
        }">Last updated</button>
        <button type="button" data-action="sort" data-sort="title" class="${
          state.sort === "title" ? "active" : ""
        }">Title</button>
      </div>
      <span class="a-count">${recipes.length} total</span>
    </div>
    ${
      recipes.length
        ? `<div class="a-recipe-list">${recipes
            .map(
              (recipe, index) => `<div class="a-recipe-item">
                <span class="a-recipe-index">${String(index + 1).padStart(
                  2,
                  "0",
                )}</span>
                <button type="button" class="a-recipe-title" data-action="open-recipe" data-id="${recipe._id}">${esc(
                  recipe.name,
                )}</button>
                <span class="a-recipe-date">${formatDate(
                  recipe.updatedAt,
                )}</span>
                <button type="button" class="a-icon-btn danger" data-action="ask-delete-recipe" data-id="${
                  recipe._id
                }" aria-label="Delete ${escAttr(recipe.name)}">${icon(
                  "trash",
                )}</button>
              </div>`,
            )
            .join("")}</div>`
        : `<div class="a-empty"><strong>Nothing saved yet.</strong>Mix a batch and save it to start your library.</div>`
    }`;
  }

  function aSettings() {
    const settings = state.settings;
    return `${aPageHead(
      "Settings",
      "Defaults for every new batch. Your current batch is untouched until you start another one.",
      `<span>Units · ${unitsLabel()}</span>`,
    )}
    <div class="a-settings-layout">
      <nav class="a-settings-index" aria-label="Settings sections">
        <a href="#a-appearance">Appearance</a>
        <a href="#a-target-defaults">Target defaults</a>
        <a href="#a-nicotine">Nicotine</a>
        <a href="#a-flavors">Flavors</a>
        <div class="save-mini"><button type="button" class="a-btn small" data-action="save-settings">${icon(
          "save",
        )} Save</button></div>
      </nav>
      <div>
        <section class="a-settings-block" id="a-appearance">
          <h2>Appearance</h2>
          <p class="hint">How amounts are shown in the calculator and batch sheet.</p>
          <div class="a-settings-row">
            <label for="a-units">Mixing units<span class="desc">Volume, weight, or both.</span></label>
            <select id="a-units" class="a-select" data-change="settings-units">
              <option value="both" ${selected("both", settings.units)}>Both</option>
              <option value="volume" ${selected("volume", settings.units)}>Volume (mL)</option>
              <option value="weight" ${selected("weight", settings.units)}>Weight (g)</option>
            </select>
          </div>
        </section>

        <section class="a-settings-block" id="a-target-defaults">
          <h2>Target defaults</h2>
          <p class="hint">What the calculator starts with when you open a new batch.</p>
          <div class="a-settings-row">
            <label>Default base<span class="desc">Target PG / VG ratio.</span></label>
            ${aRatioField(
              "settings-pg",
              "settings-vg",
              settings.base,
              "settings-target",
              "default target",
            )}
          </div>
          <div class="a-settings-row">
            <label>Default strength<span class="desc">Target nicotine strength.</span></label>
            <div class="a-number-line">
              <input class="a-number small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-strength" data-focus="settings-strength" value="${escAttr(
                settings.strength,
              )}" aria-label="Default target nicotine strength" />
              <span class="a-unit">mg/mL</span>
              <div class="a-steppers">
                ${stepButton("A", "settings-target", "strength", -1, "Decrease default target strength")}
                ${stepButton("A", "settings-target", "strength", 1, "Increase default target strength")}
              </div>
            </div>
          </div>
          <div class="a-settings-row">
            <label>Default amount<span class="desc">How much a new batch makes.</span></label>
            <div class="a-number-line">
              <input class="a-number small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-amount" data-focus="settings-amount" value="${escAttr(
                settings.amount,
              )}" aria-label="Default target amount" />
              <span class="a-unit">mL</span>
              <div class="a-steppers">
                ${stepButton("A", "settings-target", "amount", -10, "Decrease default target amount")}
                ${stepButton("A", "settings-target", "amount", 10, "Increase default target amount")}
              </div>
            </div>
          </div>
        </section>

        <section class="a-settings-block" id="a-nicotine">
          <h2>Nicotine</h2>
          <p class="hint">Defaults for the nicotine base in the ingredients sheet.</p>
          <div class="a-settings-row">
            <label>Zero nicotine mode<span class="desc">Hide nicotine controls in the calculator.</span></label>
            <button type="button" class="a-toggle" role="switch" aria-checked="${
              settings.zeroNicotineMode
            }" aria-label="Toggle zero nicotine mode" data-action="toggle-zero"></button>
          </div>
          <div class="a-settings-row">
            <label>Default strength<span class="desc">Undiluted nicotine base strength.</span></label>
            <div class="a-number-line">
              <input class="a-number small" type="number" min="0" max="1000" inputmode="numeric" data-field="settings-nic-strength" data-focus="settings-nic-strength" value="${escAttr(
                settings.nicotine.strength,
              )}" aria-label="Default nicotine base strength" />
              <span class="a-unit">mg/mL</span>
              <div class="a-steppers">
                ${stepButton("A", "settings-nic", "strength", -5, "Decrease default nicotine base strength")}
                ${stepButton("A", "settings-nic", "strength", 5, "Increase default nicotine base strength")}
              </div>
            </div>
          </div>
          <div class="a-settings-row">
            <label>Default base<span class="desc">Nicotine base PG / VG ratio.</span></label>
            ${aRatioField(
              "settings-nic-pg",
              "settings-nic-vg",
              settings.nicotine.base,
              "settings-nic",
              "default nicotine base",
            )}
          </div>
        </section>

        <section class="a-settings-block" id="a-flavors">
          <h2>Flavors</h2>
          <p class="hint">Defaults applied to each new flavor you add.</p>
          <div class="a-settings-row">
            <label>Default base<span class="desc">Flavor base PG / VG ratio.</span></label>
            ${aRatioField(
              "settings-flavor-pg",
              "settings-flavor-vg",
              settings.flavor.base,
              "settings-flavor",
              "default flavor base",
            )}
          </div>
          <div class="a-settings-row">
            <label>Default percentage<span class="desc">Starting percentage for a new flavor.</span></label>
            <div class="a-number-line">
              <input class="a-number small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="settings-flavor-pct" data-focus="settings-flavor-pct" value="${escAttr(
                settings.flavor.percentage,
              )}" aria-label="Default flavor percentage" />
              <span class="a-unit">%</span>
              <div class="a-steppers">
                ${stepButton("A", "settings-flavor", "pct", -0.5, "Decrease default flavor percentage")}
                ${stepButton("A", "settings-flavor", "pct", 0.5, "Increase default flavor percentage")}
              </div>
            </div>
          </div>
        </section>

        <div class="a-settings-save">
          <button type="button" class="a-btn" data-action="save-settings">${icon(
            "save",
          )} Save settings</button>
        </div>
      </div>
    </div>`;
  }

  function aLinkedRow(provider, name, shared) {
    const logoName = provider === "google" ? "google-logo.svg" : "x-logo.svg";
    return `<div class="a-linked-row">
      <div class="a-linked-logo ${provider === "twitter" ? "dark" : ""}"><img src="assets/${logoName}" alt="" /></div>
      <div>
        <p class="a-linked-name">${name}</p>
        <p class="a-linked-shared">${shared}</p>
        <button type="button" class="a-btn ghost small" data-action="ask-unlink" data-provider="${provider}">Remove</button>
      </div>
    </div>`;
  }

  function aPasswordForm(user) {
    if (!user.hasPassword) {
      return `<p>You signed in with Google. Add a password so you can also sign in with email.</p>
        <form class="a-form" data-form="set-password">
          <input class="a-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
          <input class="a-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
          <button type="submit" class="a-btn">Set password</button>
        </form>`;
    }
    return `<p>Use a password to sign in without going through Google.</p>
      <form class="a-form" data-form="change-password">
        <input class="a-input" type="password" name="current" placeholder="Current password" aria-label="Current password" autocomplete="current-password" required />
        <input class="a-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
        <input class="a-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
        <button type="submit" class="a-btn">Change password</button>
      </form>`;
  }

  function aAccount() {
    const user = state.user;
    if (!user) {
      state.page = "signin";
      return aAuth();
    }
    return `${aPageHead(
      "My account",
      "Profile, sign-in methods, and account controls.",
      `<span>${state.recipes.length} saved ${
        state.recipes.length === 1 ? "recipe" : "recipes"
      }</span>`,
    )}
    <div class="a-account-hero">
      <div class="a-avatar-lg">${esc(initials(displayName(user)))}</div>
      <div>
        <h2 class="a-account-name">${esc(displayName(user))}</h2>
        <p class="a-account-email">${providerLabel(user)} · ${esc(
          user.email,
        )}</p>
        <div class="a-account-actions">
          <button type="button" class="a-btn ghost small" data-action="sign-out">${icon(
            "logout",
          )} Sign out</button>
        </div>
      </div>
      <div class="a-account-stats">
        <div class="a-stat"><button type="button" class="a-stat-link" data-action="nav" data-page="recipes" aria-label="View saved recipes"><strong>${state.recipes.length}</strong><span>Recipes</span></button></div>
        <div class="a-stat"><strong>${linkedCount(
          user,
        )}</strong><span>Linked</span></div>
      </div>
    </div>
    <div class="a-account-grid">
      <section class="a-card-block">
        <h2>Linked accounts</h2>
        <p>These accounts are linked to ejuicr so you can sign in without a password. You can see the data shared with ejuicr below.</p>
        ${
          user.hasGoogleLinked
            ? aLinkedRow(
                "google",
                "Google",
                "Display name, email, profile picture.",
              )
            : ""
        }
        ${
          user.hasTwitterLinked
            ? aLinkedRow(
                "twitter",
                "X",
                "Handle, display name, email, profile picture.",
              )
            : ""
        }
        ${
          !user.hasGoogleLinked && !user.hasTwitterLinked
            ? `<p>No linked accounts.</p>`
            : ""
        }
      </section>
      <section class="a-card-block">
        <h2>${user.hasPassword ? "Change password" : "Set a password"}</h2>
        ${aPasswordForm(user)}
      </section>
    </div>
    <div class="a-danger">
      <h2>Delete account</h2>
      <p>Permanently delete your account, profile, saved recipes, and settings. <strong>This cannot be undone.</strong></p>
      <button type="button" class="a-btn danger" data-action="ask-delete-account">${icon(
        "trash",
      )} Delete account</button>
    </div>`;
  }

  function aAuth() {
    const view = state.page;
    const isSignin = view === "signin";
    const isSignup = view === "signup";
    const title = isSignin
      ? "Welcome back"
      : isSignup
        ? "Create an account"
        : "Reset password";
    const lede = isSignin
      ? "Sign in to save recipes, keep your defaults, and pick up where you left off."
      : isSignup
        ? "Save recipes and defaults across visits. No ads, no trackers."
        : "Enter the email on your account and we will send a reset link.";
    return `<div class="a-auth-wrap">
      <div class="a-auth-card">
        <div class="a-auth-brand">${aBrand()}</div>
        <h1>${title}</h1>
        <p class="lede">${lede}</p>
        ${state.authError ? `<div class="a-auth-error">${esc(state.authError)}</div>` : ""}
        ${state.authNotice ? `<div class="a-auth-notice">${esc(state.authNotice)}</div>` : ""}
        ${
          isSignin
            ? `${aProviderButtons()}<div class="a-auth-divider">or use email</div>
              <form class="a-form" data-form="signin">
                <input class="a-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                <input class="a-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required />
                <button type="submit" class="a-btn full">Sign in</button>
              </form>
              <div class="a-auth-links"><button type="button" data-action="nav" data-page="reset">Forgot password?</button><button type="button" data-action="nav" data-page="signup">Create an account</button></div>`
            : isSignup
              ? `<form class="a-form" data-form="signup">
                  <input class="a-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                  <input class="a-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="new-password" required />
                  <input class="a-input" type="password" name="confirm" placeholder="Confirm password" aria-label="Confirm password" autocomplete="new-password" required />
                  <button type="submit" class="a-btn full">Create account</button>
                </form>
                <div class="a-auth-links"><span>Already have an account?</span><button type="button" data-action="nav" data-page="signin">Sign in</button></div>`
              : `<form class="a-form" data-form="reset">
                  <input class="a-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                  <button type="submit" class="a-btn full">Send reset link</button>
                </form>
                <div class="a-auth-links"><button type="button" data-action="nav" data-page="signin">Back to sign in</button></div>`
        }
      </div>
    </div>`;
  }

  function aProse(page) {
    return `<div class="a-prose">${staticContent(page)}</div>`;
  }

  function renderA() {
    const page = state.page;
    let content = "";
    let active = NAV_ITEMS.some((item) => item.key === page) ? page : "";
    switch (page) {
      case "home":
        content = aHome();
        break;
      case "recipes":
        content = aRecipes();
        break;
      case "settings":
        content = aSettings();
        break;
      case "account":
        content = aAccount();
        break;
      case "signin":
      case "signup":
      case "reset":
        content = aAuth();
        active = "account";
        break;
      case "about":
      case "help":
      case "contribute":
      case "terms":
      case "privacy":
        content = aProse(page);
        active = "";
        break;
      default:
        content = aHome();
        active = "home";
    }
    return `<div class="a-shell">
      ${aRail(active)}
      ${aTopbar()}
      <main class="a-main"><div class="a-main-inner">${content}${aFooter()}</div></main>
      ${aMobileNav(active)}
    </div>`;
  }

  /* ------------------------------------------------------------
     VARIANT B — Instrument (dark, readable density)
     ------------------------------------------------------------ */

  function bBrand() {
    return `<a class="b-brand" href="${pageHref(
      "home",
    )}" data-action="nav" data-page="home" aria-label="ejuicr home">${logo(
      "b",
    )}</a>`;
  }

  function bAuthAction() {
    if (state.user) {
      return `<button type="button" class="b-signout" data-action="sign-out" aria-label="Sign out" title="Sign out">${icon(
        "logout",
      )}</button>`;
    }
    if (isAuthPage(state.page)) return "";
    return `<button type="button" class="b-btn small" data-action="nav" data-page="signin">Sign in</button>`;
  }

  function bRail(active) {
    return `<aside class="b-rail">
      ${bBrand()}
      <nav class="b-nav" aria-label="Primary">${NAV_ITEMS.map(
        (item, index) =>
          `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
            item.key
          }" class="${active === item.key ? "active" : ""}">
            <span class="b-nav-index">${String(index + 1).padStart(
              2,
              "0",
            )}</span><span>${item.label}</span>
          </a>`,
      ).join("")}</nav>
      <div class="b-rail-foot">
        ${
          state.user
            ? `<div class="b-user-block">
                <button type="button" class="b-user" data-action="nav" data-page="account">
                  <span class="b-avatar-sm">${esc(initials(displayName(state.user)))}</span>
                  <span class="b-user-text"><span class="b-user-name">${esc(
                    displayName(state.user),
                  )}</span><span class="b-user-mail">${esc(
                    state.user.email,
                  )}</span></span>
                </button>
                ${bAuthAction()}
              </div>`
            : isAuthPage(state.page)
              ? `<button type="button" class="b-btn full" data-action="nav" data-page="home">Back to mix</button>`
              : `<button type="button" class="b-btn full" data-action="nav" data-page="signin">Sign in</button>`
        }
      </div>
    </aside>`;
  }

  function bTopbar() {
    return `<header class="b-topbar">${bBrand()}${bAuthAction()}</header>`;
  }

  function bMobileNav(active) {
    return `<nav class="b-mobile-nav" aria-label="Primary">${NAV_ITEMS.map(
      (item) =>
        `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
          item.key
        }" aria-label="${item.label}" class="${
          active === item.key ? "active" : ""
        }">${icon(item.icon)}<span>${item.label}</span></a>`,
    ).join("")}</nav>`;
  }

  function bFooter() {
    return `<footer class="b-foot">
      <div class="b-foot-links">
        <a href="${pageHref("about")}" data-action="nav" data-page="about">About</a>
        <a href="${pageHref("help")}" data-action="nav" data-page="help">Help</a>
        <a href="${pageHref("contribute")}" data-action="nav" data-page="contribute">Contribute</a>
        <a href="https://www.jimfarrugia.com.au" target="_blank" rel="noreferrer">Jim Farrugia</a>
        <a href="https://www.twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>
      </div>
      <div class="b-foot-right">
        <a href="${pageHref("terms")}" data-action="nav" data-page="terms">Terms</a>
        <a href="${pageHref("privacy")}" data-action="nav" data-page="privacy">Privacy</a>
        <img class="b-footer-logo" src="assets/logo-gray.svg" alt="ejuicr" />
      </div>
    </footer>`;
  }

  function bPageHead(title, sub, meta = "") {
    return `<header class="b-page-head">
      <div>
        <h1 class="b-h1">${title}</h1>
        ${sub ? `<p class="b-sub">${sub}</p>` : ""}
      </div>
      ${meta ? `<div class="b-page-meta">${meta}</div>` : ""}
    </header>`;
  }

  function bRatioSet(pgField, vgField, obj, scope, ariaPrefix) {
    return `<div>
      <div class="b-num-wrap">
        <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="${pgField}" data-focus="${pgField}" value="${escAttr(
          obj.pg,
        )}" aria-label="${escAttr(ariaPrefix)} PG percentage" />
        <span class="b-slash">/</span>
        <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="${vgField}" data-focus="${vgField}" value="${escAttr(
          obj.vg,
        )}" aria-label="${escAttr(ariaPrefix)} VG percentage" />
        <div class="b-steppers">
          ${stepButton("B", scope, "pg", -5, `Decrease ${ariaPrefix} PG`)}
          ${stepButton("B", scope, "pg", 5, `Increase ${ariaPrefix} PG`)}
        </div>
      </div>
    </div>`;
  }

  function bTargetPanel(c) {
    return `<section class="b-panel">
      <div class="b-panel-head">
        <span class="b-panel-title">Target</span>
        <span class="b-panel-title">${fmt(c.targetAmount)}mL</span>
      </div>
      <div class="b-ratio">
        <div class="b-ratio-labels"><span>PG <strong>${fmt(
          c.targetPg,
        )}</strong></span><span>VG <strong>${fmt(c.targetVg)}</strong></span></div>
        <div class="b-ratio-bar" aria-hidden="true">
          <span class="b-ratio-pg" style="width:${Math.max(
            0,
            Math.min(100, c.targetPg),
          )}%"></span>
          <span class="b-ratio-vg" style="width:${Math.max(
            0,
            Math.min(100, c.targetVg),
          )}%"></span>
        </div>
        <div class="b-ratio-inputs">
          <input class="b-num" type="number" min="0" max="100" inputmode="numeric" data-field="target-pg" data-focus="target-pg" value="${escAttr(
            state.calc.pg,
          )}" aria-label="Target PG percentage" />
          <span class="b-slash">/</span>
          <input class="b-num" type="number" min="0" max="100" inputmode="numeric" data-field="target-vg" data-focus="target-vg" value="${escAttr(
            state.calc.vg,
          )}" aria-label="Target VG percentage" />
          <div class="b-steppers">
            ${stepButton("B", "target", "pg", -5, "Decrease target PG")}
            ${stepButton("B", "target", "pg", 5, "Increase target PG")}
          </div>
        </div>
      </div>
      ${
        c.showNic
          ? `<div class="b-input-row">
              <span class="b-label">Strength<small>Target nicotine</small></span>
              <div class="b-num-wrap">
                <input class="b-num" type="number" min="0" step="any" inputmode="decimal" data-field="target-strength" data-focus="target-strength" value="${escAttr(
                  state.calc.strength,
                )}" aria-label="Target nicotine strength" />
                <span class="b-unit">mg/mL</span>
                <div class="b-steppers">
                  ${stepButton("B", "target", "strength", -1, "Decrease target strength")}
                  ${stepButton("B", "target", "strength", 1, "Increase target strength")}
                </div>
              </div>
            </div>`
          : ""
      }
      <div class="b-input-row">
        <span class="b-label">Amount<small>Batch volume</small></span>
        <div class="b-num-wrap">
          <input class="b-num" type="number" min="0" step="any" inputmode="decimal" data-field="target-amount" data-focus="target-amount" value="${escAttr(
            state.calc.amount,
          )}" aria-label="Target amount" />
          <span class="b-unit">mL</span>
          <div class="b-steppers">
            ${stepButton("B", "target", "amount", -10, "Decrease target amount")}
            ${stepButton("B", "target", "amount", 10, "Increase target amount")}
          </div>
        </div>
      </div>
      ${c.showNic ? bNicDrawer(c) : ""}
    </section>`;
  }

  function bNicDrawer(c) {
    const nic = state.calc.nic;
    const open = Boolean(state.calc.nicOpen);
    return `<div class="b-drawer ${open ? "open" : ""}">
      <button type="button" class="b-drawer-toggle" data-action="toggle-nic">Nicotine base <span>${fmt(
        c.nicStrength,
      )}mg/mL · ${fmt(c.nicPg)}/${fmt(c.nicVg)}</span>${icon(
        "chevron-down",
      )}</button>
      ${
        open
          ? `<div class="b-drawer-body">
              <div>
                <span class="b-label">Strength</span>
                <div class="b-num-wrap">
                  <input class="b-num small" type="number" min="0" max="1000" inputmode="numeric" data-field="nic-strength" data-focus="nic-strength" value="${escAttr(
                    nic.strength,
                  )}" aria-label="Nicotine base strength" />
                  <span class="b-unit">mg/mL</span>
                </div>
                <div class="b-steppers">
                  ${stepButton("B", "nic", "strength", -5, "Decrease nicotine base strength")}
                  ${stepButton("B", "nic", "strength", 5, "Increase nicotine base strength")}
                </div>
              </div>
              <div>
                <span class="b-label">Base PG / VG</span>
                <div class="b-num-wrap">
                  <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-pg" data-focus="nic-pg" value="${escAttr(
                    nic.pg,
                  )}" aria-label="Nicotine base PG percentage" />
                  <span class="b-slash">/</span>
                  <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-vg" data-focus="nic-vg" value="${escAttr(
                    nic.vg,
                  )}" aria-label="Nicotine base VG percentage" />
                </div>
                <div class="b-steppers">
                  ${stepButton("B", "nic", "pg", -5, "Decrease nicotine base PG")}
                  ${stepButton("B", "nic", "pg", 5, "Increase nicotine base PG")}
                </div>
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function bResultRow(name, sub, pctValue, amount, weight, className = "") {
    return `<div class="b-result ${className}">
      <div class="b-result-name"><span>${name}</span>${
        sub ? `<small>${sub}</small>` : ""
      }</div>
      <div class="b-result-values"><span class="b-result-pct">${pct(
        pctValue,
      )}</span>${measures(amount, weight)}</div>
    </div>`;
  }

  function bReadout(c) {
    const widths = stackWidths(c);
    return `<section class="b-readout">
      <div class="b-readout-head">
        <span class="b-panel-title">Mix readout</span>
        <span class="b-panel-title">${c.flavors.length} ${
          c.flavors.length === 1 ? "flavor" : "flavors"
        }</span>
      </div>
      <div class="b-readout-top">
        <div>
          <div class="b-big">${fmt(c.targetAmount)}<small>mL</small></div>
          <div class="b-readout-stat">Batch volume</div>
        </div>
        <div class="b-readout-stat"><strong>${
          c.showNic ? `${fmt(c.targetStrength)}mg/mL` : "0mg/mL"
        }</strong>${c.showNic ? "Target strength" : "Nicotine-free"}</div>
        <div class="b-readout-stat"><strong>${fmt(c.targetPg)} / ${fmt(
          c.targetVg,
        )}</strong>PG / VG</div>
      </div>
      <div class="b-stack" aria-hidden="true">
        <span class="b-stack-nic" style="width:${widths[0]}%"></span>
        <span class="b-stack-pg" style="width:${widths[1]}%"></span>
        <span class="b-stack-vg" style="width:${widths[2]}%"></span>
        <span class="b-stack-flavor" style="width:${widths[3]}%"></span>
      </div>
      <div class="b-results">
        ${
          c.showNic
            ? bResultRow(
                "Nicotine",
                `${fmt(c.nicStrength)}mg · ${fmt(c.nicPg)}/${fmt(c.nicVg)}`,
                c.nicPct,
                c.nic.amount,
                c.nic.weight,
                c.nicInvalid ? "invalid" : "",
              )
            : ""
        }
        ${bResultRow(
          "Propylene glycol",
          "Carrier",
          c.pgPct,
          c.pgRequired,
          c.pgWeight,
          c.pgInvalid ? "invalid" : "",
        )}
        ${bResultRow(
          "Vegetable glycerin",
          "Carrier",
          c.vgPct,
          c.vgRequired,
          c.vgWeight,
          c.vgInvalid ? "invalid" : "",
        )}
        ${c.flavors
          .map((flavor) =>
            bResultRow(
              esc(flavor.name || "Untitled flavor"),
              `Base ${fmt(flavor.pg)}/${fmt(flavor.vg)}`,
              flavor.percentage,
              flavor.amount,
              flavor.weight,
              flavor.invalid ? "invalid" : "",
            ),
          )
          .join("")}
      </div>
      ${
        c.error
          ? `<div class="b-error">${icon("alert")}<span>${esc(
              c.error,
            )}</span></div>`
          : ""
      }
    </section>`;
  }

  function bFlavorPanel(c) {
    return `<section class="b-panel b-flavors">
      <div class="b-panel-head">
        <span class="b-panel-title">Flavor inputs</span>
        <span class="b-panel-title">${c.flavors.length} rows</span>
      </div>
      ${c.flavors.map((flavor, index) => bFlavorRow(flavor, index)).join("")}
      <button type="button" class="b-add" data-action="add-flavor">${icon(
        "plus",
      )} Add flavor</button>
    </section>`;
  }

  function bFlavorRow(flavor, index) {
    const open = Boolean(state.calc.flavorOpen[index]);
    return `<div class="b-flavor">
      <div class="b-flavor-main">
        <span class="b-flavor-index">${String(index + 1).padStart(2, "0")}</span>
        <input class="b-flavor-name" type="text" maxlength="60" data-field="flavor-name-${index}" data-focus="flavor-name-${index}" value="${escAttr(
          flavor.name,
        )}" aria-label="Flavor ${index + 1} name" />
        <div class="b-flavor-pct">
          <div class="b-num-wrap">
            <input class="b-num small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="flavor-pct-${index}" data-focus="flavor-pct-${index}" value="${escAttr(
              flavor.pct,
            )}" aria-label="Flavor ${index + 1} percentage" />
            <span class="b-unit">%</span>
          </div>
          <div class="b-steppers">
            ${stepButton("B", "flavor", "pct", -0.5, `Decrease flavor ${index + 1} percentage`, index)}
            ${stepButton("B", "flavor", "pct", 0.5, `Increase flavor ${index + 1} percentage`, index)}
          </div>
        </div>
        <div class="b-flavor-actions">
          <button type="button" class="b-icon-btn" data-action="toggle-flavor" data-index="${index}" aria-label="Configure flavor ${
            index + 1
          }" aria-expanded="${open}">${icon("sliders")}</button>
          <button type="button" class="b-icon-btn danger" data-action="remove-flavor" data-index="${index}" aria-label="Delete flavor ${
            index + 1
          }">${icon("trash")}</button>
        </div>
      </div>
      ${
        open
          ? `<div class="b-flavor-config">
              <span class="b-label">Base PG / VG</span>
              <div class="b-num-wrap">
                <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-pg-${index}" data-focus="flavor-pg-${index}" value="${escAttr(
                flavor.pg,
              )}" aria-label="Flavor ${index + 1} base PG percentage" />
                <span class="b-slash">/</span>
                <input class="b-num small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-vg-${index}" data-focus="flavor-vg-${index}" value="${escAttr(
                flavor.vg,
              )}" aria-label="Flavor ${index + 1} base VG percentage" />
                <div class="b-steppers">
                  ${stepButton("B", "flavor", "pg", -5, `Decrease flavor ${index + 1} base PG`, index)}
                  ${stepButton("B", "flavor", "pg", 5, `Increase flavor ${index + 1} base PG`, index)}
                </div>
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function bProviderButtons() {
    return `<div class="b-provider-row">
      <button type="button" class="b-provider" data-action="sign-in-provider" data-provider="google"><img src="assets/google-logo.svg" alt="" />Continue with Google</button>
      <button type="button" class="b-provider" data-action="sign-in-provider" data-provider="twitter"><img src="assets/x-logo.svg" alt="" />Continue with X</button>
      <button type="button" class="b-provider" data-action="nav" data-page="signin">${icon(
        "mail",
      )}Continue with email</button>
    </div>`;
  }

  function bSavePanel(c) {
    return `<section class="b-panel">
      <div class="b-panel-head">
        <span class="b-panel-title">Save recipe</span>
        <span class="b-panel-title">${state.user ? "Account" : "Guest"}</span>
      </div>
      ${
        state.user
          ? `<div class="b-save">
              <div class="b-save-label">${
                state.calc.editingId ? "Update recipe" : "Recipe title"
              }</div>
              <input class="b-input" type="text" data-field="recipe-title" data-focus="recipe-title" value="${escAttr(
                state.calc.title,
              )}" placeholder="Recipe title" aria-label="Recipe title" />
              <button type="button" class="b-btn full" data-action="save-recipe" style="margin-top: 10px"${
                c.error ? " disabled" : ""
              }>${icon("save")} ${
                state.calc.editingId ? "Save changes" : "Save recipe"
              }</button>
              <p class="b-save-note">${
                state.calc.editingId
                  ? "Changes replace the saved recipe."
                  : "Stored privately in your recipe list."
              }</p>
            </div>`
          : state.showSaveAuth
            ? `<div class="b-save"><div class="b-save-label">Sign in to save</div>${bProviderButtons()}</div>`
            : `<div class="b-save"><button type="button" class="b-btn full" data-action="show-save-auth">${icon(
                "user",
              )} Sign in to save</button><p class="b-save-note">The calculator stays available without an account.</p></div>`
      }
    </section>`;
  }

  function bHome() {
    const c = compute();
    const editing = Boolean(state.calc.editingId);
    const title = editing
      ? state.calc.title || "Untitled recipe"
      : "New batch";
    return `${bPageHead(
      esc(title),
      editing
        ? "Edit the recipe, then save your changes."
        : "Set a target. The readout updates as you work.",
      `Units / ${unitsLabel()}<br /><a href="${pageHref(
        "settings",
      )}" data-action="nav" data-page="settings">Defaults</a>`,
    )}
    <div class="b-workbench">
      <div class="b-col-left">
        ${bTargetPanel(c)}
        ${bSavePanel(c)}
      </div>
      <div>
        ${bReadout(c)}
        ${bFlavorPanel(c)}
      </div>
    </div>`;
  }

  function bRecipes() {
    const recipes = sortedRecipes();
    return `${bPageHead(
      "Saved recipes",
      "Open a recipe to load it into the calculator, or delete what you no longer need.",
      `${recipes.length} stored`,
    )}
    <div class="b-toolbar">
      <div class="b-sort" aria-label="Sort recipes">
        <button type="button" data-action="sort" data-sort="date" class="${
          state.sort === "date" ? "active" : ""
        }">Last updated</button>
        <button type="button" data-action="sort" data-sort="title" class="${
          state.sort === "title" ? "active" : ""
        }">Title</button>
      </div>
      <span class="b-panel-title">${recipes.length} rows</span>
    </div>
    ${
      recipes.length
        ? `<div class="b-recipe-list">${recipes
            .map(
              (recipe, index) => `<div class="b-recipe-row">
                <span class="b-recipe-index">${String(index + 1).padStart(
                  2,
                  "0",
                )}</span>
                <button type="button" class="b-recipe-title" data-action="open-recipe" data-id="${
                  recipe._id
                }">${esc(recipe.name)}</button>
                <span class="b-recipe-date">${formatDate(
                  recipe.updatedAt,
                )}</span>
                <button type="button" class="b-icon-btn danger" data-action="ask-delete-recipe" data-id="${
                  recipe._id
                }" aria-label="Delete ${escAttr(recipe.name)}">${icon(
                  "trash",
                )}</button>
              </div>`,
            )
            .join("")}</div>`
        : `<div class="b-empty">No saved recipes. Mix a batch and save it to start the library.</div>`
    }`;
  }

  function bSettings() {
    const settings = state.settings;
    return `${bPageHead(
      "Settings",
      "Defaults for every new batch. The current batch is untouched until you start another one.",
      `Units / ${unitsLabel()}`,
    )}
    <div class="b-settings-grid">
      <section class="b-settings-panel">
        <div class="b-panel-head"><span class="b-panel-title">Appearance</span><span class="b-panel-title">Display</span></div>
        <div class="b-set-row">
          <label for="b-units">Mixing units<small>Volume, weight, or both.</small></label>
          <select id="b-units" class="b-select" data-change="settings-units">
            <option value="both" ${selected("both", settings.units)}>Both</option>
            <option value="volume" ${selected("volume", settings.units)}>Volume (mL)</option>
            <option value="weight" ${selected("weight", settings.units)}>Weight (g)</option>
          </select>
        </div>
      </section>

      <section class="b-settings-panel">
        <div class="b-panel-head"><span class="b-panel-title">Target defaults</span><span class="b-panel-title">New batch</span></div>
        <div class="b-set-row">
          <label>Default base<small>Target PG / VG.</small></label>
          ${bRatioSet(
            "settings-pg",
            "settings-vg",
            settings.base,
            "settings-target",
            "default target",
          )}
        </div>
        <div class="b-set-row">
          <label>Default strength<small>Target nicotine.</small></label>
          <div class="b-num-wrap">
            <input class="b-num small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-strength" data-focus="settings-strength" value="${escAttr(
              settings.strength,
            )}" aria-label="Default target nicotine strength" />
            <span class="b-unit">mg/mL</span>
            <div class="b-steppers">
              ${stepButton("B", "settings-target", "strength", -1, "Decrease default target strength")}
              ${stepButton("B", "settings-target", "strength", 1, "Increase default target strength")}
            </div>
          </div>
        </div>
        <div class="b-set-row">
          <label>Default amount<small>Batch volume.</small></label>
          <div class="b-num-wrap">
            <input class="b-num small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-amount" data-focus="settings-amount" value="${escAttr(
              settings.amount,
            )}" aria-label="Default target amount" />
            <span class="b-unit">mL</span>
            <div class="b-steppers">
              ${stepButton("B", "settings-target", "amount", -10, "Decrease default target amount")}
              ${stepButton("B", "settings-target", "amount", 10, "Increase default target amount")}
            </div>
          </div>
        </div>
      </section>

      <section class="b-settings-panel">
        <div class="b-panel-head"><span class="b-panel-title">Nicotine</span><span class="b-panel-title">Ingredients</span></div>
        <div class="b-set-row">
          <label>Zero nicotine mode<small>Hide nicotine controls.</small></label>
          <button type="button" class="b-toggle" role="switch" aria-checked="${
            settings.zeroNicotineMode
          }" aria-label="Toggle zero nicotine mode" data-action="toggle-zero"></button>
        </div>
        <div class="b-set-row">
          <label>Default strength<small>Undiluted base.</small></label>
          <div class="b-num-wrap">
            <input class="b-num small" type="number" min="0" max="1000" inputmode="numeric" data-field="settings-nic-strength" data-focus="settings-nic-strength" value="${escAttr(
              settings.nicotine.strength,
            )}" aria-label="Default nicotine base strength" />
            <span class="b-unit">mg/mL</span>
            <div class="b-steppers">
              ${stepButton("B", "settings-nic", "strength", -5, "Decrease default nicotine base strength")}
              ${stepButton("B", "settings-nic", "strength", 5, "Increase default nicotine base strength")}
            </div>
          </div>
        </div>
        <div class="b-set-row">
          <label>Default base<small>Nicotine PG / VG.</small></label>
          ${bRatioSet(
            "settings-nic-pg",
            "settings-nic-vg",
            settings.nicotine.base,
            "settings-nic",
            "default nicotine base",
          )}
        </div>
      </section>

      <section class="b-settings-panel">
        <div class="b-panel-head"><span class="b-panel-title">Flavors</span><span class="b-panel-title">Defaults</span></div>
        <div class="b-set-row">
          <label>Default base<small>Flavor PG / VG.</small></label>
          ${bRatioSet(
            "settings-flavor-pg",
            "settings-flavor-vg",
            settings.flavor.base,
            "settings-flavor",
            "default flavor base",
          )}
        </div>
        <div class="b-set-row">
          <label>Default percentage<small>New flavor starting point.</small></label>
          <div class="b-num-wrap">
            <input class="b-num small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="settings-flavor-pct" data-focus="settings-flavor-pct" value="${escAttr(
              settings.flavor.percentage,
            )}" aria-label="Default flavor percentage" />
            <span class="b-unit">%</span>
            <div class="b-steppers">
              ${stepButton("B", "settings-flavor", "pct", -0.5, "Decrease default flavor percentage")}
              ${stepButton("B", "settings-flavor", "pct", 0.5, "Increase default flavor percentage")}
            </div>
          </div>
        </div>
      </section>

      <div class="b-settings-actions">
        <button type="button" class="b-btn" data-action="save-settings">${icon(
          "save",
        )} Save settings</button>
      </div>
    </div>`;
  }

  function bLinkedRow(provider, name, shared) {
    const logoName = provider === "google" ? "google-logo.svg" : "x-logo.svg";
    return `<div class="b-linked">
      <div class="b-linked-logo"><img src="assets/${logoName}" alt="" /></div>
      <div>
        <p><strong>${name}</strong><br />${shared}</p>
        <button type="button" class="b-btn ghost small" data-action="ask-unlink" data-provider="${provider}">Remove</button>
      </div>
    </div>`;
  }

  function bPasswordForm(user) {
    if (!user.hasPassword) {
      return `<p>Add a password so you can also sign in with email.</p>
        <form class="b-form" data-form="set-password">
          <input class="b-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
          <input class="b-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
          <button type="submit" class="b-btn">Set password</button>
        </form>`;
    }
    return `<p>Keep a password as a fallback sign-in method.</p>
      <form class="b-form" data-form="change-password">
        <input class="b-input" type="password" name="current" placeholder="Current password" aria-label="Current password" autocomplete="current-password" required />
        <input class="b-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
        <input class="b-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
        <button type="submit" class="b-btn">Change password</button>
      </form>`;
  }

  function bAccount() {
    const user = state.user;
    if (!user) {
      state.page = "signin";
      return bAuth();
    }
    return `${bPageHead(
      "My account",
      "Profile, sign-in methods, and account controls.",
      `${state.recipes.length} recipes / ${linkedCount(user)} linked`,
    )}
    <div class="b-account-grid">
      <div class="b-profile">
        <div class="b-avatar-lg">${esc(initials(displayName(user)))}</div>
        <div>
          <h2>${esc(displayName(user))}</h2>
          <p>${providerLabel(user)} / ${esc(user.email)}</p>
        </div>
        <div class="b-profile-stats">
          <button type="button" class="b-stat-link" data-action="nav" data-page="recipes" aria-label="View saved recipes"><strong>${state.recipes.length}</strong><span>Recipes</span></button>
          <div><strong>${linkedCount(user)}</strong><span>Linked</span></div>
        </div>
        <button type="button" class="b-btn ghost small" data-action="sign-out">${icon(
          "logout",
        )} Sign out</button>
      </div>
      <section class="b-account-card">
        <h3>Linked accounts</h3>
        <p>These accounts are linked so you can sign in without a password. You can see the data shared with ejuicr below.</p>
        ${
          user.hasGoogleLinked
            ? bLinkedRow(
                "google",
                "Google",
                "Display name, email, profile picture.",
              )
            : ""
        }
        ${
          user.hasTwitterLinked
            ? bLinkedRow(
                "twitter",
                "X",
                "Handle, display name, email, profile picture.",
              )
            : ""
        }
        ${
          !user.hasGoogleLinked && !user.hasTwitterLinked
            ? `<p>No linked accounts.</p>`
            : ""
        }
      </section>
      <section class="b-account-card">
        <h3>${user.hasPassword ? "Change password" : "Set a password"}</h3>
        ${bPasswordForm(user)}
      </section>
      <section class="b-account-card b-danger b-span">
        <h3>Delete account</h3>
        <p>Permanently delete your account, profile, saved recipes, and settings. <strong>This cannot be undone.</strong></p>
        <button type="button" class="b-btn" data-action="ask-delete-account">${icon(
          "trash",
        )} Delete account</button>
      </section>
    </div>`;
  }

  function bAuth() {
    const view = state.page;
    const isSignin = view === "signin";
    const isSignup = view === "signup";
    const title = isSignin
      ? "Welcome back"
      : isSignup
        ? "Create an account"
        : "Reset password";
    const lede = isSignin
      ? "Sign in to save recipes and keep your defaults."
      : isSignup
        ? "Save recipes and defaults across visits. No ads, no trackers."
        : "Enter the email on your account and we will send a reset link.";
    return `<div class="b-auth-wrap">
      <div class="b-auth-panel">
        <div class="b-auth-head">
          ${bBrand()}
          <h1>${title}</h1>
          <p>${lede}</p>
        </div>
        <div class="b-auth-body">
          ${state.authError ? `<div class="b-auth-error">${esc(state.authError)}</div>` : ""}
          ${state.authNotice ? `<div class="b-auth-notice">${esc(state.authNotice)}</div>` : ""}
          ${
            isSignin
              ? `${bProviderButtons()}<div class="b-auth-divider">or use email</div>
                <form class="b-form" data-form="signin">
                  <input class="b-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                  <input class="b-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required />
                  <button type="submit" class="b-btn full">Sign in</button>
                </form>
                <div class="b-auth-links"><button type="button" data-action="nav" data-page="reset">Forgot password?</button><button type="button" data-action="nav" data-page="signup">Create an account</button></div>`
              : isSignup
                ? `<form class="b-form" data-form="signup">
                    <input class="b-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                    <input class="b-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="new-password" required />
                    <input class="b-input" type="password" name="confirm" placeholder="Confirm password" aria-label="Confirm password" autocomplete="new-password" required />
                    <button type="submit" class="b-btn full">Create account</button>
                  </form>
                  <div class="b-auth-links"><span>Already have an account?</span><button type="button" data-action="nav" data-page="signin">Sign in</button></div>`
                : `<form class="b-form" data-form="reset">
                    <input class="b-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                    <button type="submit" class="b-btn full">Send reset link</button>
                  </form>
                  <div class="b-auth-links"><button type="button" data-action="nav" data-page="signin">Back to sign in</button></div>`
          }
        </div>
      </div>
    </div>`;
  }

  function bProse(page) {
    return `<div class="b-prose">${staticContent(page)}</div>`;
  }

  function renderB() {
    const page = state.page;
    let content = "";
    let active = NAV_ITEMS.some((item) => item.key === page) ? page : "";
    switch (page) {
      case "home":
        content = bHome();
        break;
      case "recipes":
        content = bRecipes();
        break;
      case "settings":
        content = bSettings();
        break;
      case "account":
        content = bAccount();
        break;
      case "signin":
      case "signup":
      case "reset":
        content = bAuth();
        active = "account";
        break;
      case "about":
      case "help":
      case "contribute":
      case "terms":
      case "privacy":
        content = bProse(page);
        active = "";
        break;
      default:
        content = bHome();
        active = "home";
    }
    return `<div class="b-shell">
      ${bRail(active)}
      ${bTopbar()}
      <main class="b-main">${content}${bFooter()}</main>
      ${bMobileNav(active)}
    </div>`;
  }

  /* ------------------------------------------------------------
     VARIANT C — Pour / poster studio
     ------------------------------------------------------------ */

  function cBrand() {
    return `<a class="c-brand" href="${pageHref(
      "home",
    )}" data-action="nav" data-page="home" aria-label="ejuicr home">${logo(
      "c",
    )}</a>`;
  }

  function cAuthAction() {
    if (state.user) {
      return `<button type="button" class="c-signout" data-action="sign-out" aria-label="Sign out" title="Sign out">${icon(
        "logout",
      )}</button>`;
    }
    if (isAuthPage(state.page)) return "";
    return `<button type="button" class="c-btn small" data-action="nav" data-page="signin">Sign in</button>`;
  }

  function cRail(active) {
    return `<aside class="c-rail">
      ${cBrand()}
      <nav class="c-nav" aria-label="Primary">${NAV_ITEMS.map(
        (item) =>
          `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
            item.key
          }" class="${active === item.key ? "active" : ""}" aria-label="${
            item.label
          }">${icon(item.icon)}<span>${item.label}</span></a>`,
      ).join("")}</nav>
      <div class="c-rail-foot">
        ${
          state.user
            ? `<button type="button" class="c-user" data-action="nav" data-page="account" aria-label="Account: ${escAttr(
                displayName(state.user),
              )}"><span class="c-avatar">${esc(
                initials(displayName(state.user)),
              )}</span></button>${cAuthAction()}`
            : isAuthPage(state.page)
              ? `<button type="button" class="c-btn small full" data-action="nav" data-page="home">Back</button>`
              : `<button type="button" class="c-btn small full" data-action="nav" data-page="signin">Sign in</button>`
        }
      </div>
    </aside>`;
  }

  function cTopbar() {
    return `<header class="c-topbar">${cBrand()}${cAuthAction()}</header>`;
  }

  function cBottomNav(active) {
    return `<nav class="c-mobile-nav" aria-label="Primary">${NAV_ITEMS.map(
      (item) =>
        `<a href="${pageHref(item.key)}" data-action="nav" data-page="${
          item.key
        }" aria-label="${item.label}" class="${
          active === item.key ? "active" : ""
        }">${icon(item.icon)}<span>${item.label}</span></a>`,
    ).join("")}</nav>`;
  }

  function cFooter() {
    return `<footer class="c-foot">
      <div class="c-foot-links">
        <a href="${pageHref("about")}" data-action="nav" data-page="about">About</a>
        <a href="${pageHref("help")}" data-action="nav" data-page="help">Help</a>
        <a href="${pageHref("contribute")}" data-action="nav" data-page="contribute">Contribute</a>
        <a href="https://www.jimfarrugia.com.au" target="_blank" rel="noreferrer">Jim Farrugia</a>
        <a href="https://www.twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>
      </div>
      <div class="c-foot-right">
        <a href="${pageHref("terms")}" data-action="nav" data-page="terms">Terms</a>
        <a href="${pageHref("privacy")}" data-action="nav" data-page="privacy">Privacy</a>
        <img class="c-footer-logo" src="assets/logo-gray.svg" alt="ejuicr" />
      </div>
    </footer>`;
  }

  function cPageHead(title, sub, aside = "") {
    return `<header class="c-page-head">
      <div>
        <h1 class="c-h1">${title}</h1>
        ${sub ? `<p class="c-sub">${sub}</p>` : ""}
      </div>
      ${aside ? `<div class="c-page-aside">${aside}</div>` : ""}
    </header>`;
  }

  function cRatioSet(pgField, vgField, obj, scope, ariaPrefix) {
    return `<div>
      <div class="c-ratio-inputs">
        <label>PG
          <span class="c-ratio-input">
            <input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="${pgField}" data-focus="${pgField}" value="${escAttr(
              obj.pg,
            )}" aria-label="${escAttr(ariaPrefix)} PG percentage" />
            <span class="c-unit">%</span>
          </span>
        </label>
        <label>VG
          <span class="c-ratio-input">
            <input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="${vgField}" data-focus="${vgField}" value="${escAttr(
              obj.vg,
            )}" aria-label="${escAttr(ariaPrefix)} VG percentage" />
            <span class="c-unit">%</span>
          </span>
        </label>
      </div>
      <div class="c-steppers c-ratio-steps">
        ${stepButton("C", scope, "pg", -5, `Decrease ${ariaPrefix} PG`)}
        ${stepButton("C", scope, "pg", 5, `Increase ${ariaPrefix} PG`)}
      </div>
    </div>`;
  }

  function cNicDisclosure(c) {
    const nic = state.calc.nic;
    const open = Boolean(state.calc.nicOpen);
    return `<div class="c-disclosure ${open ? "open" : ""}">
      <button type="button" class="c-disclosure-toggle" data-action="toggle-nic">${icon(
        "sliders",
      )} Nicotine base <span>${fmt(c.nicStrength)}mg/mL · ${fmt(
        c.nicPg,
      )}/${fmt(c.nicVg)}</span>${icon("chevron-down")}</button>
      ${
        open
          ? `<div class="c-disclosure-body">
              <div>
                <label class="c-field-label">Strength</label>
                <div class="c-ratio-input">
                  <input class="c-num small" type="number" min="0" max="1000" inputmode="numeric" data-field="nic-strength" data-focus="nic-strength" value="${escAttr(
                    nic.strength,
                  )}" aria-label="Nicotine base strength" />
                  <span class="c-unit">mg/mL</span>
                </div>
                <div class="c-steppers c-ratio-steps">
                  ${stepButton("C", "nic", "strength", -5, "Decrease nicotine base strength")}
                  ${stepButton("C", "nic", "strength", 5, "Increase nicotine base strength")}
                </div>
              </div>
              <div>
                <label class="c-field-label">Base PG / VG</label>
                <div class="c-ratio-inputs">
                  <label>PG<span class="c-ratio-input"><input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-pg" data-focus="nic-pg" value="${escAttr(
                    nic.pg,
                  )}" aria-label="Nicotine base PG percentage" /><span class="c-unit">%</span></span></label>
                  <label>VG<span class="c-ratio-input"><input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="nic-vg" data-focus="nic-vg" value="${escAttr(
                    nic.vg,
                  )}" aria-label="Nicotine base VG percentage" /><span class="c-unit">%</span></span></label>
                </div>
                <div class="c-steppers c-ratio-steps">
                  ${stepButton("C", "nic", "pg", -5, "Decrease nicotine base PG")}
                  ${stepButton("C", "nic", "pg", 5, "Increase nicotine base PG")}
                </div>
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function cLayer(name, value, className) {
    if (value <= 0) return "";
    return `<span class="c-liquid-layer ${className}" style="flex-grow:${value}"></span>`;
  }

  function cHero(c) {
    const widths = stackWidths(c);
    return `<section class="c-hero">
      <div class="c-hero-copy">
        <div class="c-total"><span class="c-total-num">${fmt(
          c.targetAmount,
        )}</span><span class="c-total-unit">mL</span></div>
        <div class="c-hero-meta">
          <span>${c.showNic ? `${fmt(c.targetStrength)}mg/mL` : "0mg/mL"}</span>
          <span>${fmt(c.targetPg)}/${fmt(c.targetVg)} PG/VG</span>
        </div>
        <div class="c-pour-bar" aria-hidden="true">
          <span class="c-pour-nic" style="width:${widths[0]}%"></span>
          <span class="c-pour-pg" style="width:${widths[1]}%"></span>
          <span class="c-pour-vg" style="width:${widths[2]}%"></span>
          <span class="c-pour-flavor" style="width:${widths[3]}%"></span>
        </div>
      </div>
      <div class="c-bottle" aria-hidden="true">
        <span class="c-bottle-cap"></span>
        <div class="c-bottle-body">
          <div class="c-liquid">
            ${cLayer("Flavors", widths[3], "flavor")}
            ${cLayer("VG", widths[2], "vg")}
            ${cLayer("PG", widths[1], "pg")}
            ${cLayer("Nicotine", widths[0], "nic")}
          </div>
          <span class="c-bottle-glint"></span>
        </div>
      </div>
    </section>`;
  }

  function cControls(c) {
    return `<section class="c-controls">
      <div class="c-section-head">
        <span class="c-section-index">01</span>
        <h2>Target</h2>
      </div>
      <div class="c-control-grid">
        <div class="c-control">
          <span class="c-control-label">PG / VG</span>
          <div class="c-control-ratio">
            <input class="c-num" type="number" min="0" max="100" inputmode="numeric" data-field="target-pg" data-focus="target-pg" value="${escAttr(
              state.calc.pg,
            )}" aria-label="Target PG percentage" />
            <span class="c-slash">/</span>
            <input class="c-num" type="number" min="0" max="100" inputmode="numeric" data-field="target-vg" data-focus="target-vg" value="${escAttr(
              state.calc.vg,
            )}" aria-label="Target VG percentage" />
            <div class="c-steppers">
              ${stepButton("C", "target", "pg", -5, "Decrease target PG")}
              ${stepButton("C", "target", "pg", 5, "Increase target PG")}
            </div>
          </div>
          <div class="c-ratio-bar" aria-hidden="true"><span class="c-ratio-pg" style="width:${Math.max(
            0,
            Math.min(100, c.targetPg),
          )}%"></span><span class="c-ratio-vg" style="width:${Math.max(
            0,
            Math.min(100, c.targetVg),
          )}%"></span></div>
        </div>
        ${
          c.showNic
            ? `<div class="c-control">
                <span class="c-control-label">Strength</span>
                <div class="c-control-value">
                  <input class="c-num" type="number" min="0" step="any" inputmode="decimal" data-field="target-strength" data-focus="target-strength" value="${escAttr(
                    state.calc.strength,
                  )}" aria-label="Target nicotine strength" />
                  <span class="c-unit">mg/mL</span>
                  <div class="c-steppers">
                    ${stepButton("C", "target", "strength", -1, "Decrease target strength")}
                    ${stepButton("C", "target", "strength", 1, "Increase target strength")}
                  </div>
                </div>
              </div>`
            : ""
        }
        <div class="c-control">
          <span class="c-control-label">Amount</span>
          <div class="c-control-value">
            <input class="c-num" type="number" min="0" step="any" inputmode="decimal" data-field="target-amount" data-focus="target-amount" value="${escAttr(
              state.calc.amount,
            )}" aria-label="Target amount" />
            <span class="c-unit">mL</span>
            <div class="c-steppers">
              ${stepButton("C", "target", "amount", -10, "Decrease target amount")}
              ${stepButton("C", "target", "amount", 10, "Increase target amount")}
            </div>
          </div>
        </div>
      </div>
      ${c.showNic ? cNicDisclosure(c) : ""}
    </section>`;
  }

  function cIngredientRow(name, sub, pctValue, amount, weight, className) {
    return `<div class="c-ingredient ${className}">
      <span class="c-dot" aria-hidden="true"></span>
      <div class="c-ingredient-name"><span>${name}</span>${
        sub ? `<small>${sub}</small>` : ""
      }</div>
      <div class="c-ingredient-values"><span class="c-result-pct">${pct(
        pctValue,
      )}</span>${measures(amount, weight)}</div>
    </div>`;
  }

  function cIngredients(c) {
    return `<section class="c-ingredients">
      <div class="c-section-head">
        <span class="c-section-index">02</span>
        <h2>Ingredients</h2>
      </div>
      <div class="c-ingredient-grid">
        ${
          c.showNic
            ? cIngredientRow(
                "Nicotine",
                `${fmt(c.nicStrength)}mg · ${fmt(c.nicPg)}/${fmt(c.nicVg)}`,
                c.nicPct,
                c.nic.amount,
                c.nic.weight,
                `nic${c.nicInvalid ? " invalid" : ""}`,
              )
            : ""
        }
        ${cIngredientRow(
          "Propylene glycol",
          "Carrier",
          c.pgPct,
          c.pgRequired,
          c.pgWeight,
          `pg${c.pgInvalid ? " invalid" : ""}`,
        )}
        ${cIngredientRow(
          "Vegetable glycerin",
          "Carrier",
          c.vgPct,
          c.vgRequired,
          c.vgWeight,
          `vg${c.vgInvalid ? " invalid" : ""}`,
        )}
        ${c.flavors
          .map((flavor) =>
            cIngredientRow(
              esc(flavor.name || "Untitled flavor"),
              `Base ${fmt(flavor.pg)}/${fmt(flavor.vg)}`,
              flavor.percentage,
              flavor.amount,
              flavor.weight,
              `flavor${flavor.invalid ? " invalid" : ""}`,
            ),
          )
          .join("")}
      </div>
      ${
        c.error
          ? `<div class="c-error">${icon("alert")}<span>${esc(
              c.error,
            )}</span></div>`
          : ""
      }
    </section>`;
  }

  function cFlavorRow(flavor, index) {
    const open = Boolean(state.calc.flavorOpen[index]);
    return `<div class="c-flavor">
      <div class="c-flavor-main">
        <input class="c-flavor-name" type="text" maxlength="60" data-field="flavor-name-${index}" data-focus="flavor-name-${index}" value="${escAttr(
          flavor.name,
        )}" aria-label="Flavor ${index + 1} name" />
        <div class="c-flavor-pct">
          <div class="c-ratio-input">
            <input class="c-num small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="flavor-pct-${index}" data-focus="flavor-pct-${index}" value="${escAttr(
              flavor.pct,
            )}" aria-label="Flavor ${index + 1} percentage" />
            <span class="c-unit">%</span>
          </div>
          <div class="c-steppers">
            ${stepButton("C", "flavor", "pct", -0.5, `Decrease flavor ${index + 1} percentage`, index)}
            ${stepButton("C", "flavor", "pct", 0.5, `Increase flavor ${index + 1} percentage`, index)}
          </div>
        </div>
        <div class="c-flavor-actions">
          <button type="button" class="c-icon-btn" data-action="toggle-flavor" data-index="${index}" aria-label="Configure flavor ${
            index + 1
          }" aria-expanded="${open}">${icon("sliders")}</button>
          <button type="button" class="c-icon-btn danger" data-action="remove-flavor" data-index="${index}" aria-label="Delete flavor ${
            index + 1
          }">${icon("trash")}</button>
        </div>
      </div>
      ${
        open
          ? `<div class="c-flavor-config">
              <label class="c-field-label">Base PG / VG</label>
              <div class="c-ratio-inputs">
                <label>PG<span class="c-ratio-input"><input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-pg-${index}" data-focus="flavor-pg-${index}" value="${escAttr(
                flavor.pg,
              )}" aria-label="Flavor ${index + 1} base PG percentage" /><span class="c-unit">%</span></span></label>
                <label>VG<span class="c-ratio-input"><input class="c-num small" type="number" min="0" max="100" inputmode="numeric" data-field="flavor-vg-${index}" data-focus="flavor-vg-${index}" value="${escAttr(
                flavor.vg,
              )}" aria-label="Flavor ${index + 1} base VG percentage" /><span class="c-unit">%</span></span></label>
              </div>
              <div class="c-steppers c-ratio-steps">
                ${stepButton("C", "flavor", "pg", -5, `Decrease flavor ${index + 1} base PG`, index)}
                ${stepButton("C", "flavor", "pg", 5, `Increase flavor ${index + 1} base PG`, index)}
              </div>
            </div>`
          : ""
      }
    </div>`;
  }

  function cFlavors(c) {
    return `<section class="c-flavors">
      <div class="c-section-head">
        <span class="c-section-index">03</span>
        <h2>Flavors</h2>
        <span class="c-section-count">${c.flavors.length}</span>
      </div>
      ${c.flavors.map((flavor, index) => cFlavorRow(flavor, index)).join("")}
      <button type="button" class="c-add" data-action="add-flavor">${icon(
        "plus",
      )} Add flavor</button>
    </section>`;
  }

  function cProviderButtons() {
    return `<div class="c-provider-row">
      <button type="button" class="c-provider" data-action="sign-in-provider" data-provider="google"><img src="assets/google-logo.svg" alt="" />Continue with Google</button>
      <button type="button" class="c-provider dark" data-action="sign-in-provider" data-provider="twitter"><img src="assets/x-logo.svg" alt="" />Continue with X</button>
      <button type="button" class="c-provider" data-action="nav" data-page="signin">${icon(
        "mail",
      )}Continue with email</button>
    </div>`;
  }

  function cSaveBlock(c) {
    if (!state.user) {
      if (!state.showSaveAuth) {
        return `<section class="c-save">
          <button type="button" class="c-btn full" data-action="show-save-auth">${icon(
            "user",
          )} Sign in to save this batch</button>
          <p class="c-save-note">The calculator works without an account. Sign in to keep recipes and defaults.</p>
        </section>`;
      }
      return `<section class="c-save">
        <label>Sign in to save</label>
        ${cProviderButtons()}
        <p class="c-save-note">Your current batch stays exactly as it is.</p>
      </section>`;
    }
    return `<section class="c-save">
      <label for="c-recipe-title">${
        state.calc.editingId ? "Update this recipe" : "Name this batch"
      }</label>
      <div class="c-save-row">
        <input class="c-input" id="c-recipe-title" type="text" data-field="recipe-title" data-focus="recipe-title" value="${escAttr(
          state.calc.title,
        )}" placeholder="Recipe title" />
        <button type="button" class="c-btn" data-action="save-recipe"${
          c.error ? " disabled" : ""
        }>${icon("save")} ${
          state.calc.editingId ? "Save changes" : "Save recipe"
        }</button>
      </div>
      <p class="c-save-note">${
        state.calc.editingId
          ? "Changes replace the saved recipe."
          : "Saved to your private recipe list."
      }</p>
    </section>`;
  }

  function cHome() {
    const c = compute();
    const editing = Boolean(state.calc.editingId);
    const title = editing
      ? state.calc.title || "Untitled recipe"
      : "New batch";
    return `${cPageHead(
      esc(title),
      editing
        ? "Edit the recipe, then save your changes."
        : "Set the target. The bottle fills as you work.",
      `<span>${unitsLabel()}</span> · <a href="${pageHref(
        "settings",
      )}" data-action="nav" data-page="settings">Defaults</a>`,
    )}
    <div class="c-home">
      ${cHero(c)}
      ${cControls(c)}
      ${cIngredients(c)}
      ${cFlavors(c)}
      ${cSaveBlock(c)}
    </div>`;
  }

  function cRecipes() {
    const recipes = sortedRecipes();
    return `${cPageHead(
      "Saved recipes",
      "Every recipe in your account, ready to open.",
      `${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}`,
    )}
    <div class="c-toolbar">
      <div class="c-sort" aria-label="Sort recipes">
        <button type="button" data-action="sort" data-sort="date" class="${
          state.sort === "date" ? "active" : ""
        }">Last updated</button>
        <button type="button" data-action="sort" data-sort="title" class="${
          state.sort === "title" ? "active" : ""
        }">Title</button>
      </div>
      <span class="c-count">${recipes.length} total</span>
    </div>
    ${
      recipes.length
        ? `<div class="c-recipe-list">${recipes
            .map(
              (recipe, index) => `<div class="c-recipe-row">
                <span class="c-recipe-index">${String(index + 1).padStart(
                  2,
                  "0",
                )}</span>
                <button type="button" class="c-recipe-title" data-action="open-recipe" data-id="${
                  recipe._id
                }">${esc(recipe.name)}</button>
                <span class="c-recipe-date">${formatDate(
                  recipe.updatedAt,
                )}</span>
                <button type="button" class="c-icon-btn danger" data-action="ask-delete-recipe" data-id="${
                  recipe._id
                }" aria-label="Delete ${escAttr(recipe.name)}">${icon(
                  "trash",
                )}</button>
              </div>`,
            )
            .join("")}</div>`
        : `<div class="c-empty"><strong>Nothing saved yet.</strong>Mix a batch and save it to start your library.</div>`
    }`;
  }

  function cSettings() {
    const settings = state.settings;
    return `${cPageHead(
      "Settings",
      "Defaults for every new batch. Your current batch is untouched until you start another one.",
      `<span>${unitsLabel()}</span>`,
    )}
    <div class="c-settings">
      <section class="c-setting-section">
        <div class="c-section-head"><span class="c-section-index">01</span><h2>Appearance</h2></div>
        <div class="c-setting-row">
          <label for="c-units">Mixing units<small>Volume, weight, or both.</small></label>
          <select id="c-units" class="c-select" data-change="settings-units">
            <option value="both" ${selected("both", settings.units)}>Both</option>
            <option value="volume" ${selected("volume", settings.units)}>Volume (mL)</option>
            <option value="weight" ${selected("weight", settings.units)}>Weight (g)</option>
          </select>
        </div>
      </section>

      <section class="c-setting-section">
        <div class="c-section-head"><span class="c-section-index">02</span><h2>Target defaults</h2></div>
        <div class="c-setting-row">
          <label>Default base<small>Target PG / VG.</small></label>
          ${cRatioSet(
            "settings-pg",
            "settings-vg",
            settings.base,
            "settings-target",
            "default target",
          )}
        </div>
        <div class="c-setting-row">
          <label>Default strength<small>Target nicotine.</small></label>
          <div>
            <div class="c-ratio-input">
              <input class="c-num small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-strength" data-focus="settings-strength" value="${escAttr(
                settings.strength,
              )}" aria-label="Default target nicotine strength" />
              <span class="c-unit">mg/mL</span>
            </div>
            <div class="c-steppers c-ratio-steps">
              ${stepButton("C", "settings-target", "strength", -1, "Decrease default target strength")}
              ${stepButton("C", "settings-target", "strength", 1, "Increase default target strength")}
            </div>
          </div>
        </div>
        <div class="c-setting-row">
          <label>Default amount<small>Batch volume.</small></label>
          <div>
            <div class="c-ratio-input">
              <input class="c-num small" type="number" min="0" step="any" inputmode="decimal" data-field="settings-amount" data-focus="settings-amount" value="${escAttr(
                settings.amount,
              )}" aria-label="Default target amount" />
              <span class="c-unit">mL</span>
            </div>
            <div class="c-steppers c-ratio-steps">
              ${stepButton("C", "settings-target", "amount", -10, "Decrease default target amount")}
              ${stepButton("C", "settings-target", "amount", 10, "Increase default target amount")}
            </div>
          </div>
        </div>
      </section>

      <section class="c-setting-section">
        <div class="c-section-head"><span class="c-section-index">03</span><h2>Nicotine</h2></div>
        <div class="c-setting-row">
          <label>Zero nicotine mode<small>Hide nicotine controls.</small></label>
          <button type="button" class="c-toggle" role="switch" aria-checked="${
            settings.zeroNicotineMode
          }" aria-label="Toggle zero nicotine mode" data-action="toggle-zero"></button>
        </div>
        <div class="c-setting-row">
          <label>Default strength<small>Undiluted base.</small></label>
          <div>
            <div class="c-ratio-input">
              <input class="c-num small" type="number" min="0" max="1000" inputmode="numeric" data-field="settings-nic-strength" data-focus="settings-nic-strength" value="${escAttr(
                settings.nicotine.strength,
              )}" aria-label="Default nicotine base strength" />
              <span class="c-unit">mg/mL</span>
            </div>
            <div class="c-steppers c-ratio-steps">
              ${stepButton("C", "settings-nic", "strength", -5, "Decrease default nicotine base strength")}
              ${stepButton("C", "settings-nic", "strength", 5, "Increase default nicotine base strength")}
            </div>
          </div>
        </div>
        <div class="c-setting-row">
          <label>Default base<small>Nicotine PG / VG.</small></label>
          ${cRatioSet(
            "settings-nic-pg",
            "settings-nic-vg",
            settings.nicotine.base,
            "settings-nic",
            "default nicotine base",
          )}
        </div>
      </section>

      <section class="c-setting-section">
        <div class="c-section-head"><span class="c-section-index">04</span><h2>Flavors</h2></div>
        <div class="c-setting-row">
          <label>Default base<small>Flavor PG / VG.</small></label>
          ${cRatioSet(
            "settings-flavor-pg",
            "settings-flavor-vg",
            settings.flavor.base,
            "settings-flavor",
            "default flavor base",
          )}
        </div>
        <div class="c-setting-row">
          <label>Default percentage<small>New flavor starting point.</small></label>
          <div>
            <div class="c-ratio-input">
              <input class="c-num small" type="number" min="0" max="100" step="any" inputmode="decimal" data-field="settings-flavor-pct" data-focus="settings-flavor-pct" value="${escAttr(
                settings.flavor.percentage,
              )}" aria-label="Default flavor percentage" />
              <span class="c-unit">%</span>
            </div>
            <div class="c-steppers c-ratio-steps">
              ${stepButton("C", "settings-flavor", "pct", -0.5, "Decrease default flavor percentage")}
              ${stepButton("C", "settings-flavor", "pct", 0.5, "Increase default flavor percentage")}
            </div>
          </div>
        </div>
      </section>

      <div class="c-settings-actions">
        <button type="button" class="c-btn" data-action="save-settings">${icon(
          "save",
        )} Save settings</button>
      </div>
    </div>`;
  }

  function cLinkedRow(provider, name, shared) {
    const logoName = provider === "google" ? "google-logo.svg" : "x-logo.svg";
    return `<div class="c-linked">
      <div class="c-linked-logo ${provider === "twitter" ? "dark" : ""}"><img src="assets/${logoName}" alt="" /></div>
      <div>
        <strong>${name}</strong>
        <p>${shared}</p>
        <button type="button" class="c-btn ghost small" data-action="ask-unlink" data-provider="${provider}">Remove</button>
      </div>
    </div>`;
  }

  function cPasswordForm(user) {
    if (!user.hasPassword) {
      return `<p>Add a password so you can also sign in with email.</p>
        <form class="c-form" data-form="set-password">
          <input class="c-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
          <input class="c-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
          <button type="submit" class="c-btn">Set password</button>
        </form>`;
    }
    return `<p>Keep a password as a fallback sign-in method.</p>
      <form class="c-form" data-form="change-password">
        <input class="c-input" type="password" name="current" placeholder="Current password" aria-label="Current password" autocomplete="current-password" required />
        <input class="c-input" type="password" name="password" placeholder="New password" aria-label="New password" autocomplete="new-password" required />
        <input class="c-input" type="password" name="confirm" placeholder="Confirm new password" aria-label="Confirm new password" autocomplete="new-password" required />
        <button type="submit" class="c-btn">Change password</button>
      </form>`;
  }

  function cAccount() {
    const user = state.user;
    if (!user) {
      state.page = "signin";
      return cAuth();
    }
    return `${cPageHead(
      "My account",
      "Profile, sign-in methods, and account controls.",
      `${state.recipes.length} saved ${
        state.recipes.length === 1 ? "recipe" : "recipes"
      }`,
    )}
    <div class="c-profile-band">
      <div class="c-avatar-lg">${esc(initials(displayName(user)))}</div>
      <div class="c-profile-copy">
        <h2>${esc(displayName(user))}</h2>
        <p>${providerLabel(user)} · ${esc(user.email)}</p>
        <button type="button" class="c-btn ghost small" data-action="sign-out">${icon(
          "logout",
        )} Sign out</button>
      </div>
      <div class="c-profile-stats">
        <button type="button" class="c-stat-link" data-action="nav" data-page="recipes" aria-label="View saved recipes"><strong>${state.recipes.length}</strong><span>Recipes</span></button>
        <div><strong>${linkedCount(user)}</strong><span>Linked</span></div>
      </div>
    </div>
    <div class="c-account-sections">
      <section class="c-account-section">
        <h2>Linked accounts</h2>
        <p>These accounts are linked so you can sign in without a password. You can see the data shared with ejuicr below.</p>
        ${
          user.hasGoogleLinked
            ? cLinkedRow(
                "google",
                "Google",
                "Display name, email, profile picture.",
              )
            : ""
        }
        ${
          user.hasTwitterLinked
            ? cLinkedRow(
                "twitter",
                "X",
                "Handle, display name, email, profile picture.",
              )
            : ""
        }
        ${
          !user.hasGoogleLinked && !user.hasTwitterLinked
            ? `<p>No linked accounts.</p>`
            : ""
        }
      </section>
      <section class="c-account-section">
        <h2>${user.hasPassword ? "Change password" : "Set a password"}</h2>
        ${cPasswordForm(user)}
      </section>
      <section class="c-account-section c-danger">
        <h2>Delete account</h2>
        <p>Permanently delete your account, profile, saved recipes, and settings. <strong>This cannot be undone.</strong></p>
        <button type="button" class="c-btn danger" data-action="ask-delete-account">${icon(
          "trash",
        )} Delete account</button>
      </section>
    </div>`;
  }

  function cAuth() {
    const view = state.page;
    const isSignin = view === "signin";
    const isSignup = view === "signup";
    const title = isSignin
      ? "Welcome back"
      : isSignup
        ? "Create an account"
        : "Reset password";
    const lede = isSignin
      ? "Sign in to save recipes, keep your defaults, and pick up where you left off."
      : isSignup
        ? "Save recipes and defaults across visits. No ads, no trackers."
        : "Enter the email on your account and we will send a reset link.";
    return `<div class="c-auth-wrap">
      <div class="c-auth-card">
        <div class="c-auth-brand">${cBrand()}</div>
        <h1>${title}</h1>
        <p class="lede">${lede}</p>
        ${state.authError ? `<div class="c-auth-error">${esc(state.authError)}</div>` : ""}
        ${state.authNotice ? `<div class="c-auth-notice">${esc(state.authNotice)}</div>` : ""}
        ${
          isSignin
            ? `${cProviderButtons()}<div class="c-auth-divider">or use email</div>
              <form class="c-form" data-form="signin">
                <input class="c-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                <input class="c-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="current-password" required />
                <button type="submit" class="c-btn full">Sign in</button>
              </form>
              <div class="c-auth-links"><button type="button" data-action="nav" data-page="reset">Forgot password?</button><button type="button" data-action="nav" data-page="signup">Create an account</button></div>`
            : isSignup
              ? `<form class="c-form" data-form="signup">
                  <input class="c-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                  <input class="c-input" type="password" name="password" placeholder="Password" aria-label="Password" autocomplete="new-password" required />
                  <input class="c-input" type="password" name="confirm" placeholder="Confirm password" aria-label="Confirm password" autocomplete="new-password" required />
                  <button type="submit" class="c-btn full">Create account</button>
                </form>
                <div class="c-auth-links"><span>Already have an account?</span><button type="button" data-action="nav" data-page="signin">Sign in</button></div>`
              : `<form class="c-form" data-form="reset">
                  <input class="c-input" type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                  <button type="submit" class="c-btn full">Send reset link</button>
                </form>
                <div class="c-auth-links"><button type="button" data-action="nav" data-page="signin">Back to sign in</button></div>`
        }
      </div>
    </div>`;
  }

  function cProse(page) {
    return `<div class="c-prose">${staticContent(page)}</div>`;
  }

  function renderC() {
    const page = state.page;
    let content = "";
    let active = NAV_ITEMS.some((item) => item.key === page) ? page : "";
    switch (page) {
      case "home":
        content = cHome();
        break;
      case "recipes":
        content = cRecipes();
        break;
      case "settings":
        content = cSettings();
        break;
      case "account":
        content = cAccount();
        break;
      case "signin":
      case "signup":
      case "reset":
        content = cAuth();
        active = "account";
        break;
      case "about":
      case "help":
      case "contribute":
      case "terms":
      case "privacy":
        content = cProse(page);
        active = "";
        break;
      default:
        content = cHome();
        active = "home";
    }
    return `<div class="c-shell">
      ${cRail(active)}
      ${cTopbar()}
      <main class="c-main">${content}${cFooter()}</main>
      ${cBottomNav(active)}
    </div>`;
  }

  /* ------------------------------------------------------------
     Switcher
     ------------------------------------------------------------ */

  function renderSwitcher() {
    const bar = document.getElementById("prototype-switcher");
    if (!bar) return;
    const index = VARIANT_KEYS.indexOf(state.variant) + 1;
    bar.innerHTML = `<div class="prototype-switcher" role="group" aria-label="Prototype design variant">
      <button type="button" data-switch="-1" aria-label="Previous design variant">${icon(
        "arrow-left",
      )}</button>
      <div class="switcher-center">
        <span class="switcher-kicker">UI prototype</span>
        <span class="switcher-label">${state.variant} · ${VARIANTS[state.variant].name}<span class="switcher-count">${index}/3</span></span>
      </div>
      <button type="button" data-switch="1" aria-label="Next design variant">${icon(
        "arrow-right",
      )}</button>
    </div>`;
  }

  function cycleVariant(direction) {
    const current = VARIANT_KEYS.indexOf(state.variant);
    const next =
      (current + direction + VARIANT_KEYS.length) % VARIANT_KEYS.length;
    state.variant = VARIANT_KEYS[next];
    state.mobileMenu = false;
    syncUrl();
    render();
  }

  /* ------------------------------------------------------------
     Focus + render
     ------------------------------------------------------------ */

  function captureFocus() {
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLElement)) return null;
    const key = active.dataset ? active.dataset.focus : null;
    if (!key) return null;
    const focus = { key, start: null, end: null };
    try {
      if (typeof active.selectionStart === "number") {
        focus.start = active.selectionStart;
        focus.end = active.selectionEnd;
      }
    } catch {
      // number inputs do not expose a selection range
    }
    return focus;
  }

  function restoreFocus(focus) {
    if (!focus) return false;
    const target = document.querySelector(
      `[data-focus="${CSS.escape(focus.key)}"]`,
    );
    if (!target) return false;
    target.focus({ preventScroll: true });
    try {
      if (focus.start !== null && typeof target.setSelectionRange === "function") {
        target.setSelectionRange(focus.start, focus.end);
      }
    } catch {
      // number inputs cannot restore selection
    }
    return true;
  }

  function render(options = {}) {
    const focus = captureFocus();
    const scrollY = window.scrollY;
    document.body.dataset.variant = state.variant;
    document.title = `ejuicr · ${VARIANTS[state.variant].name} prototype`;

    const app = document.getElementById("app");
    if (app) {
      app.innerHTML =
        state.variant === "A" ? renderA() : state.variant === "B" ? renderB() : renderC();
      if (state.modal) app.insertAdjacentHTML("beforeend", renderModal());
    }

    renderSwitcher();
    restoreFocus(focus);
    document.body.style.overflow =
      state.mobileMenu || state.modal ? "hidden" : "";
    if (options.top) {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, scrollY);
    }

    if (state.modal) {
      window.requestAnimationFrame(() => {
        const primary = document.querySelector("[data-modal-primary]");
        if (primary instanceof HTMLElement) primary.focus();
      });
    }
  }

  /* ------------------------------------------------------------
     Input updates
     ------------------------------------------------------------ */

  function normalizeDecimalInput(value, options = {}) {
    if (value === "") return "";
    if (String(value).endsWith(".")) return String(value);
    let parsed = Number(value);
    if (!Number.isFinite(parsed)) return "";
    if (parsed < 0) parsed = 0;
    if (options.max !== undefined && parsed > options.max) parsed = options.max;
    if (options.round) return String(Math.round(parsed));
    return String(round2(parsed));
  }

  function setRatioInput(object, ingredient, raw) {
    const value = clampInt(raw);
    object[ingredient] = String(value);
    object[ingredient === "pg" ? "vg" : "pg"] = String(100 - value);
  }

  function updateField(field, value) {
    if (field === "recipe-title") {
      state.calc.title = value;
      return;
    }

    if (field.startsWith("flavor-name-")) {
      const index = Number(field.slice("flavor-name-".length));
      if (state.calc.flavors[index]) {
        state.calc.flavors[index].name = value.slice(0, 60);
      }
      return;
    }

    if (field.startsWith("flavor-pct-")) {
      const index = Number(field.slice("flavor-pct-".length));
      if (state.calc.flavors[index]) {
        state.calc.flavors[index].pct = normalizeDecimalInput(value, {
          max: 100,
        });
      }
      return;
    }

    if (field.startsWith("flavor-pg-")) {
      const index = Number(field.slice("flavor-pg-".length));
      if (state.calc.flavors[index]) {
        setRatioInput(state.calc.flavors[index], "pg", value);
      }
      return;
    }

    if (field.startsWith("flavor-vg-")) {
      const index = Number(field.slice("flavor-vg-".length));
      if (state.calc.flavors[index]) {
        setRatioInput(state.calc.flavors[index], "vg", value);
      }
      return;
    }

    switch (field) {
      case "target-pg":
        setRatioInput(state.calc, "pg", value);
        return;
      case "target-vg":
        setRatioInput(state.calc, "vg", value);
        return;
      case "target-strength":
        state.calc.strength = normalizeDecimalInput(value);
        return;
      case "target-amount":
        state.calc.amount = normalizeDecimalInput(value);
        return;
      case "nic-pg":
        setRatioInput(state.calc.nic, "pg", value);
        return;
      case "nic-vg":
        setRatioInput(state.calc.nic, "vg", value);
        return;
      case "nic-strength":
        state.calc.nic.strength = normalizeDecimalInput(value, {
          max: 1000,
          round: true,
        });
        return;
      case "settings-pg":
        setRatioInput(state.settings.base, "pg", value);
        return;
      case "settings-vg":
        setRatioInput(state.settings.base, "vg", value);
        return;
      case "settings-strength":
        state.settings.strength = normalizeDecimalInput(value);
        return;
      case "settings-amount":
        state.settings.amount = normalizeDecimalInput(value);
        return;
      case "settings-nic-pg":
        setRatioInput(state.settings.nicotine.base, "pg", value);
        return;
      case "settings-nic-vg":
        setRatioInput(state.settings.nicotine.base, "vg", value);
        return;
      case "settings-nic-strength":
        state.settings.nicotine.strength = normalizeDecimalInput(value, {
          max: 1000,
          round: true,
        });
        return;
      case "settings-flavor-pg":
        setRatioInput(state.settings.flavor.base, "pg", value);
        return;
      case "settings-flavor-vg":
        setRatioInput(state.settings.flavor.base, "vg", value);
        return;
      case "settings-flavor-pct":
        state.settings.flavor.percentage = normalizeDecimalInput(value, {
          max: 100,
        });
        return;
      default:
        return;
    }
  }

  function stepDecimal(object, key, delta, options = {}) {
    let value = num(object[key]) + delta;
    if (options.min !== undefined) value = Math.max(options.min, value);
    if (options.max !== undefined) value = Math.min(options.max, value);
    if (value < 0) value = 0;
    if (options.round) value = Math.round(value);
    else value = round2(value);
    object[key] = String(value);
  }

  function stepRatio(object, ingredient, delta) {
    const current =
      ingredient === "pg" ? num(object.pg) : num(object.vg);
    const value = clampInt(current + delta);
    object[ingredient] = String(value);
    object[ingredient === "pg" ? "vg" : "pg"] = String(100 - value);
  }

  function applyStep(dataset) {
    const scope = dataset.scope;
    const field = dataset.field;
    const delta = Number(dataset.step) || 0;
    const index =
      dataset.index === undefined ? null : Number(dataset.index);

    switch (scope) {
      case "target":
        if (field === "pg" || field === "vg") {
          stepRatio(state.calc, field, delta);
        } else if (field === "strength" || field === "amount") {
          stepDecimal(state.calc, field, delta);
        }
        break;
      case "nic":
        if (field === "pg" || field === "vg") {
          stepRatio(state.calc.nic, field, delta);
        } else if (field === "strength") {
          stepDecimal(state.calc.nic, "strength", delta, {
            round: true,
            max: 1000,
          });
        }
        break;
      case "flavor":
        if (index === null || !state.calc.flavors[index]) break;
        if (field === "pg" || field === "vg") {
          stepRatio(state.calc.flavors[index], field, delta);
        } else if (field === "pct") {
          stepDecimal(state.calc.flavors[index], "pct", delta, { max: 100 });
        }
        break;
      case "settings-target":
        if (field === "pg" || field === "vg") {
          stepRatio(state.settings.base, field, delta);
        } else if (field === "strength" || field === "amount") {
          stepDecimal(state.settings, field, delta);
        }
        break;
      case "settings-nic":
        if (field === "pg" || field === "vg") {
          stepRatio(state.settings.nicotine.base, field, delta);
        } else if (field === "strength") {
          stepDecimal(state.settings.nicotine, "strength", delta, {
            round: true,
            max: 1000,
          });
        }
        break;
      case "settings-flavor":
        if (field === "pg" || field === "vg") {
          stepRatio(state.settings.flavor.base, field, delta);
        } else if (field === "pct") {
          stepDecimal(state.settings.flavor, "percentage", delta, {
            max: 100,
          });
        }
        break;
      default:
        return;
    }

    render();
  }

  /* ------------------------------------------------------------
     Save actions
     ------------------------------------------------------------ */

  function saveRecipe() {
    if (!state.user) {
      state.showSaveAuth = true;
      render();
      return;
    }

    const c = compute();
    if (c.error) {
      showToast("Fix the formula before saving this recipe.", "error");
      return;
    }

    const name = state.calc.title.trim();
    if (!name) {
      showToast("Recipe title must not be blank.", "error");
      return;
    }

    const payload = {
      name,
      strength: num(state.calc.strength),
      base: { pg: num(state.calc.pg), vg: num(state.calc.vg) },
      amount: num(state.calc.amount),
      ingredients: {
        nicotine: {
          strength: num(state.calc.nic.strength),
          base: {
            pg: num(state.calc.nic.pg),
            vg: num(state.calc.nic.vg),
          },
        },
        flavors: state.calc.flavors.map((flavor) => ({
          name: flavor.name,
          percentage: num(flavor.pct),
          base: { pg: num(flavor.pg), vg: num(flavor.vg) },
        })),
      },
    };

    if (state.calc.editingId) {
      const recipe = state.recipes.find(
        (item) => item._id === state.calc.editingId,
      );
      if (recipe) {
        Object.assign(recipe, payload, { updatedAt: TODAY });
      }
      state.calc.title = name;
      showToast(`"${name}" updated.`, "success");
    } else {
      const recipe = {
        _id: `r_${Date.now()}`,
        author: state.user._id,
        ...payload,
        updatedAt: TODAY,
      };
      state.recipes.unshift(recipe);
      state.calc.editingId = recipe._id;
      state.calc.title = name;
      showToast(`"${name}" saved to your recipes.`, "success");
    }

    syncUrl();
    render();
  }

  function saveSettings() {
    showToast("Settings saved. New batches will use these defaults.", "success");
  }

  function addFlavor() {
    const defaults = state.user
      ? state.settings.flavor
      : { percentage: 0, base: { pg: 100, vg: 0 } };
    state.calc.flavors.push({
      name: `Flavor ${state.calc.flavors.length + 1}`,
      pct: String(defaults.percentage),
      pg: String(defaults.base.pg),
      vg: String(defaults.base.vg),
    });
    render();
  }

  function removeFlavor(index) {
    state.calc.flavors.splice(index, 1);
    state.calc.flavorOpen = {};
    render();
  }

  /* ------------------------------------------------------------
     Auth actions
     ------------------------------------------------------------ */

  function setAuthError(message) {
    state.authError = message;
    state.authNotice = "";
    render();
  }

  function passwordProblem(password, confirm) {
    if (password.length < 6) {
      return "Password is too short. It must be at least 6 characters.";
    }
    if (new TextEncoder().encode(password).length > 72) {
      return "Password is too long. It must not be more than 72 bytes.";
    }
    if (password !== confirm) return "Passwords do not match.";
    return "";
  }

  function signInProvider(provider) {
    const user = makeUser(provider, {
      hasPassword: false,
      hasGoogleLinked: provider === "google",
      hasTwitterLinked: provider === "twitter",
    });
    finishSignIn(
      user,
      `Signed in with ${provider === "google" ? "Google" : "X"}.`,
    );
  }

  function handleFormSubmit(form) {
    const data = Object.fromEntries(new FormData(form).entries());
    const kind = form.dataset.form;

    if (kind === "signin") {
      const email = String(data.email || "").trim();
      if (!email || !email.includes("@")) {
        setAuthError("Enter a valid email address.");
        return;
      }
      if (!String(data.password || "")) {
        setAuthError("Enter your password.");
        return;
      }
      const user = makeUser("email", {
        email,
        hasPassword: true,
        hasGoogleLinked: false,
        hasTwitterLinked: false,
        googleDisplayName: "",
        twitterDisplayName: "",
      });
      finishSignIn(user, "Signed in.");
      return;
    }

    if (kind === "signup") {
      const email = String(data.email || "").trim();
      if (!email || !email.includes("@")) {
        setAuthError("Enter a valid email address.");
        return;
      }
      const problem = passwordProblem(
        String(data.password || ""),
        String(data.confirm || ""),
      );
      if (problem) {
        setAuthError(problem);
        return;
      }
      const user = makeUser("email", {
        email,
        hasPassword: true,
        hasGoogleLinked: false,
        hasTwitterLinked: false,
        googleDisplayName: "",
        twitterDisplayName: "",
      });
      finishSignIn(user, "Account created.");
      return;
    }

    if (kind === "reset") {
      const email = String(data.email || "").trim();
      if (!email || !email.includes("@")) {
        setAuthError("Enter a valid email address.");
        return;
      }
      state.authError = "";
      state.authNotice = `If an account exists for ${email}, a reset link is on its way.`;
      render();
      return;
    }

    if (kind === "set-password" || kind === "change-password") {
      const problem = passwordProblem(
        String(data.password || ""),
        String(data.confirm || ""),
      );
      if (problem) {
        setAuthError(problem);
        return;
      }
      if (state.user) {
        state.user.hasPassword = true;
        state.authError = "";
        state.authNotice = "";
        render();
        showToast(
          kind === "set-password"
            ? "Password set. You can now sign in with email."
            : "Password changed.",
          "success",
        );
      }
    }
  }

  /* ------------------------------------------------------------
     Events
     ------------------------------------------------------------ */

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const switchButton = target.closest("[data-switch]");
    if (switchButton) {
      event.preventDefault();
      cycleVariant(Number(switchButton.dataset.switch) || 1);
      return;
    }

    const element = target.closest("[data-action]");
    if (!element) return;
    const action = element.dataset.action;

    if (element.tagName === "A" && action === "nav") {
      event.preventDefault();
    }

    switch (action) {
      case "nav":
        go(element.dataset.page);
        break;
      case "toggle-mobile":
        state.mobileMenu = true;
        render();
        break;
      case "close-mobile":
        state.mobileMenu = false;
        render();
        break;
      case "toggle-nic":
        state.calc.nicOpen = !state.calc.nicOpen;
        render();
        break;
      case "toggle-flavor": {
        const index = Number(element.dataset.index);
        state.calc.flavorOpen[index] = !state.calc.flavorOpen[index];
        render();
        break;
      }
      case "add-flavor":
        addFlavor();
        break;
      case "remove-flavor":
        removeFlavor(Number(element.dataset.index));
        break;
      case "step":
        applyStep(element.dataset);
        break;
      case "show-save-auth":
        state.showSaveAuth = true;
        render();
        break;
      case "save-recipe":
        saveRecipe();
        break;
      case "sort":
        state.sort = element.dataset.sort === "title" ? "title" : "date";
        render();
        break;
      case "open-recipe":
        openRecipe(element.dataset.id);
        break;
      case "ask-delete-recipe": {
        const recipe = state.recipes.find(
          (item) => item._id === element.dataset.id,
        );
        if (!recipe) break;
        openModal({
          type: "delete-recipe",
          id: recipe._id,
          title: "Delete recipe?",
          message: `Are you sure you want to delete <strong>&ldquo;${esc(
            recipe.name,
          )}&rdquo;</strong>? This cannot be undone.`,
          confirmLabel: "Delete",
        });
        break;
      }
      case "ask-unlink":
        requestUnlink(element.dataset.provider);
        break;
      case "ask-delete-account":
        openModal({
          type: "delete-account",
          title: "Delete account?",
          message:
            "This permanently deletes your login credentials, profile information, saved recipes, and saved settings. <strong>This cannot be undone.</strong>",
          confirmLabel: "Delete account",
        });
        break;
      case "sign-out":
        signOut();
        break;
      case "sign-in-provider":
        signInProvider(element.dataset.provider);
        break;
      case "toggle-zero":
        state.settings.zeroNicotineMode = !state.settings.zeroNicotineMode;
        render();
        break;
      case "save-settings":
        saveSettings();
        break;
      case "modal-cancel":
        if (
          element.classList.contains("proto-modal-backdrop") &&
          event.target !== element
        ) {
          return;
        }
        closeModal();
        break;
      case "modal-confirm":
        confirmModal();
        break;
      default:
        break;
    }
  });

  document.addEventListener("input", (event) => {
    const element = event.target;
    if (!(element instanceof HTMLInputElement)) return;
    const field = element.dataset.field;
    if (!field) return;
    updateField(field, element.value);
    render();
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const element = target.closest("[data-change]");
    if (!element) return;
    if (element.dataset.change === "settings-units") {
      state.settings.units = element.value;
      render();
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!form.dataset.form) return;
    event.preventDefault();
    handleFormSubmit(form);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.modal) {
        closeModal();
        return;
      }
      if (state.mobileMenu) {
        state.mobileMenu = false;
        render();
        return;
      }
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (state.modal || state.mobileMenu) return;

    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT" ||
        active.isContentEditable)
    ) {
      return;
    }

    event.preventDefault();
    cycleVariant(event.key === "ArrowLeft" ? -1 : 1);
  });

  /* ------------------------------------------------------------
     Boot
     ------------------------------------------------------------ */

  syncUrl();
  render();
})();
