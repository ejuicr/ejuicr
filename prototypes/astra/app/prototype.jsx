"use client";

// Three whole-app UI studies, switchable on /?variant=A|B|C. Throwaway, memory only.
/* eslint-disable @next/next/no-img-element -- original local SVG assets */
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateResults, getCalculatorStatus } from "@/lib/calculator";
import { formatMeasurement as fmt, validatePassword } from "@/lib/helpers";
import {
  faFlask, faBookOpen, faSliders, faUser, faArrowRightFromBracket,
  faPlus, faMinus, faGear, faTrashCan, faChevronLeft, faChevronRight,
  faArrowRight, faXmark, faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

const variants = { A: "Workbench", B: "Worksheet", C: "Split" };
const icons = { calculator: faFlask, recipes: faBookOpen, settings: faSliders, myaccount: faUser };
const navigation = { calculator: "Calculator", recipes: "Recipes", settings: "Settings", myaccount: "Account" };
const documents = { about: "About", help: "Help", contribute: "Contribute", "terms-of-service": "Terms", "privacy-policy": "Privacy" };
const demoInput = {
  targetPg: 30, targetVg: 70, targetAmount: 60, targetNicStrength: 3,
  nicConfig: { strength: 100, pg: 100, vg: 0 },
  flavors: [
    { name: "Strawberry", percentage: 5, pg: 100, vg: 0 },
    { name: "Vanilla custard", percentage: 3, pg: 100, vg: 0 },
  ],
};
const initialSettings = {
  units: "both", zero: false, pg: 30, amount: 30, strength: 6,
  nicStrength: 100, nicPg: 100, flavorPg: 100, flavorPercentage: 5,
};
const demoUser = { email: "alex@example.com", hasPassword: true, google: true, twitter: false };
const sampleRecipes = [
  { id: "strawberry", name: "Strawberry custard", date: "2026-11-02", input: demoInput },
  { id: "peach", name: "Peach & cream", date: "2026-10-30", input: { ...demoInput, targetAmount: 30, flavors: [{ name: "Peach", percentage: 6, pg: 100, vg: 0 }, { name: "Cream", percentage: 2, pg: 100, vg: 0 }] } },
  { id: "mint", name: "Cool mint", date: "2026-10-27", input: { ...demoInput, targetNicStrength: 0, flavors: [{ name: "Peppermint", percentage: 4, pg: 100, vg: 0 }] } },
  { id: "blueberry", name: "Blueberry muffin", date: "2026-10-21", input: { ...demoInput, flavors: [{ name: "Blueberry", percentage: 5, pg: 100, vg: 0 }, { name: "Muffin", percentage: 3, pg: 100, vg: 0 }] } },
];
const previewViews = [
  ["calculator", "Calculator · signed in"], ["guest", "Calculator · guest"],
  ["invalid", "Calculator · invalid mixture"], ["recipe", "Recipe · edit / rename"],
  ["recipes", "Saved recipes"], ["empty", "Saved recipes · empty"],
  ["loading", "Saved recipes · loading"], ["load-error", "Saved recipes · error"],
  ["missing-recipe", "Recipe · not found"], ["settings", "Settings"],
  ["myaccount", "My account"], ["provider-account", "My account · provider only"],
  ["signin", "Sign in"], ["signup", "Sign up"], ["reset", "Reset password"],
  ["reset-sent", "Reset · email sent"], ["update-password", "Reset · new password"],
  ["reset-expired", "Reset · expired link"], ["reset-complete", "Reset · success"],
  ["auth-error", "Provider · sign-in error"], ["signedout", "Signed out"],
  ...Object.entries(documents), ["not-found", "Page not found"],
];

function Icon({ icon, ...props }) {
  return <svg viewBox={`0 0 ${icon.icon[0]} ${icon.icon[1]}`} aria-hidden="true" focusable="false" {...props}><path fill="currentColor" d={icon.icon[4]} /></svg>;
}

function NumberField({ label, value, onChange, unit, step = 1, max = 1000, min = 0, compact = false }) {
  const update = (n) => onChange(Math.min(max, Math.max(min, Math.round((Number(n) || 0) * 100) / 100)));
  return <label className={`number-field ${compact ? "compact" : ""}`}>
    <span className="field-label">{label}</span>
    <span className="number-control">
      <button type="button" className="step" aria-label={`Decrease ${label}`} onClick={() => update(value - step)} disabled={value <= min}><Icon icon={faMinus} /></button>
      <input type="number" aria-label={label} value={value} min={min} max={max} step="any" onChange={(e) => update(e.target.value)} />
      <span className="unit">{unit}</span>
      <button type="button" className="step" aria-label={`Increase ${label}`} onClick={() => update(value + step)} disabled={value >= max}><Icon icon={faPlus} /></button>
    </span>
  </label>;
}

function Ratio({ label, ariaLabel = label, pg, onChange }) {
  return <fieldset className="ratio-field"><legend>{label}</legend><div className="ratio-inputs">
    <label><span>PG</span><input aria-label={`${ariaLabel} PG`} type="number" min="0" max="100" value={pg} onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value))))} /><span>%</span></label>
    <span className="ratio-divider">/</span>
    <label><span>VG</span><input aria-label={`${ariaLabel} VG`} type="number" min="0" max="100" value={100 - pg} onChange={(e) => onChange(100 - Math.min(100, Math.max(0, Number(e.target.value))))} /><span>%</span></label>
  </div></fieldset>;
}

function Target({ input, setInput, showNicotine }) {
  return <section className="panel target-panel"><div className="section-label"><h2>Batch</h2></div>
    <div className="target-fields">
      <NumberField label="Amount" value={input.targetAmount} unit="mL" step={10} max={10000} onChange={(v) => setInput({ ...input, targetAmount: v })} />
      <Ratio label="Base" ariaLabel="Batch base" pg={input.targetPg} onChange={(v) => setInput({ ...input, targetPg: v, targetVg: 100 - v })} />
      {showNicotine && <NumberField label="Nicotine Strength" value={input.targetNicStrength} unit="mg/mL" onChange={(v) => setInput({ ...input, targetNicStrength: v })} />}
    </div>
  </section>;
}

function Ingredients({ input, setInput, showNicotine, defaults, separateNicotine = false }) {
  const [expanded, setExpanded] = useState(null);
  const [nicotineExpanded, setNicotineExpanded] = useState(false);
  const updateFlavor = (index, update) => setInput({ ...input, flavors: input.flavors.map((flavor, i) => i === index ? { ...flavor, ...update } : flavor) });
  const nicotine = showNicotine && <section className={separateNicotine ? "panel nicotine-panel" : "nicotine-block"}>
      <div className="section-label"><h2><span className="nicotine-title-full">Undiluted Nicotine</span><span className="nicotine-title-short">Undiluted Nic.</span></h2>{separateNicotine ? <div className="nicotine-summary">
        <span className="quiet">{[
          `${fmt(input.nicConfig.strength)}mg/mL`,
          ...(input.nicConfig.pg > 0 ? [`${fmt(input.nicConfig.pg)}% PG`] : []),
          ...(input.nicConfig.vg > 0 ? [`${fmt(input.nicConfig.vg)}% VG`] : []),
        ].join(" · ")}</span>
        <button className="icon-button" aria-label={`${nicotineExpanded ? "Collapse" : "Expand"} nicotine base`} aria-expanded={nicotineExpanded} aria-controls="nicotine-base-controls" onClick={() => setNicotineExpanded(!nicotineExpanded)}><Icon icon={faGear} /></button>
      </div> : <span className="quiet">Undiluted</span>}</div>
      <div className="nicotine-fields" id={separateNicotine ? "nicotine-base-controls" : undefined} hidden={separateNicotine && !nicotineExpanded}>
        <NumberField label="Undiluted Strength" value={input.nicConfig.strength} unit="mg/mL" step={5} onChange={(strength) => setInput({ ...input, nicConfig: { ...input.nicConfig, strength } })} />
        <Ratio label="Base" ariaLabel="Undiluted nicotine base" pg={input.nicConfig.pg} onChange={(pg) => setInput({ ...input, nicConfig: { ...input.nicConfig, pg, vg: 100 - pg } })} />
      </div>
    </section>;
  return <div className={separateNicotine ? "ingredients-stack" : undefined}>
    {separateNicotine && nicotine}
    <section className="panel ingredient-panel">
    {!separateNicotine && nicotine}
    <div className="section-label flavor-heading"><h2>Flavors</h2></div>
    <div className="flavor-list">
      {input.flavors.map((flavor, i) => <div className="flavor-item" key={i}>
        <div className="flavor-row">
          <label className="flavor-name"><span className="sr-only">Flavor {i + 1} name</span><input maxLength={60} value={flavor.name} placeholder="Flavor name" onChange={(e) => updateFlavor(i, { name: e.target.value })} /></label>
          <NumberField compact label={`Flavor ${i + 1} percentage`} value={flavor.percentage} unit="%" max={100} step={0.5} onChange={(percentage) => updateFlavor(i, { percentage })} />
          <button className={`icon-button ${expanded === i ? "selected" : ""}`} aria-label={`Configure ${flavor.name || "flavor"} carrier`} aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? null : i)}><Icon icon={faGear} /></button>
          <button className="icon-button remove" aria-label={`Remove ${flavor.name || "flavor"}`} onClick={() => { setInput({ ...input, flavors: input.flavors.filter((_, n) => i !== n) }); setExpanded(null); }}><Icon icon={faXmark} /></button>
        </div>
        {expanded === i && <div className="flavor-config"><Ratio label="Base" ariaLabel={`Flavor ${i + 1} base`} pg={flavor.pg} onChange={(pg) => updateFlavor(i, { pg, vg: 100 - pg })} /></div>}
      </div>)}
      {!input.flavors.length && <p className="empty-inline">No flavors added. Add a flavor to include it in the calculation.</p>}
    </div>
    <button className="add-flavor-button" onClick={() => {
      setInput({ ...input, flavors: [...input.flavors, { name: `Flavor ${input.flavors.length + 1}`, percentage: defaults?.flavorPercentage ?? 0, pg: defaults?.flavorPg ?? 100, vg: 100 - (defaults?.flavorPg ?? 100) }] });
    }}><Icon icon={faPlus} /> Add flavor</button>
  </section></div>;
}

function Results({ input, units, showNicotine }) {
  const result = calculateResults(input);
  const status = getCalculatorStatus(input, result);
  const rows = [
    ["PG", status.pgPercentage, result.pgRequired, status.pgWeight, "cyan"],
    ["VG", status.vgPercentage, result.vgRequired, status.vgWeight, "purple"],
    ...(showNicotine ? [["Nicotine", status.nicPercentage, result.nicResults.amount, result.nicResults.weight, "pink"]] : []),
    ...result.flavors.map((f) => [f.name || "Unnamed flavor", f.percentage, f.amount, f.weight, "yellow"]),
  ];
  return <section className="panel results-panel">
    <div className="section-label"><h2>Your Mix</h2><span className="quiet">{fmt(input.targetAmount)} mL</span></div>
    {status.error && <div className="message error" role="alert">{status.error}</div>}
    <table className="results-table"><caption className="sr-only">Ingredient quantities. Every value includes its unit.</caption><tbody>
      {rows.map(([name, percent, ml, grams, color], i) => <tr key={i} className={ml < 0 ? "invalid-row" : ""}>
        <th scope="row"><i className={`dot ${color}`} />{name}</th>
        <td>{fmt(percent)}<span>%</span></td>
        {units !== "weight" && <td>{fmt(ml)}<span>mL</span></td>}
        {units !== "volume" && <td>{fmt(grams)}<span>g</span></td>}
      </tr>)}
    </tbody></table>
  </section>;
}

function SaveRow({ name, setName, user, save, editing, error, signIn }) {
  return <section className="panel save-block"><div className="section-label"><h2>{editing ? "Save Changes" : "Save Recipe"}</h2></div><form className="save-row" onSubmit={(e) => { e.preventDefault(); if (user) save(); else signIn(); }}>
    <label><span className="sr-only">Recipe name</span><input aria-label="Recipe name" placeholder="Name your recipe" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></label>
    <button className="primary" type="submit" disabled={Boolean(error)}>Save</button>
  </form>
    {!user && <p className="save-hint">Sign in to save this recipe. Your inputs stay here.</p>}
  </section>;
}

export function VariantA({ target, ingredients, results, save }) {
  return <div className="calculator-layout workbench"><div className="inputs-zone">{target}{ingredients}</div><div className="results-zone">{results}</div>{save}</div>;
}
export function VariantB({ target, ingredients, results, save }) {
  return <div className="calculator-layout worksheet">{target}{ingredients}{results}{save}</div>;
}
export function VariantC({ target, ingredients, results, save }) {
  return <div className="calculator-layout split"><div className="results-zone">{results}{save}</div><div className="inputs-zone">{target}{ingredients}</div></div>;
}

function Settings({ saved, onSave }) {
  const [draft, setDraft] = useState(saved || initialSettings);
  const change = (key, value) => setDraft({ ...draft, [key]: value });
  return <form className="settings-form" onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
    <h1 className="recipe-heading">Calculator Defaults</h1>
    <section className="settings-section"><div className="settings-description"><h2>Mixing Units</h2><p>Choose how amounts appear in your results.</p></div><div className="settings-controls">
      <label className="select-field"><span className="sr-only">Mixing units</span><select aria-label="Mixing units" value={draft.units} onChange={(e) => change("units", e.target.value)}><option value="both">Volume & Weight · mL & g</option><option value="volume">Volume · mL</option><option value="weight">Weight · g</option></select></label>
    </div></section>
    <section className="settings-section"><div className="settings-description"><h2>Batch</h2><p>Defaults for opening the calculator.</p></div><div className="settings-controls">
      <Ratio label="Base" ariaLabel="Batch base" pg={draft.pg} onChange={(v) => change("pg", v)} />
      <NumberField label="Amount" unit="mL" value={draft.amount} max={10000} step={10} onChange={(v) => change("amount", v)} />
      <NumberField label="Nicotine Strength" unit="mg/mL" value={draft.strength} onChange={(v) => change("strength", v)} />
    </div></section>
    <section className="settings-section"><div className="settings-description"><h2>Nicotine</h2><p>The strength and carrier of your undiluted base.</p></div><div className="settings-controls">
      <label className="switch-row"><span><strong>Zero nicotine mode</strong><small>Hide nicotine controls for nicotine-free mixes.</small></span><input type="checkbox" role="switch" checked={draft.zero} onChange={(e) => change("zero", e.target.checked)} /><span className="switch-track" /></label>
      <NumberField label="Undiluted Strength" value={draft.nicStrength} unit="mg/mL" step={5} onChange={(v) => change("nicStrength", v)} />
      <Ratio label="Base" ariaLabel="Undiluted nicotine base" pg={draft.nicPg} onChange={(v) => change("nicPg", v)} />
    </div></section>
    <section className="settings-section"><div className="settings-description"><h2>Flavors</h2><p>Defaults for each flavor you add.</p></div><div className="settings-controls">
      <Ratio label="Base" ariaLabel="Flavor base" pg={draft.flavorPg} onChange={(v) => change("flavorPg", v)} />
      <NumberField label="Flavor Percentage" value={draft.flavorPercentage} unit="%" max={100} step={0.5} onChange={(v) => change("flavorPercentage", v)} />
    </div></section>
    <div className="form-actions"><button className="primary" type="submit">Save settings</button></div>
  </form>;
}

function PasswordForm({ current = false, onSave, label = "Change Password" }) {
  const [error, setError] = useState("");
  return <form className="password-form" onSubmit={(e) => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    const valid = validatePassword(data.get("password"));
    if (valid !== true) { setError(valid); return; }
    if (data.get("password") !== data.get("confirm")) { setError("Passwords do not match."); return; }
    setError(""); e.currentTarget.reset(); onSave();
  }}>
    {current && <label>Current password<input required type="password" name="current" autoComplete="current-password" /></label>}
    <label>New password<input required type="password" name="password" autoComplete="new-password" /></label>
    <label>Confirm new password<input required type="password" name="confirm" autoComplete="new-password" /></label>
    <p className="field-note">At least 6 characters.</p>
    {error && <p className="message error" role="alert">{error}</p>}
    <button className="primary" type="submit">{label}</button>
  </form>;
}

function Confirmation({ dialog, close }) {
  const ref = useRef(null);
  useEffect(() => { ref.current.showModal(); }, []);
  return <dialog ref={ref} className="confirm-dialog" onCancel={(e) => { e.preventDefault(); close(); }} aria-labelledby="confirm-title">
    <h2 id="confirm-title">{dialog.title}</h2><p>{dialog.text}</p>
    <div className="form-actions"><button autoFocus onClick={close}>{dialog.action ? "Cancel" : "Close"}</button>{dialog.action && <button className="danger" onClick={() => { dialog.action(); close(); }}>{dialog.label || "Delete"}</button>}</div>
  </dialog>;
}

function Account({ user, setUser, count, go, signOut, confirm, deleteAccount, showToast }) {
  return <div className="account-view"><h1 className="sr-only">My account</h1>
    <section className="account-profile panel"><div className="section-label"><h2>My account</h2><Icon icon={faUser} /></div>
      <p className="account-email">{user.email}</p>
      <button className="text-button" onClick={() => go("recipes")}>{count} saved {count === 1 ? "recipe" : "recipes"}<Icon icon={faArrowRight} /></button>
      <button className="signout-button" onClick={signOut}><Icon icon={faArrowRightFromBracket} />Sign out</button>
    </section>
    <div className="account-details">
      {(user.google || user.twitter) && <section className="panel"><div className="section-label"><h2>Linked accounts</h2></div>
        {["google", "twitter"].filter((p) => user[p]).map((provider) => <div className="provider-row" key={provider}>
          <img src={`/assets/${provider === "google" ? "google" : "x"}-logo.svg`} width="22" height="22" alt="" />
          <div><strong>{provider === "google" ? "Google" : "X / Twitter"}</strong><p>{provider === "twitter" ? "Handle, display name, email, profile picture." : "Display name, email, profile picture."}</p></div>
          <button className="danger-outline" onClick={() => confirm(!user.hasPassword && Number(user.google) + Number(user.twitter) < 2 ? {
            title: "Set a password first", text: "This is your only sign-in method. Set a password before unlinking this account.",
          } : { title: `Unlink ${provider === "google" ? "Google" : "X"}?`, text: "You will no longer be able to sign in with this linked account.", label: "Unlink", action: () => { setUser({ ...user, [provider]: false }); showToast(`${provider === "google" ? "Google" : "X"} account unlinked.`); } })}>Unlink</button>
        </div>)}
      </section>}
      <section className="panel"><div className="section-label"><h2>{user.hasPassword ? "Change Password" : "Set Password"}</h2></div>
        <PasswordForm current={user.hasPassword} label={user.hasPassword ? "Change Password" : "Set Password"} onSave={() => { setUser({ ...user, hasPassword: true }); showToast(user.hasPassword ? "Password changed." : "Password set. You can now sign in with email."); }} />
      </section>
      <section className="panel delete-section"><div className="section-label"><h2>Delete Account</h2></div><p>Permanently delete your account, personal data, saved recipes and settings. This cannot be undone.</p><button className="danger-outline" onClick={() => confirm({ title: "Delete your account?", text: "Your login credentials, profile information, recipes and settings will be permanently deleted. This cannot be undone.", label: "Delete Account", action: deleteAccount })}>Delete Account</button></section>
    </div>
  </div>;
}

function Auth({ view, go, signIn, cancel }) {
  const [error, setError] = useState("");
  const titles = { signin: "Sign in", signup: "Create an account", reset: "Reset password", "reset-sent": "Check your email", "update-password": "New password", "reset-expired": "Reset link expired", "reset-complete": "Password changed", "auth-error": "Sign-in unsuccessful" };
  const submit = (e) => {
    e.preventDefault(); const values = new FormData(e.currentTarget);
    if (view === "reset") { go("reset-sent"); return; }
    if (view === "signup") {
      const valid = validatePassword(values.get("password"));
      if (valid !== true) { setError(valid); return; }
      if (values.get("password") !== values.get("confirm")) { setError("Passwords do not match."); return; }
    }
    signIn(values.get("email"), "email", view === "signup" ? "Account created." : "Signed in.");
  };
  return <div className="auth-layout"><section className="auth-panel panel">
    <button className="text-button back-button" onClick={cancel}><Icon icon={faArrowLeft} />Back to calculator</button>
    <h1>{titles[view]}</h1>
    {view === "signin" || view === "signup" ? <>
      <div className="provider-buttons"><button onClick={() => signIn("alex@example.com", "google")}><img src="/assets/google-logo.svg" width="19" height="19" alt="" />Continue with Google</button><button onClick={() => signIn("alex@example.com", "twitter")}><img src="/assets/x-logo.svg" width="18" height="18" alt="" />Continue with X</button></div>
      <div className="or-divider"><span>or with email</span></div>
      <form className="auth-form" onSubmit={submit}>
        <label>Email<input name="email" type="email" placeholder="you@example.com" autoComplete="email" required /></label>
        <label>Password<input name="password" type="password" autoComplete={view === "signup" ? "new-password" : "current-password"} required /></label>
        {view === "signup" && <><label>Confirm password<input name="confirm" type="password" autoComplete="new-password" required /></label><p className="field-note">At least 6 characters.</p></>}
        {view === "signin" && <button type="button" className="text-button forgot" onClick={() => go("reset")}>Forgot password?</button>}
        {error && <p className="message error" role="alert">{error}</p>}
        <button className="primary" type="submit">{view === "signup" ? "Create account" : "Sign in"}<Icon icon={faArrowRight} /></button>
      </form>
      <p className="auth-other">{view === "signup" ? "Already have an account?" : "Need an account?"} <button className="text-button" onClick={() => go(view === "signup" ? "signin" : "signup")}>{view === "signup" ? "Sign in" : "Sign up"}</button></p>
    </> : view === "reset" ? <><p>Enter your email address to request a password reset link.</p><form className="auth-form" onSubmit={submit}><label>Email<input required type="email" name="email" autoComplete="email" placeholder="you@example.com" /></label><button className="primary">Send reset link</button></form><button className="text-button" onClick={() => go("signin")}>Return to sign in</button></>
      : view === "reset-sent" ? <><div className="message success" role="status">Check your email inbox for a link to change your password.</div><button className="primary" onClick={() => go("signin")}>Return to sign in</button></>
      : view === "update-password" ? <PasswordForm label="Update password" onSave={() => go("reset-complete")} />
      : view === "reset-expired" ? <><p className="message error" role="alert">This reset link is invalid, expired or has already been used.</p><button className="primary" onClick={() => go("reset")}>Request a new link</button></>
      : view === "reset-complete" ? <><p className="message success" role="status">Your password has been changed. You can now sign in with your new password.</p><button className="primary" onClick={() => go("signin")}>Sign in</button></>
      : <><p className="message error" role="alert">Google sign-in failed. Please try again.</p><button className="primary" onClick={() => go("signin")}>Try again</button><button className="text-button" onClick={cancel}>Return to calculator</button></>}
  </section></div>;
}

function RecipeList({ recipes, view, open, confirm, remove, go }) {
  const [sort, setSort] = useState("date");
  const sorted = [...recipes].sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : b.date.localeCompare(a.date));
  return <section className="panel recipe-list-panel"><div className="section-label"><h1>Saved recipes</h1>{view === "recipes" && recipes.length > 0 && <label className="sort-control"><span>Sort by</span><select aria-label="Sort recipes" value={sort} onChange={(e) => setSort(e.target.value)}><option value="date">Last updated</option><option value="name">Title</option></select></label>}</div>
    {view === "loading" ? <div className="list-state" role="status"><span className="loading-dot" />Loading recipes…</div>
      : view === "load-error" ? <div className="list-state"><p className="message error" role="alert">Your recipes could not be loaded. Please try again.</p><button onClick={() => go("recipes")}>Try again</button></div>
      : !recipes.length || view === "empty" ? <div className="list-state"><Icon icon={faBookOpen} /><h2>No saved recipes</h2><p>Save a recipe from the calculator to find it here.</p><button className="primary" onClick={() => go("calculator")}>Open calculator<Icon icon={faArrowRight} /></button></div>
      : <ul className="recipe-list">{sorted.map((recipe) => <li key={recipe.id}>
        <button className="recipe-open" onClick={() => open(recipe)}><span className="recipe-mark"><Icon icon={faFlask} /></span><span className="recipe-title">{recipe.name}</span><time dateTime={recipe.date}>Updated {new Date(`${recipe.date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</time><Icon icon={faChevronRight} /></button>
        <button className="icon-button remove" aria-label={`Delete ${recipe.name}`} onClick={() => confirm({ title: `Delete “${recipe.name}”?`, text: "This recipe will be permanently removed from your saved recipes.", action: () => remove(recipe.id) })}><Icon icon={faTrashCan} /></button>
      </li>)}</ul>}
  </section>;
}

function Information({ view, go, privacy, terms }) {
  return <article className="information panel">
    {view === "privacy-policy" ? privacy : view === "terms-of-service" ? terms : view === "about" ? <>
      <h1>About ejuicr</h1><p>ejuicr is an ejuice calculator for creating and saving your recipes.</p>
      <h2>Use it anywhere</h2><p>Use the calculator on your phone, tablet or computer, with measurements by volume and weight.</p>
      <h2>Your defaults</h2><p>Sign in to save recipes and set defaults for nicotine strength, PG/VG ratio, amount and flavors.</p>
      <h2>No ads or trackers</h2><p>ejuicr is a labour of love. Your feedback helps improve it.</p>
      <h2>No unnecessary emails</h2><p>You will only receive emails when you contact support or request a password reset.</p><button className="text-button" onClick={() => go("contribute")}>Send feedback<Icon icon={faArrowRight} /></button>
    </> : view === "help" ? <><h1>Help</h1><h2>Contact support</h2><p>Send a tweet or a direct message to <a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>. Replies may take a little time.</p><h2>Send feedback</h2><p>We appreciate any feedback you would like to share.</p><button className="text-button" onClick={() => go("contribute")}>Ways to contribute<Icon icon={faArrowRight} /></button></>
      : view === "contribute" ? <><h1>Contribute</h1><h2>Send feedback</h2><p>Share your feedback with <a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a>.</p><ul><li>How did you find ejuicr?</li><li>When and how do you use it?</li><li>What works well, and what could be easier?</li><li>Have you experienced a problem on any device?</li></ul><h2>GitHub</h2><p>The source code is on <a href="https://github.com/ejuicr/ejuicr" target="_blank" rel="noreferrer">GitHub</a>. You can <a href="https://github.com/ejuicr/ejuicr/issues" target="_blank" rel="noreferrer">report a bug or suggest a feature</a>, or submit a pull request.</p></>
      : <><h1>{view === "missing-recipe" ? "Recipe not found" : "Page not found"}</h1><p>{view === "missing-recipe" ? "This recipe is unavailable or has been deleted." : "The page you are looking for could not be found. It may have been removed or the URL may have changed."}</p><button className="primary" onClick={() => go(view === "missing-recipe" ? "recipes" : "calculator")}>Return to {view === "missing-recipe" ? "saved recipes" : "calculator"}</button><p>If you still need help, <button className="text-button" onClick={() => go("help")}>contact support</button>.</p></>}
  </article>;
}

function PrototypeSwitcher({ variant, changeVariant, view, preview, state }) {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest("input, textarea, select, [contenteditable], dialog") || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); changeVariant(e.key === "ArrowRight" ? 1 : -1); }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeVariant]);
  useEffect(() => { console.info("[Astra prototype state]", state); }, [variant, state]);
  if (process.env.NODE_ENV === "production") return null;
  return <aside className="prototype-tools" aria-label="Prototype controls">
    {menu && <div className="prototype-inspector"><div className="section-label"><strong>Views & states</strong><button className="icon-button" aria-label="Close prototype views" onClick={() => setMenu(false)}><Icon icon={faXmark} /></button></div>
      <p>Throwaway prototype · in-memory data</p>
      <label>Preview a view<select aria-label="Preview a view" value={previewViews.some(([key]) => key === view) ? view : "calculator"} onChange={(e) => { preview(e.target.value); setMenu(false); }}>{previewViews.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
      <details><summary>State</summary><pre>{JSON.stringify(state, null, 2)}</pre></details>
    </div>}
    <div className="prototype-bar"><span className="prototype-label">PROTOTYPE</span><button className="icon-button" aria-label="Previous variant" onClick={() => changeVariant(-1)}><Icon icon={faChevronLeft} /></button><span className="variant-label" aria-live="polite">{variant} <span>/</span> {variants[variant]}</span><button className="icon-button" aria-label="Next variant" onClick={() => changeVariant(1)}><Icon icon={faChevronRight} /></button><button className="preview-button" aria-expanded={menu} onClick={() => setMenu(!menu)}>Views & states<Icon icon={faSliders} /></button></div>
  </aside>;
}

export default function Prototype({ privacy, terms }) {
  const params = useSearchParams();
  const router = useRouter();
  const variant = variants[params.get("variant")] ? params.get("variant") : "A";
  const rawView = params.get("view") || "calculator";
  const authViews = ["signin", "signup", "reset", "reset-sent", "update-password", "reset-expired", "reset-complete", "auth-error"];
  const [user, setUser] = useState(() => ["guest", "signedout", ...authViews].includes(rawView) ? null : rawView === "provider-account" ? { ...demoUser, hasPassword: false } : demoUser);
  const [input, setInput] = useState(() => rawView === "invalid" ? { ...demoInput, targetPg: 5, targetVg: 95 } : demoInput);
  const [name, setName] = useState(rawView === "recipe" ? sampleRecipes[0].name : "");
  const [editing, setEditing] = useState(rawView === "recipe" ? sampleRecipes[0].id : null);
  const [recipes, setRecipes] = useState(sampleRecipes);
  const [settings, setSettings] = useState(null);
  const toastId = useRef(0);
  const [toast, setToast] = useState(rawView === "signedout" ? { id: 0, text: "Signed out.", type: "success" } : null);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function showToast(text, type = "success") {
    setToast({ id: ++toastId.current, text, type });
  }
  const [dialog, setDialog] = useState(null);
  const view = ["guest", "invalid", "signedout", "recipe"].includes(rawView) ? "calculator" : rawView === "provider-account" ? "myaccount" : rawView;
  const protectedView = ["recipes", "empty", "loading", "load-error", "settings", "myaccount", "missing-recipe"].includes(view);
  const actualView = !user && protectedView ? "signin" : view;

  function go(next) {
    const search = new URLSearchParams(params.toString());
    search.set("variant", variant); search.set("view", next);
    router.push(`/?${search}`, { scroll: false });
    window.scrollTo({ top: 0 });
  }
  function navigate(next) {
    if (next === "calculator" && view !== "calculator") {
      setEditing(null); setName("");
      if (user && settings) setInput({
        targetPg: settings.pg, targetVg: 100 - settings.pg, targetAmount: settings.amount,
        targetNicStrength: settings.zero ? 0 : settings.strength,
        nicConfig: { strength: settings.nicStrength, pg: settings.nicPg, vg: 100 - settings.nicPg },
        flavors: [{ name: "Flavor 1", percentage: settings.flavorPercentage, pg: settings.flavorPg, vg: 100 - settings.flavorPg }],
      });
    }
    go(next);
  }
  function signOut() {
    setUser(null); setEditing(null);
    showToast("Signed out.");
    go("signedout");
  }
  function signIn(email, provider, message = `Signed in with ${provider === "google" ? "Google" : "X"}.`) {
    setUser({ email, hasPassword: provider === "email", google: provider === "google", twitter: provider === "twitter" });
    showToast(message); go(protectedView ? view : "calculator");
  }
  function openRecipe(recipe) {
    setInput(structuredClone(recipe.input)); setName(recipe.name); setEditing(recipe.id); go("recipe");
  }
  function save() {
    const title = name.trim();
    if (!title) { showToast("Recipe title must not be blank.", "error"); return; }
    if (recipes.some((r) => r.id !== editing && r.name.toLowerCase() === title.toLowerCase())) { showToast("You already have a recipe with this name.", "error"); return; }
    const recipe = { id: editing || crypto.randomUUID(), name: title, input: structuredClone(input), date: new Date().toISOString().slice(0, 10) };
    setRecipes(editing ? recipes.map((r) => r.id === editing ? recipe : r) : [recipe, ...recipes]);
    setEditing(recipe.id); setName(title); showToast(editing ? `"${title}" updated.` : `"${title}" saved to your recipes.`);
  }
  function preview(next) {
    setDialog(null); setToast(null);
    if (["guest", "signedout", ...authViews].includes(next)) setUser(null);
    else if (next === "provider-account") setUser({ ...demoUser, hasPassword: false });
    else if (!user) setUser(demoUser);
    if (next === "recipe") { openRecipe(recipes[0] || sampleRecipes[0]); return; }
    if (next === "invalid") setInput({ ...demoInput, targetPg: 5, targetVg: 95 });
    if (next === "calculator" || next === "guest") { setInput(structuredClone(demoInput)); setName(""); setEditing(null); }
    if (next === "signedout") { signOut(); return; }
    go(next);
  }
  function changeVariant(direction) {
    const keys = Object.keys(variants); const next = keys[(keys.indexOf(variant) + direction + keys.length) % keys.length];
    const search = new URLSearchParams(params.toString()); search.set("variant", next);
    router.replace(`/?${search}`, { scroll: false });
  }

  const showNicotine = input.targetNicStrength > 0 || (!editing && !(user && settings?.zero));
  const calcError = getCalculatorStatus(input, calculateResults(input)).error;
  const calculatorProps = {
    target: <Target input={input} setInput={setInput} showNicotine={showNicotine} />,
    ingredients: <Ingredients input={input} setInput={setInput} showNicotine={showNicotine} defaults={user ? settings : null} separateNicotine={variant === "A"} />,
    results: <Results input={input} units={user ? settings?.units || "both" : "both"} showNicotine={showNicotine} />,
    save: <SaveRow name={name} setName={setName} user={user} save={save} editing={editing} error={calcError} signIn={() => go("signin")} />,
  };
  const variantComponent = variant === "A" ? <VariantA {...calculatorProps} /> : variant === "B" ? <VariantB {...calculatorProps} /> : <VariantC {...calculatorProps} />;
  const nav = <nav className="primary-nav" aria-label="Main navigation">{Object.entries(navigation).filter(([key]) => user || key === "calculator").map(([key, label]) => <button key={key} className={view === key || key === "recipes" && ["empty", "loading", "load-error"].includes(view) ? "active" : ""} aria-current={view === key ? "page" : undefined} onClick={() => navigate(key)}><Icon icon={icons[key]} /><span>{label}</span></button>)}</nav>;

  return <div className={`prototype-app variant-${variant}${user ? "" : " signed-out"}`}>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="app-navigation">
      <button className="brand" aria-label="ejuicr calculator" onClick={() => navigate("calculator")}><img src="/assets/logo.svg" width="98" height="23" alt="ejuicr" /></button>
      {nav}
      <div className={variant === "A" ? "sidebar-bottom" : "navigation-end"}>
        {user ? <div className="user-block"><button className="user-button" aria-label="View account" onClick={() => go("myaccount")}><span className="user-avatar"><Icon icon={faUser} /></span><span className="user-label"><span className="user-name">{user.email.split("@")[0]}</span><span className="user-mail">{user.email}</span></span></button>
        </div> : <button className="signin-button" onClick={() => go("signin")}>Sign in<Icon icon={faArrowRight} /></button>}
      </div>
    </header>
    <div className="main-column"><main id="main" tabIndex={-1}>
      {actualView === "calculator" ? <>{editing ? <h1 className="recipe-heading">{recipes.find((recipe) => recipe.id === editing)?.name || name}</h1> : <h1 className="sr-only">Ejuice calculator</h1>}{variantComponent}</>
        : actualView === "settings" ? <Settings saved={settings} onSave={(value) => { setSettings(value); showToast("Settings saved. New batches will use these defaults."); }} />
        : actualView === "myaccount" ? <Account user={user} setUser={setUser} count={recipes.length} go={go} signOut={signOut} confirm={setDialog} showToast={showToast} deleteAccount={() => { setRecipes([]); setSettings(null); setUser(null); setEditing(null); showToast("Account deleted. Your local calculator still works."); go("calculator"); }} />
        : ["recipes", "empty", "loading", "load-error"].includes(actualView) ? <RecipeList recipes={recipes} view={actualView} open={openRecipe} confirm={setDialog} remove={(id) => { setRecipes(recipes.filter((r) => r.id !== id)); if (editing === id) setEditing(null); showToast("Recipe deleted."); }} go={navigate} />
        : authViews.includes(actualView) ? <Auth key={actualView} view={actualView} go={go} signIn={signIn} cancel={() => go("calculator")} />
        : <Information view={actualView} go={go} privacy={privacy} terms={terms} />}
    </main><footer className="app-footer"><div>{Object.entries(documents).map(([key, label]) => <button key={key} onClick={() => go(key)}>{label}</button>)}</div><span><a href="https://www.jimfarrugia.com.au" target="_blank" rel="noreferrer">Jim Farrugia</a><a href="https://twitter.com/ejuicr" target="_blank" rel="noreferrer">@ejuicr</a></span></footer></div>
    {dialog && <Confirmation dialog={dialog} close={() => setDialog(null)} />}
    <div id="toast-root" role="status" aria-live="polite" aria-atomic="true">{toast && <div key={toast.id} className={`toast ${toast.type}`}>
      <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={toast.type === "success" ? "m5 13 4 4L19 7" : "M12 3 2.5 20h19zM12 9v5M12 17h.01"} /></svg>
      <span>{toast.text}</span>
    </div>}</div>
    <PrototypeSwitcher variant={variant} changeVariant={changeVariant} view={rawView} preview={preview} state={{ variant, view: actualView, user, recipeName: name, editing, input, savedRecipes: recipes, settings }} />
  </div>;
}
