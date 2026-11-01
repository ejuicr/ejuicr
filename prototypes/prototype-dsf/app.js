(() => {
  const recipes = [
    {
      name: "Midnight Peach",
      description: "Ripe peach, dark berries, and a whisper of cooling menthol.",
      pg: 30,
      vg: 70,
      nic: 6,
      amount: 30,
      updated: "2 days ago",
      updatedShort: "2d",
      accent: "#ff79c6",
      flavors: [
        { name: "Ripe peach", pct: 6 },
        { name: "Blackberry", pct: 3 },
        { name: "Menthol", pct: 1 },
      ],
      note: "Creamy fruit mix. Give it 3–5 days to settle, then shake well before use.",
    },
    {
      name: "Cyan Citrus",
      description: "Blood orange, lime zest, and a crisp, cold finish.",
      pg: 40,
      vg: 60,
      nic: 3,
      amount: 60,
      updated: "5 days ago",
      updatedShort: "5d",
      accent: "#8be9fd",
      flavors: [
        { name: "Blood orange", pct: 5 },
        { name: "Lime zest", pct: 3 },
        { name: "WS-23", pct: 0.5 },
      ],
      note: "",
    },
    {
      name: "Velvet Custard",
      description: "Vanilla custard, browned butter, and a soft caramel edge.",
      pg: 30,
      vg: 70,
      nic: 6,
      amount: 30,
      updated: "1 week ago",
      updatedShort: "1w",
      accent: "#f1fa8c",
      flavors: [
        { name: "Vanilla custard", pct: 8 },
        { name: "Browned butter", pct: 2 },
        { name: "Caramel", pct: 2 },
      ],
      note: "Best after a week. The custard rounds out and the butter settles.",
    },
    {
      name: "Garden Mint",
      description: "Spearmint, cucumber, and a squeeze of fresh lime.",
      pg: 50,
      vg: 50,
      nic: 3,
      amount: 30,
      updated: "2 weeks ago",
      updatedShort: "2w",
      accent: "#50fa7b",
      flavors: [
        { name: "Spearmint", pct: 4 },
        { name: "Cucumber", pct: 2 },
        { name: "Lime", pct: 1 },
      ],
      note: "",
    },
    {
      name: "Burnt Sugar",
      description: "Dark caramel, tobacco leaf, and black coffee.",
      pg: 40,
      vg: 60,
      nic: 12,
      amount: 30,
      updated: "3 weeks ago",
      updatedShort: "3w",
      accent: "#ffb86c",
      flavors: [
        { name: "Dark caramel", pct: 5 },
        { name: "Tobacco leaf", pct: 3 },
        { name: "Black coffee", pct: 2 },
      ],
      note: "Needs a long steep. Give it two weeks for the tobacco to soften.",
    },
    {
      name: "Blue Raspberry",
      description: "Blue raspberry, lemonade, and a sharp sour finish.",
      pg: 30,
      vg: 70,
      nic: 6,
      amount: 100,
      updated: "1 month ago",
      updatedShort: "1mo",
      accent: "#bd93f9",
      flavors: [
        { name: "Blue raspberry", pct: 7 },
        { name: "Lemonade", pct: 3 },
        { name: "Sour", pct: 1 },
      ],
      note: "",
    },
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const formatPct = (value) => `${Number(value.toFixed(1))}%`;
  const formatMl = (value) => `${value.toFixed(2)} mL`;
  const totalFlavour = (recipe) =>
    recipe.flavors.reduce((total, flavor) => total + flavor.pct, 0);
  const flavourLine = (recipe) =>
    recipe.flavors
      .map((flavor) => `${flavor.name} ${formatPct(flavor.pct)}`)
      .join(" · ");

  let isSignedIn = true;

  function setSignedIn(value) {
    isSignedIn = value;
    document.body.classList.toggle("is-signed-out", !value);
    $$(".signed-in-only").forEach((element) => {
      element.hidden = !value;
    });
    $$(".signed-out-only").forEach((element) => {
      element.hidden = value;
    });
  }

  /* ---------- Render recipe cards ---------- */
  const recipeGrid = $("#recipe-grid");

  if (recipeGrid) {
    recipeGrid.innerHTML = recipes
      .map((recipe, index) => {
        const total = totalFlavour(recipe);
        const flavourRows = recipe.flavors
          .map(
            (flavor) =>
              `<li><span>${flavor.name}</span><span>${formatPct(flavor.pct)}</span></li>`,
          )
          .join("");

        return `
          <article class="recipe-card" style="--accent: ${recipe.accent}; --i: ${index}">
            <h3>${recipe.name}</h3>
            <p class="recipe-desc">${recipe.description}</p>
            <div class="flavour-block">
              <div class="flavour-block-head">
                <span>Flavours</span>
                <strong>${formatPct(total)}</strong>
              </div>
              <ul class="flavour-list">${flavourRows}</ul>
            </div>
            <div class="ratio-bar" aria-hidden="true">
              <span class="vg" style="width: ${recipe.vg}%"></span>
              <span class="pg" style="width: ${recipe.pg}%"></span>
            </div>
            <div class="recipe-meta">
              <div><span>VG / PG</span><strong>${recipe.vg} / ${recipe.pg}</strong></div>
              <div><span>Nicotine</span><strong>${recipe.nic} mg</strong></div>
              <div><span>Batch</span><strong>${recipe.amount} mL</strong></div>
            </div>
            <div class="recipe-foot">
              <span>Last updated ${recipe.updated}</span>
              <button class="recipe-open" type="button" data-open-recipe="${recipe.name}">
                Open
                <svg class="icon" aria-hidden="true"><use href="#i-arrow-right" /></svg>
              </button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /* ---------- Render recent recipes ---------- */
  const recentList = $("#recent-list");

  if (recentList) {
    recentList.innerHTML = recipes
      .slice(0, 4)
      .map(
        (recipe) => `
          <li>
            <button class="recent-item" type="button" data-open-recipe="${recipe.name}">
              <span class="recipe-orb" style="--accent: ${recipe.accent}" aria-hidden="true"></span>
              <span class="recent-copy">
                <span class="recent-name">${recipe.name}</span>
                <span class="recent-meta">${flavourLine(recipe)}</span>
              </span>
              <span class="recent-date">${recipe.updatedShort}</span>
            </button>
          </li>
        `,
      )
      .join("");
  }

  /* ---------- View switching ---------- */
  const panels = $$("[data-panel]");
  const viewButtons = $$("[data-view]");
  let currentRecipe = recipes[0];

  function showView(name, focus = true) {
    const panel = panels.find((item) => item.dataset.panel === name);
    if (!panel) return;

    document.body.classList.remove("auth-open");
    panels.forEach((item) => {
      item.classList.toggle("is-active", item === panel);
    });

    const navKey = panel.dataset.nav || name;

    viewButtons.forEach((button) => {
      const active = button.dataset.view === navKey;
      button.classList.toggle("is-active", active);
      if (button.classList.contains("nav-item")) {
        if (active) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });

    document.title = `${panel.dataset.title || "ejuicr"} — ejuicr UI prototype`;

    if (focus) {
      const heading = panel.querySelector("h1");
      if (heading) heading.focus({ preventScroll: true });
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function signOut() {
    setSignedIn(false);
    showView("mix");
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      if (button.hasAttribute("data-requires-auth") && !isSignedIn) {
        showAuth("signin");
        return;
      }
      showView(button.dataset.view);
    });
  });

  /* ---------- Recipe detail ---------- */
  const detailPanel = $('[data-panel="recipe"]');
  const flavourBody = $("#detail-flavour-body");

  function openRecipe(name, activate = true) {
    const recipe = recipes.find((item) => item.name === name);
    if (!recipe || !detailPanel) return;

    currentRecipe = recipe;
    const total = totalFlavour(recipe);

    const setDetail = (key, value) => {
      $$(`[data-detail="${key}"]`, detailPanel).forEach((element) => {
        element.textContent = value;
      });
    };

    setDetail("name", recipe.name);
    setDetail("description", recipe.description);
    setDetail("updated-short", recipe.updated);
    setDetail("ratio", `${recipe.vg} / ${recipe.pg}`);
    setDetail("pg-vg", `${recipe.pg} / ${recipe.vg}`);
    setDetail("nic", `${recipe.nic} mg/mL`);
    setDetail("amount", `${recipe.amount} mL`);
    setDetail("amount-number", recipe.amount.toFixed(2));
    setDetail("flavour-total", formatPct(total));
    setDetail("pg", `${recipe.pg}%`);
    setDetail("vg", `${recipe.vg}%`);

    const vgBar = $('[data-detail-bar="vg"]', detailPanel);
    const pgBar = $('[data-detail-bar="pg"]', detailPanel);
    if (vgBar) vgBar.style.width = `${recipe.vg}%`;
    if (pgBar) pgBar.style.width = `${recipe.pg}%`;

    if (flavourBody) {
      flavourBody.innerHTML = recipe.flavors
        .map(
          (flavor) => `
            <tr style="--accent: ${recipe.accent}">
              <td>
                <div class="component">
                  <span class="ing-dot" aria-hidden="true"></span>
                  <div><div class="component-name">${flavor.name}</div></div>
                </div>
              </td>
              <td class="num ratio">${formatPct(flavor.pct)}</td>
              <td class="num">${formatMl((flavor.pct / 100) * recipe.amount)}</td>
            </tr>
          `,
        )
        .join("");
    }

    setDetail(
      "note",
      recipe.note ||
        "No batch note yet. Use this space for steep time, tweaks, or anything worth remembering.",
    );
    setDetail("note-status", recipe.note ? "Saved with recipe" : "Optional");

    const noteBody = $('[data-detail="note"]', detailPanel);
    if (noteBody) noteBody.classList.toggle("is-empty", !recipe.note);

    detailPanel.dataset.title = recipe.name;
    detailPanel.dataset.section = "Recipes";
    if (activate) showView("recipe");
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-recipe]");
    if (!trigger) return;
    event.preventDefault();
    openRecipe(trigger.dataset.openRecipe);
  });

  /* ---------- Toast for unavailable actions ---------- */
  const toast = $("#toast");
  const toastCopy = $("#toast-copy");
  let toastTimer;

  function showToast(message) {
    if (!toast || !toastCopy) return;
    toastCopy.textContent =
      message || "This is a visual prototype — actions are disabled.";
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2600);
  }

  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-demo]");
    if (!element) return;
    if (element.tagName === "A") event.preventDefault();
    showToast(element.dataset.demo);
  });

  $$("[data-demo-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      showToast(form.dataset.demoForm);
    });
  });

  /* ---------- Visual segmented controls ---------- */
  $$(".segmented").forEach((group) => {
    group.addEventListener("click", (event) => {
      const segment = event.target.closest(".segment");
      if (!segment || !group.contains(segment)) return;

      $$(".segment", group).forEach((button) => {
        const active = button === segment;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
    });
  });

  /* ---------- Zero nicotine label ---------- */
  const zeroNicotine = $("#zero-nicotine");
  if (zeroNicotine) {
    zeroNicotine.addEventListener("change", () => {
      const label = zeroNicotine.closest(".switch")?.querySelector(".switch-label");
      if (label) label.textContent = zeroNicotine.checked ? "Enabled" : "Disabled";
    });
  }

  /* ---------- Settings section nav ---------- */
  $$(".settings-nav nav a").forEach((link) => {
    link.addEventListener("click", () => {
      $$(".settings-nav nav a").forEach((item) => {
        item.classList.toggle("is-active", item === link);
      });
    });
  });

  /* ---------- Auth flow ---------- */
  const authPanels = $$("[data-auth-panel]");
  const authTitles = {
    signin: "Sign in",
    signup: "Create account",
    reset: "Reset password",
    "reset-sent": "Check your inbox",
    "new-password": "Choose a new password",
    "password-updated": "Password updated",
  };

  function showAuth(state = "signin") {
    const panel = authPanels.find((item) => item.dataset.authPanel === state);
    if (!panel) return;

    document.body.classList.add("auth-open");
    authPanels.forEach((item) => item.classList.toggle("is-active", item === panel));

    document.title = `${authTitles[state] || "Sign in"} — ejuicr`;

    const title = $(".auth-title", panel);
    if (title) {
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-auth]");
    if (!trigger) return;
    event.preventDefault();
    showAuth(trigger.dataset.auth);
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest('[data-action="signout"]');
    if (!trigger) return;
    event.preventDefault();
    signOut();
  });

  $$("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const type = form.dataset.authForm;

      if (type === "signin") {
        setSignedIn(true);
        showView("mix");
        showToast("Signed in — prototype state only.");
        return;
      }

      if (type === "signup") {
        showToast("Account creation isn't wired up in this prototype.");
        return;
      }

      if (type === "reset") {
        const email = form.querySelector('input[type="email"]')?.value.trim();
        const target = $("[data-reset-email]");
        if (target) target.textContent = email || "your email";
        showAuth("reset-sent");
        return;
      }

      if (type === "new-password") {
        showAuth("password-updated");
      }
    });
  });

  /* ---------- Initial state ---------- */
  setSignedIn(true);

  if (detailPanel) {
    openRecipe(currentRecipe.name, false);
    showView("mix", false);
  }
})();
