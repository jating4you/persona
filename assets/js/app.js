(async function () {
  const CONFIG_PATH = "config/site.json";

  // ----- Theme (light/dark) -----
  function getStoredTheme() {
    const t = localStorage.getItem("theme");
    return t === "dark" || t === "light" ? t : null;
  }

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const btn = qs("#theme-toggle");
    if (btn) {
      // Button shows the NEXT theme (what will happen on click)
      const next = theme === "dark" ? "Light" : "Dark";
      btn.textContent = next;
      btn.setAttribute("aria-label", `Switch to ${next} mode`);
    }
  }

  function initThemeToggle() {
    const initial = getStoredTheme() || (systemPrefersDark() ? "dark" : "light");
    applyTheme(initial);
    const btn = qs("#theme-toggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      applyTheme(next);
    });
  }

  function qs(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
      person: p.get("person"),
      profile: p.get("profile"),
    };
  }

  function baseHref(params) {
    // Relative links that work for both /repo/ and /repo/index.html on GitHub Pages.
    const p = new URLSearchParams();
    if (params.person) p.set("person", params.person);
    if (params.profile) p.set("profile", params.profile);
    const q = p.toString();
    return q ? `./?${q}` : "./";
  }

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  function pickFirstEnabledPerson(cfg) {
    const people = cfg.people || {};
    const keys = Object.keys(people);
    for (const k of keys) {
      if (people[k]?.enabled) return k;
    }
    return null;
  }

  function pickFirstEnabledProfileForPerson(cfg, personKey) {
    const person = cfg.people?.[personKey];
    if (!person) return null;
    const profiles = person.profiles || {};
    const keys = Object.keys(profiles);
    for (const k of keys) {
      if (profiles[k]?.enabled) return k;
    }
    return null;
  }

  function normalizeSelection(cfg, desiredPerson, desiredProfile) {
    const defaults = cfg.defaults || {};
    let person = desiredPerson || defaults.person || pickFirstEnabledPerson(cfg);
    if (!cfg.people?.[person]?.enabled) {
      person = defaults.person && cfg.people?.[defaults.person]?.enabled
        ? defaults.person
        : pickFirstEnabledPerson(cfg);
    }

    let profile = desiredProfile || defaults.profile || pickFirstEnabledProfileForPerson(cfg, person);
    if (!cfg.people?.[person]?.profiles?.[profile]?.enabled) {
      profile = defaults.profile && cfg.people?.[person]?.profiles?.[defaults.profile]?.enabled
        ? defaults.profile
        : pickFirstEnabledProfileForPerson(cfg, person);
    }

    return { person, profile };
  }

  function setActiveTab(container, activeKey) {
    [...container.querySelectorAll("a.tab")].forEach(a => {
      const key = a.getAttribute("data-key");
      a.classList.toggle("active", key === activeKey);
    });
  }

  function renderSelectOptions(selectEl, options, activeKey) {
    selectEl.innerHTML = "";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.key;
      o.textContent = opt.label;
      if (opt.key === activeKey) o.selected = true;
      selectEl.appendChild(o);
    }
  }

  function renderTabs(container, items, activeKey) {
    container.innerHTML = "";
    for (const it of items) {
      const a = document.createElement("a");
      a.className = "tab" + (it.key === activeKey ? " active" : "");
      a.href = it.href;
      a.textContent = it.label;
      a.setAttribute("data-key", it.key);
      container.appendChild(a);
    }
  }

  function renderQuickLinks(cfg, personKey, activeProfileKey) {
    const grid = qs("#quick-links-grid");
    grid.innerHTML = "";
    const person = cfg.people?.[personKey];
    if (!person?.enabled) return;

    for (const [profileKey, prof] of Object.entries(person.profiles || {})) {
      if (!prof.enabled) continue;
      const a = document.createElement("a");
      a.className = "quick-link" + (profileKey === activeProfileKey ? " active" : "");
      a.href = baseHref({ person: personKey, profile: profileKey });
      a.innerHTML = `<strong>${esc(cfg.profiles?.[profileKey]?.label || profileKey)}</strong><small>Open</small>`;
      grid.appendChild(a);
    }
  }

  function renderValue(val) {
    if (val === null || val === undefined) return `<span class="muted">—</span>`;

    // Link object: {label, href, download?}
    if (typeof val === "object" && !Array.isArray(val)) {
      const href = val.href ? String(val.href) : "";
      const label = val.label ? String(val.label) : href;
      const downloadAttr = val.download ? " download" : "";
      const targetAttr = href.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<a href="${esc(href)}"${downloadAttr}${targetAttr}>${esc(label)}</a>`;
    }

    if (Array.isArray(val)) {
      const items = val.map(v => `<li>${esc(v)}</li>`).join("");
      return `<ul>${items}</ul>`;
    }

    const s = String(val);
    // Auto-link for pdf/url (string)
    const isUrl = s.startsWith("http://") || s.startsWith("https://") || s.startsWith("mailto:");
    const isPdf = s.toLowerCase().endsWith(".pdf");
    if (isUrl || isPdf) {
      const targetAttr = s.startsWith("http") ? ` target="_blank" rel="noopener noreferrer"` : "";
      const downloadAttr = isPdf ? " download" : "";
      return `<a href="${esc(s)}"${downloadAttr}${targetAttr}>${esc(s)}</a>`;
    }

    return esc(s);
  }

  function renderSections(profileData) {
    const sectionsEl = qs("#sections");
    sectionsEl.innerHTML = "";

    const sections = profileData.sections || [];
    if (!sections.length) {
      sectionsEl.innerHTML = `<div class="card"><h2>No sections</h2><p class="muted">Add sections in the JSON data file.</p></div>`;
      return;
    }

    for (const section of sections) {
      if (!section.visible) continue;

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<h2>${esc(section.title || "Section")}</h2>`;

      if (section.kind !== "keyValue") {
        const p = document.createElement("p");
        p.className = "muted";
        p.textContent = `Unsupported section kind: ${section.kind}`;
        card.appendChild(p);
        sectionsEl.appendChild(card);
        continue;
      }

      const dl = document.createElement("div");
      dl.className = "kv";

      const content = section.content || {};
      for (const [k, v] of Object.entries(content)) {
        const row = document.createElement("div");
        row.className = "kv-row";
        row.innerHTML = `
          <div class="kv-key">${esc(k)}</div>
          <div class="kv-val">${renderValue(v)}</div>
        `;
        dl.appendChild(row);
      }

      card.appendChild(dl);
      sectionsEl.appendChild(card);
    }
  }

  function updateHero(personLabel, profileLabel, headline) {
    qs("#hero-title").textContent = `${personLabel} — ${profileLabel}`;
    qs("#hero-subtitle").textContent = headline || "";
  }

  function installCopyLink(currentHref) {
    const link = qs("#share-link");
    link.href = currentHref;
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        await navigator.clipboard.writeText(new URL(currentHref, window.location.href).toString());
        link.textContent = "Copied!";
        setTimeout(() => link.textContent = "Copy Link", 900);
      } catch {
        // Fallback: just navigate
        window.location.href = currentHref;
      }
    }, { once: true });
  }

  try {
    const cfg = await fetchJson(CONFIG_PATH);

    // Theme toggle (works on GitHub Pages + locally)
    initThemeToggle();

    // header text
    qs("#site-title").textContent = cfg.site?.title || "Multi-Profile Static Site";
    qs("#site-tagline").textContent = cfg.site?.tagline || "";

    const params = getParams();
    const sel = normalizeSelection(cfg, params.person, params.profile);

    // Show current person (do not list other people on the page)
    const personLabel = cfg.people?.[sel.person]?.label || sel.person;
    const personDisplay = qs("#person-display");
    if (personDisplay) personDisplay.textContent = personLabel;

    const profileOptions = Object.entries(cfg.people?.[sel.person]?.profiles || {})
      .filter(([_, p]) => p.enabled)
      .map(([key, _p]) => ({ key, label: cfg.profiles?.[key]?.label || key }));

    // dropdown (profiles only)
    renderSelectOptions(qs("#profile-select"), profileOptions, sel.profile);

    qs("#profile-select").addEventListener("change", (e) => {
      const nextProfile = e.target.value;
      window.location.href = baseHref({ person: sel.person, profile: nextProfile });
    });

    // tabs
    const profileTabs = profileOptions.map(p => ({
      key: p.key,
      label: p.label,
      href: baseHref({ person: sel.person, profile: p.key }),
    }));
    renderTabs(qs("#profile-tabs"), profileTabs, sel.profile);

    // quick links (profiles for current person only)
    renderQuickLinks(cfg, sel.person, sel.profile);

    // load profile data
    const dataFile = cfg.people?.[sel.person]?.profiles?.[sel.profile]?.dataFile;
    if (!dataFile) throw new Error("Missing dataFile for the selected person/profile.");

    const profileData = await fetchJson(dataFile);

    // hero
    const profileLabel = cfg.profiles?.[sel.profile]?.label || sel.profile;
    updateHero(personLabel, profileLabel, profileData.headline);

    // sections
    renderSections(profileData);

    // copy link
    installCopyLink(baseHref({ person: sel.person, profile: sel.profile }));

  } catch (err) {
    console.error(err);
    document.body.innerHTML = `
      <div class="container" style="padding: 24px 0;">
        <h1>Failed to load site</h1>
        <p class="muted">${esc(err?.message || err)}</p>
        <p class="muted">If running locally, start a server: <code>python3 -m http.server 8080</code></p>
      </div>
    `;
  }
})();
