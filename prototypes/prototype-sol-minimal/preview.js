// Navigation only. All calculator fields, measurements, and recipes are static.
const views = document.querySelectorAll("[data-view]");
const links = document.querySelectorAll("nav a");

function showView() {
  const requested = location.hash.slice(1);
  const active = [...views].find((view) => view.dataset.view === requested)?.dataset.view || "calculator";
  for (const view of views) view.hidden = view.dataset.view !== active;
  for (const link of links) {
    if (link.hash === `#${active}`) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  document.title = `ejuicr — ${active === "recipes" ? "My recipes" : active === "about" ? "About" : "Calculator"} · Prototype`;
}

window.addEventListener("hashchange", () => {
  showView();
  document.querySelector("[data-view]:not([hidden]) h1").focus({ preventScroll: true });
  window.scrollTo(0, 0);
});
showView();
