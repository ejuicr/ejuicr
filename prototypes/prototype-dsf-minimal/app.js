/* Prototype-only shared chrome. There is no application logic here. */
(() => {
  const page = document.body.dataset.page || "";
  const chrome = document.body.dataset.chrome || "app";

  const icons = {
    sliders:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h11M19 7h1M4 17h2M10 17h10"/><circle cx="17" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    trash:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    arrowLeft:
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>',
    droplet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8s6.1 6.4 6.1 11a6.1 6.1 0 0 1-12.2 0c0-4.6 6.1-11 6.1-11Z"/><path d="M9.4 14.4a2.7 2.7 0 0 0 2.6 3"/></svg>',
    book:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.2A2.2 2.2 0 0 1 6.2 3H20v15.5H6.2A2.2 2.2 0 0 0 4 20.7V5.2Z"/><path d="M4 18.5A2.2 2.2 0 0 1 6.2 16.3H20"/></svg>',
    user:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M4.6 20.2a7.5 7.5 0 0 1 14.8 0"/></svg>',
  };

  const header = document.getElementById("site-header");
  if (header) {
    header.className = "site-header";
    if (chrome === "auth") {
      header.innerHTML = `
        <div class="header-inner">
          <a class="brand" href="index.html" aria-label="ejuicr home">
            <img src="assets/logo.svg" alt="ejuicr" width="98" height="23">
          </a>
          <div class="header-actions">
            <a class="back-link" href="${page === "signin" ? "index.html" : "signin.html"}">
              ${icons.arrowLeft}
              ${page === "signin" ? "Back to calculator" : "Back to sign in"}
            </a>
          </div>
        </div>`;
    } else {
      const current = (value) =>
        page === value || (value === "calculator" && page === "recipe")
          ? ' aria-current="page"'
          : "";
      header.innerHTML = `
        <div class="header-inner">
          <a class="brand" href="index.html" aria-label="ejuicr home">
            <img src="assets/logo.svg" alt="ejuicr" width="98" height="23">
          </a>
          <nav class="header-nav" aria-label="Main">
            <a href="index.html"${current("calculator")}>Calculator</a>
            <a href="recipes.html"${current("recipes")}>Recipes</a>
            <a href="settings.html"${current("settings")}>Settings</a>
          </nav>
          <div class="header-actions">
            <a class="avatar" href="account.html" aria-label="My account">JF</a>
          </div>
        </div>`;
    }
  }

  const footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML = `
      <div class="footer-inner">
        <a class="footer-brand" href="index.html" aria-label="ejuicr home">
          <img src="assets/logo.svg" alt="ejuicr" width="98" height="23">
        </a>
        <nav class="footer-nav" aria-label="Footer">
          <a href="about.html">About</a>
          <a href="help.html">Help</a>
          <a href="contribute.html">Contribute</a>
          <a href="https://www.jimfarrugia.com.au" target="_blank" rel="noreferrer">Jim Farrugia</a>
          <a href="https://www.twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>
        </nav>
        <div class="footer-legal">
          <a href="terms.html">Terms</a>
          <a href="privacy.html">Privacy</a>
        </div>
      </div>`;
  }

  if (chrome !== "auth") {
    const tabCurrent = (value) =>
      page === value || (value === "calculator" && page === "recipe")
        ? ' aria-current="page"'
        : "";
    const tabbar = document.createElement("nav");
    tabbar.className = "tabbar";
    tabbar.setAttribute("aria-label", "Primary");
    tabbar.innerHTML = `
      <a href="index.html"${tabCurrent("calculator")}>${icons.droplet}<span>Calculator</span></a>
      <a href="recipes.html"${tabCurrent("recipes")}>${icons.book}<span>Recipes</span></a>
      <a href="settings.html"${tabCurrent("settings")}>${icons.sliders}<span>Settings</span></a>
      <a href="account.html"${tabCurrent("account")}>${icons.user}<span>Account</span></a>`;
    document.body.appendChild(tabbar);
  }

  const groups = [
    {
      label: "App",
      items: [
        ["index.html", "Calculator", "calculator"],
        ["recipe.html", "Saved recipe", "recipe"],
        ["recipes.html", "Recipes", "recipes"],
        ["settings.html", "Settings", "settings"],
        ["account.html", "My Account", "account"],
      ],
    },
    {
      label: "Auth",
      items: [
        ["signin.html", "Sign in", "signin"],
        ["signup.html", "Sign up", "signup"],
        ["reset-password.html", "Reset password", "reset-password"],
      ],
    },
    {
      label: "Info",
      items: [
        ["about.html", "About", "about"],
        ["help.html", "Help", "help"],
        ["contribute.html", "Contribute", "contribute"],
        ["terms.html", "Terms", "terms"],
        ["privacy.html", "Privacy", "privacy"],
      ],
    },
  ];

  const launch = document.createElement("button");
  launch.type = "button";
  launch.className = "proto-launch";
  launch.setAttribute("aria-expanded", "false");
  launch.setAttribute("aria-controls", "proto-screens");
  launch.innerHTML = `Screens <span class="proto-count">13</span>`;

  const panel = document.createElement("nav");
  panel.id = "proto-screens";
  panel.className = "proto-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Prototype screens");
  panel.innerHTML = `
    <p class="proto-kicker">Prototype only</p>
    <p class="proto-title">Explore the ejuicr UI</p>
    ${groups
      .map(
        (group) => `
      <div class="proto-group">
        <h2>${group.label}</h2>
        ${group.items
          .map(
            ([href, label, key]) =>
              `<a href="${href}"${page === key ? ' aria-current="page"' : ""}>${label}<span>${href}</span></a>`,
          )
          .join("")}
      </div>`,
      )
      .join("")}
    <p class="proto-note">Static layout demo. No calculator results, saves, deletes, or authentication are wired up.</p>`;

  document.body.append(panel);
  const headerActions = document.querySelector(".header-actions");
  if (headerActions) {
    headerActions.prepend(launch);
  } else {
    document.body.append(launch);
  }

  const setPanel = (open) => {
    panel.hidden = !open;
    launch.setAttribute("aria-expanded", String(open));
  };

  launch.addEventListener("click", () => setPanel(panel.hidden));

  document.addEventListener("click", (event) => {
    if (
      !panel.hidden &&
      !panel.contains(event.target) &&
      !launch.contains(event.target)
    ) {
      setPanel(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) {
      setPanel(false);
      launch.focus();
    }
  });

  // Dialogs are visual demos only. They can open and close; nothing is saved.
  document.querySelectorAll("[data-dialog-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(button.dataset.dialogOpen);
      if (!dialog) return;
      if (button.dataset.name) {
        const name = dialog.querySelector("[data-dialog-name]");
        if (name) name.textContent = button.dataset.name;
      }
      dialog.showModal();
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.querySelectorAll("[data-dialog-close]").forEach((button) => {
      button.addEventListener("click", () => dialog.close());
    });
    dialog.addEventListener("click", (event) => {
      const rect = dialog.getBoundingClientRect();
      const outside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (outside) dialog.close();
    });
  });

  // Keep the static prototype in place if someone presses Enter in a form.
  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());
  });

  document.querySelectorAll("[data-icon]").forEach((element) => {
    const icon = icons[element.dataset.icon];
    if (icon) element.insertAdjacentHTML("afterbegin", icon);
  });
})();
