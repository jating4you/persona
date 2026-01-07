
/* persona.js — tiny renderer for persona profiles (Bootstrap 5.3) */
(function () {
  const qs = (sel, root=document) => root.querySelector(sel);

  function escapeHtml(str) {
    return (str ?? "").toString()
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function el(tag, attrs={}, children=[]) {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k.startsWith("data-")) node.setAttribute(k, v);
      else node[k] = v;
    });
    for (const c of children) node.appendChild(c);
    return node;
  }

  // Theme handling (light/dark/system)
  const THEME_KEY = "persona-theme";
  const themeBtnId = "personaThemeBtn";

  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(mode) {
    const root = document.documentElement;
    if (mode === "system") {
      root.setAttribute("data-bs-theme", systemPrefersDark() ? "dark" : "light");
    } else {
      root.setAttribute("data-bs-theme", mode);
    }
    const btn = document.getElementById(themeBtnId);
    if (btn) btn.textContent = `Theme: ${mode[0].toUpperCase()}${mode.slice(1)}`;
  }

  function initThemeToggle() {
    const saved = localStorage.getItem(THEME_KEY) || "system";
    applyTheme(saved);

    const btn = document.getElementById(themeBtnId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      const cur = localStorage.getItem(THEME_KEY) || "system";
      const next = cur === "system" ? "light" : (cur === "light" ? "dark" : "system");
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        const cur = localStorage.getItem(THEME_KEY) || "system";
        if (cur === "system") applyTheme("system");
      });
    }
  }

  async function fetchJson(url) {
    const res = await fetch(url, {cache: "no-store"});
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return await res.json();
  }

  function renderHero(hero) {
    const actionsHtml = (hero?.actions || []).map(a => {
      const href = escapeHtml(a.href || "#");
      const label = escapeHtml(a.label || "Open");
      const icon = a.icon ? `<span class="me-1">${escapeHtml(a.icon)}</span>` : "";
      const downloadAttr = a.download ? " download" : "";
      const target = a.target ? ` target="${escapeHtml(a.target)}" rel="noopener"` : "";
      return `<a class="btn btn-sm ${escapeHtml(a.variant||"btn-primary")} me-2 mb-2" href="${href}"${downloadAttr}${target}>${icon}${label}</a>`;
    }).join("");

    const left = `
      <div class="d-flex align-items-center gap-3">
        ${hero?.avatar ? `<img class="avatar" src="${escapeHtml(hero.avatar)}" alt="avatar">` : ""}
        <div>
          <div class="h4 mb-1 hero-title">${escapeHtml(hero.title || "")}</div>
          ${hero?.subtitle ? `<div class="muted">${escapeHtml(hero.subtitle)}</div>` : ""}
          ${hero?.meta ? `<div class="small muted mt-1">${escapeHtml(hero.meta)}</div>` : ""}
        </div>
      </div>
    `;

    const right = actionsHtml ? `<div class="text-md-end mt-3 mt-md-0">${actionsHtml}</div>` : "";

    return `
      <div class="persona-card p-4 mb-4">
        <div class="row align-items-center">
          <div class="col-md-8">${left}</div>
          <div class="col-md-4">${right}</div>
        </div>
      </div>
    `;
  }

  function renderText(text) {
    const parts = (text || "").split(/\n\s*\n/g).map(p => p.trim()).filter(Boolean);
    return parts.map(p => `<p class="mb-3">${escapeHtml(p)}</p>`).join("");
  }

  function renderKv(section) {
    const rows = (section.rows || []).map(r => `
      <tr>
        <th class="text-nowrap" style="width: 34%">${escapeHtml(r.label)}</th>
        <td>${escapeHtml(r.value)}</td>
      </tr>
    `).join("");
    return `
      <div class="persona-card p-4 mb-4">
        <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
        <div class="table-responsive">
          <table class="table table-sm align-middle mb-0">
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderBadges(section) {
    const groups = (section.groups || []).map(g => {
      const badges = (g.items || []).map(i => `<span class="badge text-bg-secondary me-2 mb-2">${escapeHtml(i)}</span>`).join("");
      return `
        <div class="mb-3">
          <div class="fw-semibold mb-2">${escapeHtml(g.title || "")}</div>
          <div>${badges}</div>
        </div>
      `;
    }).join("");
    return `
      <div class="persona-card p-4 mb-4">
        <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
        ${groups}
      </div>
    `;
  }

  function renderTimeline(section) {
    const items = (section.items || []).map(it => {
      const bullets = (it.bullets || []).map(b => `<li>${escapeHtml(b)}</li>`).join("");
      return `
        <div class="timeline-item">
          <div class="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
            <div class="fw-semibold">${escapeHtml(it.title || "")}</div>
            ${it.period ? `<div class="small muted">${escapeHtml(it.period)}</div>` : ""}
          </div>
          ${it.subtitle ? `<div class="small muted mb-2">${escapeHtml(it.subtitle)}</div>` : ""}
          ${bullets ? `<ul class="mb-0">${bullets}</ul>` : ""}
        </div>
      `;
    }).join("");
    return `
      <div class="persona-card p-4 mb-4">
        <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
        <div class="timeline">${items}</div>
      </div>
    `;
  }

  function renderCards(section) {
    const cards = (section.items || []).map(it => {
      const links = (it.links || []).map(l => {
        const href = escapeHtml(l.href || "#");
        const label = escapeHtml(l.label || "Link");
        const target = l.target ? ` target="${escapeHtml(l.target)}" rel="noopener"` : "";
        return `<a class="btn btn-sm btn-outline-primary me-2 mb-2" href="${href}"${target}>${label}</a>`;
      }).join("");
      const body = it.body ? renderText(it.body) : "";
      return `
        <div class="col-md-6">
          <div class="persona-card p-4 h-100">
            <div class="fw-semibold mb-1">${escapeHtml(it.title || "")}</div>
            ${it.subtitle ? `<div class="small muted mb-2">${escapeHtml(it.subtitle)}</div>` : ""}
            ${body}
            ${links ? `<div class="mt-2">${links}</div>` : ""}
          </div>
        </div>
      `;
    }).join("");
    return `
      <div class="mb-4">
        <div class="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-2">
          <h2 class="h5 section-title mb-0">${escapeHtml(section.title || "")}</h2>
          ${section.note ? `<div class="small muted">${escapeHtml(section.note)}</div>` : ""}
        </div>
        <div class="row g-3">${cards}</div>
      </div>
    `;
  }

  function renderDownloads(section) {
    const items = (section.items || []).map(it => {
      const href = escapeHtml(it.file || "#");
      const label = escapeHtml(it.label || "Download");
      const note = it.note ? `<div class="small muted">${escapeHtml(it.note)}</div>` : "";
      return `
        <div class="d-flex align-items-center justify-content-between gap-3 py-2 border-bottom">
          <div>
            <div class="fw-semibold">${label}</div>
            ${note}
          </div>
          <a class="btn btn-sm btn-primary" href="${href}" download>Download</a>
        </div>
      `;
    }).join("");
    return `
      <div class="persona-card p-4 mb-4">
        <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
        <div>${items}</div>
      </div>
    `;
  }

  function renderGallery(section) {
    const imgs = (section.images || []).map(src => `
      <div class="col-6 col-md-4">
        <div class="persona-card p-2 h-100">
          <img src="${escapeHtml(src)}" class="img-fluid rounded" alt="photo">
        </div>
      </div>
    `).join("");
    return `
      <div class="mb-4">
        <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
        <div class="row g-3">${imgs}</div>
      </div>
    `;
  }

  function renderSection(section) {
    switch (section.type) {
      case "text":
        return `
          <div class="persona-card p-4 mb-4">
            <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "")}</h2>
            ${renderText(section.body || "")}
          </div>
        `;
      case "kv": return renderKv(section);
      case "badges": return renderBadges(section);
      case "timeline": return renderTimeline(section);
      case "cards": return renderCards(section);
      case "downloads": return renderDownloads(section);
      case "gallery": return renderGallery(section);
      default:
        return `
          <div class="persona-card p-4 mb-4">
            <h2 class="h5 section-title mb-3">${escapeHtml(section.title || "Section")}</h2>
            <div class="small muted">Unknown section type: ${escapeHtml(section.type)}</div>
          </div>
        `;
    }
  }

  async function renderProfilePage() {
    const dataUrl = window.PERSONA_DATA_URL;
    const app = qs("#app");
    if (!app) return;

    try {
      const data = await fetchJson(dataUrl);
      document.title = `${data?.hero?.title || "Profile"} · persona`;

      const navTitle = qs("#navTitle");
      if (navTitle) navTitle.textContent = data?.navTitle || "persona";

      const main = el("main", {class: "container my-4"});
      main.innerHTML = `
        ${renderHero(data.hero || {})}
        ${(data.sections || []).map(renderSection).join("")}
        <div class="text-center small muted py-4">persona · static profiles</div>
      `;
      app.replaceChildren(main);
    } catch (e) {
      app.innerHTML = `
        <main class="container my-5">
          <div class="persona-card p-4">
            <h1 class="h4 mb-2">Failed to load profile</h1>
            <div class="muted mb-3">${escapeHtml(e.message || String(e))}</div>
            <div class="small muted">If running locally, start a server: <code>python3 -m http.server 8080</code></div>
          </div>
        </main>
      `;
      console.error(e);
    }
  }

  async function renderLandingPage() {
    const dataUrl = window.PERSONA_DATA_URL;
    const app = qs("#app");
    if (!app) return;

    try {
      const data = await fetchJson(dataUrl);
      document.title = "persona · fairs";

      const groups = (data.groups || []).map(g => {
        const cards = (g.items || []).map(it => `
          <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
            <div class="persona-card p-3 h-100">
              <div class="d-flex align-items-center gap-3">
                <img class="avatar" src="${escapeHtml(it.avatar)}" alt="avatar">
                <div class="flex-grow-1">
                  <div class="fw-semibold">${escapeHtml(it.name)}</div>
                  ${it.note ? `<div class="small muted">${escapeHtml(it.note)}</div>` : ""}
                </div>
              </div>
              <div class="mt-3">
                <a class="btn btn-sm btn-primary w-100" href="${escapeHtml(it.href)}">Open</a>
              </div>
            </div>
          </div>
        `).join("");

        return `
          <section class="mb-4">
            <div class="d-flex align-items-baseline justify-content-between flex-wrap gap-2 mb-2">
              <h2 class="h5 section-title mb-0">${escapeHtml(g.title)}</h2>
              ${g.subtitle ? `<div class="small muted">${escapeHtml(g.subtitle)}</div>` : ""}
            </div>
            <div class="row g-3">${cards}</div>
          </section>
        `;
      }).join("");

      const business = data.business
        ? `
          <section class="mb-5">
            <div class="persona-card p-4">
              <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <div class="h5 mb-1">${escapeHtml(data.business.title || "Business")}</div>
                  <div class="muted">${escapeHtml(data.business.subtitle || "")}</div>
                </div>
                <a class="btn btn-primary" href="${escapeHtml(data.business.href || "business/")}">Open Business</a>
              </div>
            </div>
          </section>
        ` : "";

      const main = el("main", {class: "container my-4"});
      main.innerHTML = `
        <div class="persona-card p-4 mb-4">
          <div class="d-flex align-items-start justify-content-between flex-wrap gap-3">
            <div>
              <div class="display-6 fw-bold hero-title mb-1">${escapeHtml(data.title || "Persona Fairs")}</div>
              <div class="muted">${escapeHtml(data.subtitle || "Curated entry points. Profiles are link-based and not cross-linked.")}</div>
            </div>
            <div class="small muted">${escapeHtml(data.note || "")}</div>
          </div>
        </div>
        ${business}
        ${groups}
        <div class="text-center small muted py-4">persona · Bootstrap 5.3 · static</div>
      `;
      app.replaceChildren(main);
    } catch (e) {
      app.innerHTML = `
        <main class="container my-5">
          <div class="persona-card p-4">
            <h1 class="h4 mb-2">Failed to load site</h1>
            <div class="muted mb-3">${escapeHtml(e.message || String(e))}</div>
          </div>
        </main>
      `;
      console.error(e);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    if (window.PERSONA_PAGE === "landing") renderLandingPage();
    else if (window.PERSONA_PAGE === "profile") renderProfilePage();
    else if (window.PERSONA_PAGE === "business") renderProfilePage();
  });
})();
