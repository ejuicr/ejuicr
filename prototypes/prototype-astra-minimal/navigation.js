// Navigation between static samples only; no application state or requests.
function showView() {
  const key = location.hash.slice(1);
  if (key === "main") return;
  const views = [...document.querySelectorAll("[data-view]")];
  let heading;
  if (views.length) {
    const selected = views.find(view => view.id === (key || "recipes"))
      || document.getElementById("not-found");
    for (const view of views) view.hidden = view !== selected;
    heading = selected.querySelector("h1");
    for (const link of document.querySelectorAll(".site-header a")) {
      const active = link.hash === `#${selected.id}`;
      link.classList.toggle("current", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
  } else {
    const recipe = key === "recipe";
    document.getElementById("recipe-heading").hidden = !recipe;
    document.getElementById("calculator-heading").hidden = recipe;
    document.getElementById("save-button").textContent = recipe ? "Save changes" : "Save recipe";
    heading = document.querySelector(recipe ? "#recipe-heading h1" : "#calculator-heading");
  }
  document.title = `${heading.textContent} · ejuicr prototype`;
  heading.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", showView);
showView();
