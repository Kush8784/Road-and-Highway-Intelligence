/* ITIS dashboard prototype — vanilla JS, no build step, no external runtime deps.
 * Reads window.ITIS_DATA (sample-data.js) and window.ITIS_BASEMAP (india-states.js).
 * Structure: 1 constants · 2 derivation · 3 filters/state · 4 views · 5 drawer · 6 search · 7 boot
 */
(function () {
  "use strict";
  const D = window.ITIS_DATA;
  const BASE = window.ITIS_BASEMAP || [];
  const AS_OF = D.meta.researched_on;

  // ------------------------------------------------------------ 1 CONSTANTS
  // The 28-status taxonomy. Statuses are never merged; `group` is only a display bucket.
  const STATUS = [
    ["CONCEPT", "Concept / Proposed", "PRE"], ["FEASIBILITY", "Feasibility Study", "PRE"], ["DPR_PREPARATION", "DPR Preparation", "PRE"],
    ["DPR_COMPLETED", "DPR Completed", "PRE"], ["CLEARANCES", "Environmental / Forest / Land Approval", "PRE"], ["APPROVED", "Approved", "PRE"],
    ["TENDER_EXPECTED", "Tender Expected", "PRE"], ["TENDER_ISSUED", "Tender Issued", "PRE"], ["BID_EVALUATION", "Bid Evaluation", "PRE"],
    ["AWARDED", "Awarded", "PRE"], ["LOA_ISSUED", "LOA Issued", "PRE"], ["FC_PENDING", "Financial Closure Pending", "PRE"],
    ["LAND_ACQUISITION", "Land Acquisition / Pre-Construction", "PRE"], ["MOBILIZATION", "Mobilization", "CON"], ["UNDER_CONSTRUCTION", "Under Construction", "CON"],
    ["DELAYED", "Delayed", "CON"], ["STALLED", "Stalled", "CON"], ["PARTIALLY_OPERATIONAL", "Partially Operational", "CON"],
    ["PACKAGE_WISE_CONSTRUCTION", "Package-wise Construction", "CON"], ["SUBSTANTIALLY_COMPLETED", "Substantially Completed", "DONE"], ["COMPLETED", "Completed", "DONE"],
    ["OPERATIONAL", "Operational", "DONE"], ["OPEN_TO_TRAFFIC", "Open to Traffic", "DONE"], ["CANCELLED", "Cancelled", "OTHER"],
    ["TERMINATED", "Terminated", "OTHER"], ["RE_TENDERED", "Re-tendered", "OTHER"], ["DISPUTED", "Disputed", "OTHER"], ["UNKNOWN", "Unknown / Status Requires Verification", "OTHER"],
  ].map(([code, label, phase], i) => ({ code, label, phase, n: i + 1 }));
  const S = Object.fromEntries(STATUS.map((s) => [s.code, s]));

  // Display groups: colour + glyph + line dash (never colour alone).
  const GROUPS = [
    { id: "proposed", label: "Proposed / Approved", color: "--st-proposed", glyph: "○", dash: "2 5", codes: ["CONCEPT", "FEASIBILITY", "DPR_PREPARATION", "DPR_COMPLETED", "CLEARANCES", "APPROVED", "TENDER_EXPECTED", "FC_PENDING", "LAND_ACQUISITION"] },
    { id: "tendered", label: "Tendered", color: "--st-tendered", glyph: "◇", dash: "6 4", codes: ["TENDER_ISSUED", "BID_EVALUATION", "RE_TENDERED"] },
    { id: "awarded", label: "Awarded", color: "--st-awarded", glyph: "◆", dash: "10 3", codes: ["AWARDED", "LOA_ISSUED", "MOBILIZATION"] },
    { id: "construction", label: "Under construction", color: "--st-construction", glyph: "▲", dash: "", codes: ["UNDER_CONSTRUCTION", "PACKAGE_WISE_CONSTRUCTION"] },
    { id: "partial", label: "Partially operational", color: "--st-partial", glyph: "◐", dash: "14 3 2 3", codes: ["PARTIALLY_OPERATIONAL"] },
    { id: "delayed", label: "Delayed", color: "--st-delayed", glyph: "✕", dash: "8 3 2 3", codes: ["DELAYED"] },
    { id: "stalled", label: "Stalled / Disputed", color: "--st-stalled", glyph: "‖", dash: "2 3", codes: ["STALLED", "DISPUTED"] },
    { id: "complete", label: "Completed / Operational", color: "--st-complete", glyph: "●", dash: "", codes: ["SUBSTANTIALLY_COMPLETED", "COMPLETED", "OPERATIONAL", "OPEN_TO_TRAFFIC"] },
    { id: "cancelled", label: "Cancelled / Terminated", color: "--st-cancelled", glyph: "⊘", dash: "1 4", codes: ["CANCELLED", "TERMINATED", "UNKNOWN"] },
  ];
  const groupOf = (code) => GROUPS.find((g) => g.codes.includes(code)) || GROUPS[GROUPS.length - 1];

  const STAGES = [
    { id: "PROPOSED", codes: ["CONCEPT", "FEASIBILITY", "DPR_PREPARATION"] },
    { id: "DPR", codes: ["DPR_COMPLETED"] },
    { id: "APPROVED", codes: ["CLEARANCES", "APPROVED", "FC_PENDING", "LAND_ACQUISITION"] },
    { id: "TENDERED", codes: ["TENDER_EXPECTED", "TENDER_ISSUED", "BID_EVALUATION", "RE_TENDERED"] },
    { id: "AWARDED", codes: ["AWARDED", "LOA_ISSUED"] },
    { id: "CONSTRUCTION", codes: ["MOBILIZATION", "UNDER_CONSTRUCTION", "DELAYED", "STALLED", "PARTIALLY_OPERATIONAL", "PACKAGE_WISE_CONSTRUCTION", "DISPUTED"] },
    { id: "COMPLETED", codes: ["SUBSTANTIALLY_COMPLETED", "COMPLETED"] },
    { id: "OPERATIONAL", codes: ["OPERATIONAL", "OPEN_TO_TRAFFIC"] },
  ];
  const RADAR = [
    { id: "TENDER_EXPECTED", label: "Tender expected", q: "Approved projects likely to enter procurement — based on documented approvals" },
    { id: "TENDER_ISSUED", label: "Tender issued", q: "Active procurement with a captured tender notice" },
    { id: "RECENTLY_AWARDED", label: "Recently awarded", q: "Awards since 2024 — downstream procurement window" },
    { id: "CONSTRUCTION", label: "Construction", q: "Active works — systems / technology packages typically follow civil works" },
    { id: "UPCOMING_PHASE", label: "Upcoming phase", q: "Next phases announced for existing corridors" },
    { id: "RE_TENDER", label: "Re-tender / pending award", q: "Packages returning to procurement or stuck in evaluation" },
  ];
  const TIER = { 1: "T1 Official", 2: "T2 Company", 3: "T3 Publication", 4: "T4 Discovery" };
  const CONF_W = { VERIFIED: 1, CROSS_VERIFIED: 0.9, REPORTED: 0.6, INFERRED: 0.35, UNKNOWN: 0 };

  // ------------------------------------------------------------ helpers
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d = 0) => (n == null || isNaN(n) ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: 0 }));
  const cr = (n) => (n == null ? "—" : "₹" + fmt(n, n < 100 ? 2 : 0) + " cr");
  const lakhCr = (n) => (n >= 100000 ? "₹" + fmt(n / 100000, 2) + " L cr" : cr(n));
  const cssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const uniq = (a) => Array.from(new Set(a.filter((x) => x != null)));
  const src = Object.fromEntries(D.sources.map((s) => [s.id, s]));
  const co = Object.fromEntries(D.companies.map((c) => [c.id, c]));
  const au = Object.fromEntries(D.authorities.map((a) => [a.id, a]));
  const srcLink = (id) => { const s = src[id]; return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener" title="${esc(s.publisher + " — " + s.title)}">${esc(id)}</a><span class="muted"> T${s.tier}</span>` : `<span class="muted">${esc(id || "—")}</span>`; };
  const cf = (c) => `<span class="cf ${esc(c || "UNKNOWN")}">${esc((c || "UNKNOWN").replace("_", "-"))}</span>`;
  const stPill = (code) => { const g = groupOf(code); const s = S[code]; return `<span class="st" style="color:var(${g.color})"><i aria-hidden="true">${g.glyph}</i><span style="color:var(--text-1)">${esc(s ? s.label : code)}</span></span>`; };
  const evPill = (e) => (e.status ? stPill(e.status) : `<span class="st"><i aria-hidden="true" style="color:var(--text-3)">•</i><span>Milestone / note</span></span>`);
  const coName = (id) => (co[id] ? co[id].name : id);
  const coLink = (id) => `<span class="link" data-company="${esc(id)}">${esc(coName(id))}</span>`;
  const projLink = (p) => `<span class="link" data-project="${esc(p.id)}">${esc(p.name)}</span>`;
  const dateKey = (d) => (d ? String(d).padEnd(10, "-") : "");

  // ------------------------------------------------------------ 2 DERIVATION
  const P = D.projects.map((p) => {
    const ref = p.values.find((v) => v.ref) || null;
    const costVals = p.values.filter((v) => !/expenditure|increase|variation/i.test(v.type) && !v.computed);
    const members = [];
    p.packages.forEach((k) => k.contractor && k.contractor.members.forEach((m) => members.push({ ...m, pkg: k })));
    const companies = uniq(members.map((m) => m.company));
    const srcIds = uniq([p.status_source, ...p.values.map((v) => v.source), ...p.events.map((e) => e.source), ...p.risks.map((r) => r.source), ...p.packages.map((k) => k.source), p.opportunity && p.opportunity.source]);
    const pubDates = srcIds.map((id) => src[id] && src[id].pub_date).filter(Boolean).sort();
    return Object.assign({}, p, {
      group: groupOf(p.status), stage: (STAGES.find((s) => s.codes.includes(p.status)) || {}).id || null,
      refValue: ref ? ref.value_cr : null, refValueObj: ref, conflict: !!p.value_conflict || (!ref && costVals.length > 1),
      members, companies, srcIds, lastSourcePub: pubDates[pubDates.length - 1] || null,
      authority: au[p.authority_id] || null,
    });
  });
  const PI = Object.fromEntries(P.map((p) => [p.id, p]));

  // Data-confidence score (0–100). Documented in docs/spec/06-data-quality-framework.md
  function confidence(p) {
    const tiers = p.srcIds.map((id) => (src[id] ? src[id].tier : 4));
    const best = Math.min(...tiers);
    const quality = ({ 1: 1, 2: 0.8, 3: 0.6, 4: 0.3 }[best] * 0.5) + (CONF_W[p.confidence] || 0) * 0.5;
    const pubs = uniq(p.srcIds.map((id) => src[id] && src[id].publisher));
    const independence = Math.min(1, (pubs.length - 1) / 3);
    const lastDate = [p.status_asof, p.lastSourcePub].filter(Boolean).sort().pop();
    const toDate = (d) => (/^\d{4}$/.test(d) ? d + "-07-01" : /^\d{4}-\d{2}$/.test(d) ? d + "-15" : d); // mid-period for coarse dates
    const ageDays = lastDate ? (new Date(AS_OF) - new Date(toDate(lastDate))) / 864e5 : 9999;
    const recency = ageDays < 180 ? 1 : ageDays < 365 ? 0.75 : ageDays < 730 ? 0.5 : 0.25;
    const fields = [p.refValue != null, p.companies.length > 0 || p.packages_summary.count === 0, p.geom && p.geom.coords.length > 0, !!(p.dates.actual_completion || p.dates.revised_completion || p.dates.planned_completion), !!p.authority_id, p.length_km != null];
    const completeness = fields.filter(Boolean).length / fields.length;
    const score = Math.round(100 * (0.35 * quality + 0.2 * independence + 0.2 * recency + 0.25 * completeness));
    return { score, quality, independence, recency, completeness, ageDays: Math.round(ageDays), lastDate };
  }
  P.forEach((p) => (p.dq = confidence(p)));

  // ------------------------------------------------------------ 3 FILTER STATE
  const F = { state: "", type: "", group: "", authority: "", company: "", minValue: 0, kpi: "" };
  const hiddenGroups = new Set();
  function filtered() {
    return P.filter((p) =>
      (!F.state || p.states.includes(F.state)) &&
      (!F.type || p.type === F.type) &&
      (!F.group || p.group.id === F.group) &&
      (!F.authority || p.authority_id === F.authority) &&
      (!F.company || p.companies.includes(F.company)) &&
      (!F.minValue || (p.refValue || 0) >= F.minValue) &&
      kpiPass(p));
  }
  function kpiPass(p) {
    switch (F.kpi) {
      case "bridge": return p.type === "Bridge";
      case "tunnel": return p.type === "Tunnel";
      case "expressway": return p.type === "Expressway";
      case "planned": return p.status && S[p.status] && S[p.status].phase === "PRE";
      case "awarded": return p.packages.some((k) => k.contractor);
      default: return true;
    }
  }
  function setFilter(k, v) { F[k] = F[k] === v ? (k === "minValue" ? 0 : "") : v; syncControls(); renderAll(); }

  function fillSelect(id, opts, label) {
    const el = $(id);
    el.innerHTML = `<option value="">${label}</option>` + opts.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("");
  }
  function initControls() {
    const states = uniq(P.flatMap((p) => p.states)).sort();
    fillSelect("#f-state", states.map((s) => [s, s]), "All");
    fillSelect("#f-type", uniq(P.map((p) => p.type)).sort().map((t) => [t, t]), "All");
    fillSelect("#f-status", GROUPS.map((g) => [g.id, g.glyph + " " + g.label]), "All");
    fillSelect("#f-authority", D.authorities.map((a) => [a.id, a.short]), "All");
    fillSelect("#f-company", D.companies.slice().sort((a, b) => a.name.localeCompare(b.name)).map((c) => [c.id, c.name]), "All");
    [["#f-state", "state"], ["#f-type", "type"], ["#f-status", "group"], ["#f-authority", "authority"], ["#f-company", "company"]].forEach(([sel, key]) => $(sel).addEventListener("change", (e) => { F[key] = e.target.value; renderAll(); }));
    $("#f-value").addEventListener("change", (e) => { F.minValue = Number(e.target.value); renderAll(); });
    $("#clear-filters").addEventListener("click", () => { Object.assign(F, { state: "", type: "", group: "", authority: "", company: "", minValue: 0, kpi: "" }); syncControls(); renderAll(); });
  }
  function syncControls() {
    $("#f-state").value = F.state; $("#f-type").value = F.type; $("#f-status").value = F.group;
    $("#f-authority").value = F.authority; $("#f-company").value = F.company; $("#f-value").value = String(F.minValue);
  }
  function renderChips() {
    const chips = [];
    if (F.state) chips.push(["state", "State: " + F.state]);
    if (F.type) chips.push(["type", "Type: " + F.type]);
    if (F.group) chips.push(["group", "Status: " + GROUPS.find((g) => g.id === F.group).label]);
    if (F.authority) chips.push(["authority", "Authority: " + au[F.authority].short]);
    if (F.company) chips.push(["company", "Company: " + coName(F.company)]);
    if (F.minValue) chips.push(["minValue", "Value ≥ ₹" + fmt(F.minValue) + " cr"]);
    if (F.kpi) chips.push(["kpi", "KPI: " + F.kpi]);
    $("#active-chips").innerHTML = chips.map(([k, t]) => `<span class="chip" data-clear="${k}" title="Remove filter">${esc(t)} ✕</span>`).join("");
    $$("#active-chips .chip").forEach((c) => c.addEventListener("click", () => { const k = c.dataset.clear; F[k] = k === "minValue" ? 0 : ""; syncControls(); renderAll(); }));
  }

  // ------------------------------------------------------------ 4 VIEWS
  // ---- KPI bar
  function renderKPIs(list) {
    const sum = (a) => a.reduce((s, x) => s + (x || 0), 0);
    const inGroup = (ids) => list.filter((p) => ids.includes(p.group.id)).length;
    const cos = uniq(list.flatMap((p) => p.companies));
    const auths = uniq(list.map((p) => p.authority_id));
    const conflicted = list.filter((p) => p.refValue == null && p.values.length).length;
    const K = [
      { k: "", label: "Total projects", val: list.length, sub: "in current filter" },
      { k: "value", label: "Σ reference value", val: lakhCr(sum(list.map((p) => p.refValue))), sub: conflicted ? `${conflicted} excluded (conflict)` : "ref. values only" },
      { g: "construction", label: "Under construction", val: inGroup(["construction"]) },
      { g: "complete", label: "Completed / Oper.", val: inGroup(["complete"]) },
      { k: "planned", label: "Planned (pre-constr.)", val: list.filter((p) => S[p.status].phase === "PRE").length },
      { g: "tendered", label: "Tendered", val: inGroup(["tendered"]) },
      { k: "awarded", label: "With awarded pkgs", val: list.filter((p) => p.packages.some((k) => k.contractor)).length },
      { g: "delayed", label: "Delayed", val: inGroup(["delayed"]) + list.filter((p) => p.group.id !== "delayed" && p.events.some((e) => e.status === "DELAYED")).length, sub: "status or delay event" },
      { g: "stalled", label: "Stalled", val: inGroup(["stalled"]) },
      { k: "", label: "Total length", val: fmt(sum(list.map((p) => p.length_km))) + " km", sub: "reported lengths" },
      { k: "expressway", label: "Expressway km", val: fmt(sum(list.filter((p) => p.type === "Expressway").map((p) => p.length_km))) },
      { k: "bridge", label: "Bridge projects", val: list.filter((p) => p.type === "Bridge").length },
      { k: "tunnel", label: "Tunnel projects", val: list.filter((p) => p.type === "Tunnel").length },
      { view: "contractors", label: "Active contractors", val: cos.length, sub: "ingested pkgs" },
      { view: "authorities", label: "Active authorities", val: auths.length },
    ];
    $("#kpis").innerHTML = K.map((x, i) => `<button class="kpi ${(x.g && F.group === x.g) || (x.k && F.kpi === x.k) ? "on" : ""}" data-i="${i}"><span class="k-label">${esc(x.label)}</span><span class="k-val">${x.val}</span>${x.sub ? `<span class="k-sub">${esc(x.sub)}</span>` : ""}</button>`).join("");
    $$("#kpis .kpi").forEach((b) => b.addEventListener("click", () => {
      const x = K[+b.dataset.i];
      if (x.g) setFilter("group", x.g);
      else if (x.view) showView(x.view);
      else if (["planned", "awarded", "bridge", "tunnel", "expressway"].includes(x.k)) setFilter("kpi", x.k);
      else if (x.k === "value") showView("projects");
    }));
  }

  // ---- MAP
  const LON0 = 67.5, LAT0 = 37.8, KX = Math.cos((22 * Math.PI) / 180);
  const proj = ([lat, lng]) => [(lng - LON0) * KX, LAT0 - lat];
  const projLL = ([lng, lat]) => [(lng - LON0) * KX, LAT0 - lat];
  const MAPV = { k: 1, tx: 0, ty: 0 };
  let mapFit = null;
  const basePaths = BASE.map((s) => ({ name: s.name, d: s.rings.map((r) => "M" + r.map((pt) => projLL(pt).map((v) => v.toFixed(3)).join(",")).join("L") + "Z").join(""), c: centroid(s.rings) }));
  function centroid(rings) { let best = rings[0], area = 0; rings.forEach((r) => { const a = Math.abs(ringArea(r)); if (a > area) { area = a; best = r; } }); let x = 0, y = 0; best.forEach((p) => { x += p[0]; y += p[1]; }); return projLL([x / best.length, y / best.length]); }
  function ringArea(r) { let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return a / 2; }
  const STATE_ALIAS = { "Jammu & Kashmir": ["Jammu & Kashmir", "Ladakh"] }; // basemap unit → project state names

  function renderMap(list) {
    const svg = $("#map");
    const W = svg.clientWidth || 800, H = svg.clientHeight || 600;
    const bw = (97.6 - LON0) * KX, bh = LAT0 - 6.2;
    const s0 = Math.min(W / bw, H / bh) * 0.96;
    mapFit = { s0, ox: (W - bw * s0) / 2, oy: (H - bh * s0) / 2 };
    const s = s0 * MAPV.k, ox = mapFit.ox * MAPV.k + MAPV.tx - (W / 2) * (MAPV.k - 1), oy = mapFit.oy * MAPV.k + MAPV.ty - (H / 2) * (MAPV.k - 1);
    const X = (p) => (p[0] * s + ox).toFixed(1), Y = (p) => (p[1] * s + oy).toFixed(1);
    const touched = new Set(list.flatMap((p) => p.states));
    const has = (name) => (STATE_ALIAS[name] || [name]).some((n) => touched.has(n));
    const sel = (name) => F.state && (STATE_ALIAS[name] || [name]).includes(F.state);
    let h = `<g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(3)})">`;
    h += basePaths.map((b) => `<path class="state ${has(b.name) ? "has" : ""} ${sel(b.name) ? "sel" : ""}" data-state="${esc(b.name)}" d="${b.d}"><title>${esc(b.name)}</title></path>`).join("");
    h += "</g>";
    if (MAPV.k >= 1.6) h += basePaths.filter((b) => b.name.length < 30).map((b) => `<text class="state-label" x="${X(b.c)}" y="${Y(b.c)}">${esc(b.name)}</text>`).join("");
    const visible = list.filter((p) => !hiddenGroups.has(p.group.id));
    const ids = new Set(visible.map((p) => p.id));
    // lines first, then glyphs, then labels
    P.forEach((p) => {
      if (!p.geom || p.geom.kind !== "line") return;
      const on = ids.has(p.id);
      if (!on && !list.includes(p) && (F.state || F.type || F.group || F.authority || F.company || F.minValue || F.kpi)) return;
      const pts = p.geom.coords.map(proj).map((q) => X(q) + "," + Y(q)).join(" ");
      const g = p.group;
      const w = p.type === "Expressway" ? 3 : 2.5;
      h += `<g class="${on ? "" : "dim"}" data-project="${p.id}"><polyline class="proj-hit" points="${pts}"/><polyline class="proj-line" points="${pts}" stroke="var(${g.color})" stroke-width="${w}" ${g.dash ? `stroke-dasharray="${g.dash}"` : ""}/></g>`;
    });
    visible.forEach((p) => {
      const c = p.geom.coords, mid = c[Math.floor((c.length - 1) / 2)];
      const q = proj(p.geom.kind === "point" ? c[0] : mid);
      const g = p.group;
      h += `<text class="proj-glyph" data-project="${p.id}" x="${X(q)}" y="${Y(q)}" fill="var(${g.color})">${g.glyph}</text>`;
      if (MAPV.k >= 1.3 || visible.length <= 8) h += `<text class="proj-label" x="${(+X(q) + 9).toFixed(1)}" y="${(+Y(q) + 4).toFixed(1)}">${esc(p.name.split(" (")[0].replace(/ —.*/, ""))}</text>`;
    });
    svg.innerHTML = h;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  }
  function mapEvents() {
    const svg = $("#map"), tip = $("#map-tip");
    let drag = null, moved = false;
    svg.addEventListener("wheel", (e) => { e.preventDefault(); zoomAt(e.deltaY < 0 ? 1.25 : 0.8, e.offsetX, e.offsetY); }, { passive: false });
    svg.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, tx: MAPV.tx, ty: MAPV.ty }; moved = false; });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) { moved = true; svg.classList.add("dragging"); MAPV.tx = drag.tx + dx; MAPV.ty = drag.ty + dy; renderMap(filtered()); }
    });
    window.addEventListener("pointerup", () => { drag = null; svg.classList.remove("dragging"); });
    svg.addEventListener("click", (e) => {
      if (moved) return;
      const pEl = e.target.closest("[data-project]");
      if (pEl) return openProject(pEl.dataset.project);
      const st = e.target.closest("[data-state]");
      if (st) { const n = st.dataset.state; const opts = STATE_ALIAS[n] || [n]; const inData = opts.find((o) => P.some((p) => p.states.includes(o))); setFilter("state", inData || n); }
    });
    svg.addEventListener("mousemove", (e) => {
      const pEl = e.target.closest("[data-project]");
      const st = e.target.closest("[data-state]");
      const r = svg.getBoundingClientRect();
      if (pEl) {
        const p = PI[pEl.dataset.project];
        tip.innerHTML = `<b>${esc(p.name)}</b>${stPill(p.status)}<br>${esc(p.type)} · ${p.length_km != null ? fmt(p.length_km, 1) + " km" : "length n/a"} · ${cr(p.refValue)}<br><span class="muted">${esc(p.authority ? p.authority.short : "Authority not captured")} · ${esc(p.companies.map(coName).slice(0, 3).join(", ") || "contractor not ingested")}</span><br><span class="muted">Geometry: ${esc(p.geom.precision)} · click for detail</span>`;
      } else if (st) {
        const n = st.dataset.state; const opts = STATE_ALIAS[n] || [n];
        const c = P.filter((p) => p.states.some((s) => opts.includes(s)));
        tip.innerHTML = `<b>${esc(n)}</b>${c.length} project(s) in sample${c.length ? "<br><span class='muted'>click to filter</span>" : ""}`;
      } else { tip.hidden = true; return; }
      tip.hidden = false;
      const x = e.clientX - r.left + 14, y = e.clientY - r.top + 14;
      tip.style.left = Math.min(x, r.width - 310) + "px"; tip.style.top = Math.min(y, r.height - 110) + "px";
    });
    svg.addEventListener("mouseleave", () => (tip.hidden = true));
    $("#zoom-in").addEventListener("click", () => zoomAt(1.4));
    $("#zoom-out").addEventListener("click", () => zoomAt(1 / 1.4));
    $("#zoom-reset").addEventListener("click", () => { Object.assign(MAPV, { k: 1, tx: 0, ty: 0 }); renderMap(filtered()); });
    window.addEventListener("resize", () => renderMap(filtered()));
  }
  function zoomAt(f, cx, cy) {
    const svg = $("#map"); const W = svg.clientWidth, H = svg.clientHeight;
    cx = cx == null ? W / 2 : cx; cy = cy == null ? H / 2 : cy;
    const k2 = Math.max(1, Math.min(12, MAPV.k * f)); const r = k2 / MAPV.k;
    // keep point under cursor fixed: screen = base*k + (W/2)(1-k) + t
    MAPV.tx = (cx - W / 2) * (1 - r) + MAPV.tx * r;
    MAPV.ty = (cy - H / 2) * (1 - r) + MAPV.ty * r;
    MAPV.k = k2; if (k2 === 1) { MAPV.tx = 0; MAPV.ty = 0; }
    renderMap(filtered());
  }
  function renderLegend() {
    $("#legend").innerHTML = GROUPS.map((g) => `<span class="lg ${hiddenGroups.has(g.id) ? "off" : ""}" data-g="${g.id}" title="Toggle on map"><svg width="28" height="10"><line x1="0" y1="5" x2="28" y2="5" stroke="var(${g.color})" stroke-width="3" ${g.dash ? `stroke-dasharray="${g.dash}"` : ""}/></svg><span style="color:var(${g.color})">${g.glyph}</span>${esc(g.label)}</span>`).join("") + `<span class="lg muted">Line style + glyph + colour encode status</span>`;
    $$("#legend .lg[data-g]").forEach((el) => el.addEventListener("click", () => { const id = el.dataset.g; hiddenGroups.has(id) ? hiddenGroups.delete(id) : hiddenGroups.add(id); renderLegend(); renderMap(filtered()); }));
  }

  // ---- Pipeline + feed
  function renderPipeline(list) {
    const rows = STAGES.map((st) => { const ps = list.filter((p) => st.codes.includes(p.status)); return { st, n: ps.length, v: ps.reduce((s, p) => s + (p.refValue || 0), 0), km: ps.reduce((s, p) => s + (p.length_km || 0), 0), ps }; });
    const max = Math.max(1, ...rows.map((r) => r.v));
    $("#pipeline").innerHTML = `<div class="pipe-row muted" style="cursor:default"><span>Stage</span><span>Σ ref. value</span><span class="n">#</span><span class="n">₹cr</span><span class="n">km</span></div>` +
      rows.map((r) => `<div class="pipe-row" data-stage="${r.st.id}" title="${esc(r.ps.map((p) => p.name).join("\n") || "No projects at this stage")}"><span>${r.st.id}</span><span class="track"><span class="fill" style="display:block;width:${((r.v / max) * 100).toFixed(1)}%"></span></span><span class="n">${r.n}</span><span class="n">${r.v ? fmt(r.v) : "—"}</span><span class="n">${r.km ? fmt(r.km) : "—"}</span></div>`).join("") +
      `<p class="footnote">State and contractor distribution per stage: hover a row; click to list projects. Projects without a single reference value contribute 0 ₹cr.</p>`;
    $$("#pipeline .pipe-row[data-stage]").forEach((el) => el.addEventListener("click", () => { const st = STAGES.find((s) => s.id === el.dataset.stage); showStageList(st, list); }));
  }
  function showStageList(st, list) {
    const ps = list.filter((p) => st.codes.includes(p.status));
    const states = {}; const cos = {};
    ps.forEach((p) => { p.states.forEach((s) => (states[s] = (states[s] || 0) + 1)); p.companies.forEach((c) => (cos[c] = (cos[c] || 0) + 1)); });
    openPanel(`Stage: ${st.id}`, `<p class="muted">${ps.length} project(s). Status codes in stage: ${st.codes.map((c) => S[c].label).join(", ")}.</p>
      ${table(["Project", "Status", "Ref. value", "km", "Authority"], ps.map((p) => [projLink(p), stPill(p.status), cr(p.refValue), fmt(p.length_km), esc(p.authority ? p.authority.short : "—")]), [2, 3])}
      <h3>State distribution</h3>${bars(Object.entries(states).map(([k, v]) => [k, v]), (v) => v)}
      <h3>Contractor distribution (ingested packages)</h3>${Object.keys(cos).length ? bars(Object.entries(cos).map(([k, v]) => [coName(k), v]), (v) => v) : '<p class="empty">No contractor data ingested for projects at this stage.</p>'}`);
  }
  function renderFeed(list) {
    const ev = list.flatMap((p) => p.events.filter((e) => e.date).map((e) => ({ ...e, p }))).sort((a, b) => dateKey(b.date).localeCompare(dateKey(a.date))).slice(0, 18);
    $("#feed").innerHTML = ev.map((e) => `<div class="feed-row" data-project="${e.p.id}"><span class="d">${esc(e.date)}</span><span><b>${esc(e.p.name.split(" (")[0])}</b> — ${esc(e.event)} <span class="muted">[${esc(e.source)}]</span></span></div>`).join("") || '<p class="empty">No dated events in filter.</p>';
  }

  // ---- generic table / bars
  function table(heads, rows, numCols = [], opts = {}) {
    return `<div class="tbl-wrap"><table><thead><tr>${heads.map((h, i) => `<th class="${numCols.includes(i) ? "n" : ""}">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r, j) => `<tr ${opts.rowAttr ? opts.rowAttr(j) : ""}>${r.map((c, i) => `<td class="${numCols.includes(i) ? "n" : ""}">${c}</td>`).join("")}</tr>`).join("") || `<tr><td colspan="${heads.length}" class="empty">No records in current filter.</td></tr>`}</tbody></table></div>`;
  }
  function bars(pairs, fmtV) {
    const max = Math.max(1, ...pairs.map((p) => p[1]));
    return pairs.sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="hbar"><span title="${esc(k)}">${esc(k)}</span><span class="track"><span class="fill" style="display:block;width:${((v / max) * 100).toFixed(1)}%"></span></span><span class="v">${fmtV(v)}</span></div>`).join("");
  }

  // ---- C STATES
  function renderStates(list) {
    const states = uniq(P.flatMap((p) => p.states)).sort();
    const rows = states.map((s) => {
      const ps = list.filter((p) => p.states.includes(s));
      return { s, ps, n: ps.length, v: ps.reduce((a, p) => a + (p.refValue || 0), 0), km: ps.reduce((a, p) => a + (p.length_km || 0), 0),
        exp: ps.filter((p) => p.type === "Expressway").length, br: ps.filter((p) => p.type === "Bridge").length, tu: ps.filter((p) => p.type === "Tunnel").length,
        uc: ps.filter((p) => ["construction", "partial", "delayed", "stalled"].includes(p.group.id)).length, pl: ps.filter((p) => S[p.status].phase === "PRE").length, done: ps.filter((p) => p.group.id === "complete").length,
        cos: uniq(ps.flatMap((p) => p.companies)).length, auth: uniq(ps.map((p) => p.authority && p.authority.short)).join(", ") };
    }).filter((r) => r.n);
    $("#states-table").innerHTML = table(["State", "Projects", "Value* (₹cr)", "Length* km", "Expr.", "Bridges", "Tunnels", "Constr.", "Planned", "Done", "Contractors", "Authorities"],
      rows.map((r) => [`<span class="link" data-state-f="${esc(r.s)}">${esc(r.s)}</span>`, r.n, fmt(r.v), fmt(r.km), r.exp, r.br, r.tu, r.uc, r.pl, r.done, r.cos, esc(r.auth)]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) +
      `<p class="footnote">* Multi-state projects are counted in full in every state they cross — values and lengths are <b>not apportioned</b> and do not sum to the national total.</p>`;
    $$("#states-table [data-state-f]").forEach((el) => el.addEventListener("click", () => setFilter("state", el.dataset.stateF)));
    const box = $("#state-detail");
    if (!F.state) { box.innerHTML = ""; return; }
    const ps = list.filter((p) => p.states.includes(F.state));
    const cos = {}; ps.forEach((p) => p.members.forEach((m) => (cos[m.company] = (cos[m.company] || 0) + 1)));
    const upcoming = ps.filter((p) => p.opportunity);
    box.innerHTML = `<div class="panel"><div class="panel-head"><h2>${esc(F.state)} — state brief</h2><button class="btn ghost" id="state-brief">Print state briefing</button></div>
      <div class="grid2"><div><h3>Projects</h3>${table(["Project", "Type", "Status", "Ref. value"], ps.map((p) => [projLink(p), esc(p.type), stPill(p.status), cr(p.refValue)]), [3])}</div>
      <div><h3>Major contractors (package appearances)</h3>${Object.keys(cos).length ? bars(Object.entries(cos).map(([k, v]) => [coName(k), v]), (v) => v + " pkg") : '<p class="empty">No package contractors ingested.</p>'}
      <h3>Corridors</h3><p>${esc(uniq(ps.map((p) => p.corridor)).join(" · "))}</p>
      <h3>Upcoming / opportunity signals</h3>${upcoming.map((p) => `<div>${projLink(p)} — <span class="muted">${esc(p.opportunity.category)}: ${esc(p.opportunity.signal)}</span></div>`).join("") || '<p class="empty">None documented.</p>'}</div></div></div>`;
    $("#state-brief").addEventListener("click", () => window.print());
  }

  // ---- D CORRIDORS
  function renderCorridors(list) {
    const byC = {}; list.forEach((p) => (byC[p.corridor] = byC[p.corridor] || []).push(p));
    $("#corridors").innerHTML = `<div class="grid2">` + Object.entries(byC).sort((a, b) => b[1].reduce((s, p) => s + (p.length_km || 0), 0) - a[1].reduce((s, p) => s + (p.length_km || 0), 0)).map(([c, ps]) => {
      const pk = ps.flatMap((p) => p.packages.map((k) => ({ ...k, p })));
      const jv = pk.filter((k) => k.contractor && k.contractor.kind === "JV");
      const delays = ps.flatMap((p) => p.risks.map((r) => r.category));
      return `<div class="card"><h3>${esc(c)}</h3><dl class="kv">
        <dt>Projects</dt><dd>${ps.map(projLink).join("<br>")}</dd>
        <dt>Status</dt><dd>${ps.map((p) => stPill(p.status)).join("<br>")}</dd>
        <dt>Length</dt><dd class="num">${fmt(ps.reduce((s, p) => s + (p.length_km || 0), 0), 1)} km</dd>
        <dt>Reference value</dt><dd class="num">${cr(ps.reduce((s, p) => s + (p.refValue || 0), 0) || null)}</dd>
        <dt>States crossed</dt><dd>${esc(uniq(ps.flatMap((p) => p.states)).join(", "))}</dd>
        <dt>Cities / endpoints</dt><dd>${esc(ps.map((p) => p.origin + " → " + p.destination).join("; "))}</dd>
        <dt>Packages</dt><dd>${ps.map((p) => `${p.packages_summary.count != null ? p.packages_summary.count : "?"} reported · ${p.packages.length} ingested`).join("; ")}</dd>
        <dt>Contractors</dt><dd>${uniq(ps.flatMap((p) => p.companies)).map(coLink).join(", ") || '<span class="muted">Not ingested — do not attribute corridor to a single contractor</span>'}</dd>
        <dt>JV packages</dt><dd>${jv.map((k) => esc(k.no) + ": " + k.contractor.members.map((m) => coName(m.company)).join(" + ")).join("<br>") || "—"}</dd>
        <dt>Documented issues</dt><dd>${esc(uniq(delays).join(", ") || "None documented")}</dd>
        <dt>Completion</dt><dd>${ps.map((p) => esc(p.dates.actual_completion ? "Actual " + p.dates.actual_completion : p.dates.revised_completion ? "Revised " + p.dates.revised_completion : p.dates.planned_completion ? "Planned " + p.dates.planned_completion : "Not documented")).join("<br>")}</dd>
      </dl></div>`;
    }).join("") + `</div>`;
  }

  // ---- E PROJECTS
  let projSort = { k: "refValue", dir: -1 };
  function renderProjects(list) {
    const cols = [["name", "Project"], ["type", "Type"], ["status", "Status"], ["primary_state", "State(s)"], ["authority", "Authority"], ["companies", "Contractor(s)"], ["refValue", "Ref. value ₹cr"], ["length_km", "km"], ["confidence", "Conf."], ["dq", "DQ score"], ["last_verified", "Verified"]];
    const val = (p, k) => (k === "authority" ? (p.authority ? p.authority.short : "") : k === "companies" ? p.companies.map(coName).join(", ") : k === "dq" ? p.dq.score : k === "status" ? S[p.status].n : p[k]);
    const rows = list.slice().sort((a, b) => { const x = val(a, projSort.k), y = val(b, projSort.k); return (x == null ? 1 : y == null ? -1 : x > y ? 1 : x < y ? -1 : 0) * projSort.dir; });
    $("#proj-count").textContent = `${rows.length} of ${P.length} sample projects · click column to sort`;
    $("#projects-table").innerHTML = `<div class="tbl-wrap"><table><thead><tr>${cols.map(([k, t], i) => `<th class="sortable ${[6, 7, 9].includes(i) ? "n" : ""}" data-k="${k}">${t}${projSort.k === k ? (projSort.dir > 0 ? " ▲" : " ▼") : ""}</th>`).join("")}</tr></thead><tbody>` +
      rows.map((p) => `<tr class="click" data-project="${p.id}"><td><b>${esc(p.name)}</b><br><span class="muted mono">${p.id}</span></td><td>${esc(p.type)}</td><td>${stPill(p.status)}</td><td>${esc(p.states.join(", "))}</td><td>${esc(p.authority ? p.authority.short : "—")}</td><td>${esc(p.companies.map(coName).join(", ") || "—")}</td><td class="n">${p.refValue != null ? fmt(p.refValue) : p.conflict ? '<span class="tag warn">conflict</span>' : "—"}</td><td class="n">${fmt(p.length_km, 1)}</td><td>${cf(p.confidence)}</td><td class="n">${p.dq.score}</td><td class="mono">${esc(p.last_verified)}</td></tr>`).join("") + `</tbody></table></div>`;
    $$("#projects-table th.sortable").forEach((th) => th.addEventListener("click", () => { projSort = { k: th.dataset.k, dir: projSort.k === th.dataset.k ? -projSort.dir : -1 }; renderProjects(filtered()); }));
  }

  // ---- F CONTRACTORS
  function contractorStats(list) {
    const M = {};
    list.forEach((p) => p.members.forEach((m) => {
      const c = (M[m.company] = M[m.company] || { id: m.company, projects: new Set(), pkgs: 0, value: 0, wvalue: 0, km: 0, active: 0, done: 0, bridges: new Set(), tunnels: new Set(), states: new Set(), auths: new Set(), jv: new Set() });
      c.projects.add(p.id); c.pkgs++; c.value += m.pkg.value_cr || 0; if (m.share != null) c.wvalue += ((m.pkg.value_cr || 0) * m.share) / 100;
      c.km += m.pkg.length_km || 0; if (["UNDER_CONSTRUCTION", "MOBILIZATION"].includes(m.pkg.status)) c.active++; if (m.pkg.status === "COMPLETED") c.done++;
      if (p.type === "Bridge") c.bridges.add(p.id); if (p.type === "Tunnel") c.tunnels.add(p.id);
      p.states.forEach((s) => c.states.add(s)); if (p.authority) c.auths.add(p.authority.short);
      if (m.pkg.contractor.kind === "JV") m.pkg.contractor.members.forEach((o) => o.company !== m.company && c.jv.add(o.company));
    }));
    return Object.values(M);
  }
  function renderContractors(list) {
    const key = $("#c-sort").value;
    const rows = contractorStats(list).sort((a, b) => (key === "projects" ? b.projects.size - a.projects.size : key === "km" ? b.km - a.km : key === "active" ? b.active - a.active : b.value - a.value));
    const metric = { value: ["Attributed award value", (c) => c.value, cr], projects: ["Projects", (c) => c.projects.size, (v) => v], km: ["Package km", (c) => c.km, (v) => fmt(v, 1) + " km"], active: ["Active packages", (c) => c.active, (v) => v] }[key];
    $("#contractors").innerHTML = `<p class="muted">Sorted by: <b>${metric[0]}</b>. JV package values are counted in full for each member (share-weighted value shown where JV share is disclosed). Metrics reflect only packages ingested in this sample.</p>` +
      `<div class="grid2"><div>${bars(rows.map((c) => [coName(c.id), metric[1](c)]), metric[2])}</div><div></div></div>` +
      table(["Company", "Projects", "Pkgs", "Attributed ₹cr", "Share-wtd ₹cr", "km", "Active", "Done", "Bridges", "Tunnels", "States", "Authorities", "JV partners"],
        rows.map((c) => [coLink(c.id), c.projects.size, c.pkgs, fmt(c.value), c.wvalue ? fmt(c.wvalue) : "—", fmt(c.km, 1), c.active, c.done, c.bridges.size, c.tunnels.size, esc([...c.states].join(", ")), esc([...c.auths].join(", ")), [...c.jv].map(coLink).join(", ") || "—"]), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }

  // ---- G AUTHORITIES
  function renderAuthorities(list) {
    const rows = D.authorities.map((a) => { const ps = list.filter((p) => p.authority_id === a.id); return { a, ps }; }).filter((r) => r.ps.length);
    const noAuth = list.filter((p) => !p.authority_id);
    $("#authorities").innerHTML = `<div class="grid2">` + rows.map(({ a, ps }) => {
      const byG = {}; ps.forEach((p) => (byG[p.group.label] = (byG[p.group.label] || 0) + 1));
      return `<div class="card"><h3><span class="link" data-auth="${a.id}">${esc(a.short)}</span> <span class="muted">${esc(a.name)}</span></h3><dl class="kv">
        <dt>Level</dt><dd>${esc(a.level)}${a.parent ? " · under " + esc(au[a.parent].short) : ""}</dd>
        <dt>Projects</dt><dd class="num">${ps.length}</dd>
        <dt>Σ reference value</dt><dd class="num">${cr(ps.reduce((s, p) => s + (p.refValue || 0), 0) || null)}</dd>
        <dt>Σ length</dt><dd class="num">${fmt(ps.reduce((s, p) => s + (p.length_km || 0), 0), 1)} km</dd>
        <dt>Status mix</dt><dd>${Object.entries(byG).map(([k, v]) => esc(k) + " " + v).join(" · ")}</dd>
        <dt>Contractors</dt><dd>${uniq(ps.flatMap((p) => p.companies)).map(coLink).join(", ") || '<span class="muted">none ingested</span>'}</dd>
        <dt>States</dt><dd>${esc(uniq(ps.flatMap((p) => p.states)).join(", "))}</dd>
        <dt>Website</dt><dd><a href="${esc(a.website)}" target="_blank" rel="noopener">${esc(a.website)}</a></dd>
        <dt>Projects</dt><dd>${ps.map(projLink).join("<br>")}</dd></dl></div>`;
    }).join("") + `</div>` + (noAuth.length ? `<p class="note">Implementing authority not captured for: ${noAuth.map(projLink).join(", ")} — deliberately left blank rather than assumed.</p>` : "");
    $$("#authorities [data-auth]").forEach((el) => el.addEventListener("click", () => setFilter("authority", el.dataset.auth)));
  }

  // ---- H TENDERS
  function renderTenders(list) {
    const pk = list.flatMap((p) => p.packages.map((k) => ({ ...k, p })));
    const byYear = {};
    pk.filter((k) => k.award_date).forEach((k) => { const y = String(k.award_date).slice(0, 4); const r = (byYear[y] = byYear[y] || { n: 0, v: 0, km: 0 }); r.n++; r.v += k.value_cr || 0; r.km += k.length_km || 0; });
    const years = Object.keys(byYear).sort();
    const chart = (title, fn, f) => `<div><h3>${title}</h3>${years.length ? bars(years.map((y) => [y, fn(byYear[y])]), f).replace(/<div class="hbar">/g, '<div class="hbar">') : '<p class="empty">No dated awards.</p>'}</div>`;
    $("#tenders-chart").innerHTML = `<div class="grid2">${chart("Packages awarded by year", (r) => r.n, (v) => v + " pkg")}${chart("Award value by year (packages with disclosed value)", (r) => r.v, cr)}</div><p class="footnote">Tender IDs, bid deadlines, other bidders and qualification criteria were not captured for the sample — schema fields exist (tender_records). Award year only where the source gives it.</p>`;
    $("#tenders").innerHTML = table(["Project", "Package", "Authority", "Status", "Contractor / JV", "Value ₹cr", "km", "Award", "Progress", "Evidence"],
      pk.map((k) => [projLink(k.p), esc(k.no) + "<br><span class='muted'>" + esc(k.name) + "</span>", esc(k.p.authority ? k.p.authority.short : "—"), stPill(k.status),
        k.contractor ? (k.contractor.kind === "JV" ? "<span class='tag'>JV</span> " : "") + k.contractor.members.map((m) => coLink(m.company) + (m.share != null && k.contractor.kind === "JV" ? ` <span class="muted">${m.share}%</span>` : "")).join(" + ") : '<span class="muted">Not awarded</span>',
        k.value_cr != null ? fmt(k.value_cr, 2) : "—", fmt(k.length_km, 2), esc(k.award_date || "—"), k.progress_pct != null ? k.progress_pct + "%" : "—", srcLink(k.source) + " " + cf(k.confidence) + (k.note ? `<br><span class="muted">${esc(k.note)}</span>` : "")]), [5, 6]);
  }

  // ---- I RADAR
  function radarItems(list) {
    const items = [];
    list.forEach((p) => {
      if (p.opportunity) items.push({ cat: p.opportunity.category, p, signal: p.opportunity.signal, source: p.opportunity.source, asof: p.opportunity.asof });
      const recent = p.packages.filter((k) => k.award_date && String(k.award_date) >= "2024" && k.contractor);
      if (recent.length) items.push({ cat: "RECENTLY_AWARDED", p, signal: recent.map((k) => `${k.no} (${k.award_date}) → ${k.contractor.members.map((m) => coName(m.company)).join(" + ")}`).join("; "), source: recent[0].source, asof: recent.map((k) => String(k.award_date)).sort().pop() });
      if (p.next_phase) items.push({ cat: "UPCOMING_PHASE", p, signal: p.next_phase, source: p.status_source, asof: p.status_asof });
    });
    return items;
  }
  function renderRadar(list) {
    const items = radarItems(list);
    $("#radar").innerHTML = `<p class="muted">Every item carries a dated, sourced signal. "Expected timing" is shown only when a source states it. Technology needs are labelled <b>documented</b> vs <b>potential</b> (inferred from project characteristics).</p><div class="radar-cols">` +
      RADAR.map((c) => { const its = items.filter((i) => i.cat === c.id); return `<div class="radar-col"><h3><span>${esc(c.label)}</span><span class="num muted">${its.length}</span></h3><p class="muted" style="font-size:11.5px">${esc(c.q)}</p>` +
        (its.map((i) => `<div class="radar-item" data-project="${i.p.id}"><b>${esc(i.p.name)}</b><div>${stPill(i.p.status)} · ${esc(i.p.authority ? i.p.authority.short : "Authority n/a")} · ${cr(i.p.refValue)} · ${esc(i.p.primary_state)}</div><div class="sig">${esc(i.signal)}</div>
          <div class="muted">Expected timing: ${esc(i.p.dates.planned_completion && c.id === "CONSTRUCTION" ? "completion " + (i.p.dates.revised_completion || i.p.dates.planned_completion) : "Not documented")} · Evidence ${srcLink(i.source)} · signal as of ${esc(i.asof || "—")} · verified ${esc(i.p.last_verified)}</div>
          ${i.p.tech && i.p.tech.length ? `<div class="muted" style="margin-top:4px">${i.p.tech.map((t) => `<span class="tag">${esc(t.kind)}</span> ${esc(t.domain)}`).join("<br>")}</div>` : ""}</div>`).join("") || `<p class="empty">No documented signal in the sample for this category.</p>`) + `</div>`; }).join("") + `</div>`;
  }

  // ---- J GRAPH
  let graphSel = null;
  function buildGraph(list) {
    const nodes = [], edges = [], idx = {};
    const add = (id, label, kind) => { if (!idx[id]) { idx[id] = { id, label, kind, x: 0, y: 0, vx: 0, vy: 0 }; nodes.push(idx[id]); } return idx[id]; };
    list.forEach((p) => {
      add(p.id, p.name.split(" (")[0], "project");
      if (p.authority) { add(p.authority.id, p.authority.short, "authority"); edges.push({ a: p.authority.id, b: p.id, kind: "awarded" }); }
      p.members.forEach((m) => { add(m.company, coName(m.company).replace(/ (Limited|Ltd|Pvt Ltd|Pvt|Corporation|Company Ltd)$/,"").replace(/ (Pvt|Infrastructures|Infrastructure Developers)$/,""), "company"); if (!edges.some((e) => e.a === p.id && e.b === m.company)) edges.push({ a: p.id, b: m.company, kind: m.role, pkg: m.pkg.no }); });
      p.packages.forEach((k) => { if (k.contractor && k.contractor.kind === "JV") { const ms = k.contractor.members; for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) edges.push({ a: ms[i].company, b: ms[j].company, kind: "jv" }); } });
    });
    // deterministic force layout
    const W = 1000, H = 640;
    nodes.forEach((n, i) => { const a = (i / nodes.length) * Math.PI * 2; const r = n.kind === "authority" ? 120 : n.kind === "project" ? 220 : 300; n.x = W / 2 + r * Math.cos(a); n.y = H / 2 + r * Math.sin(a); });
    for (let it = 0; it < 700; it++) {
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]; let dx = a.x - b.x, dy = a.y - b.y; let d2 = dx * dx + dy * dy || 1; const f = 5200 / d2; const d = Math.sqrt(d2);
        a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
      edges.forEach((e) => { const a = idx[e.a], b = idx[e.b]; const dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 1; const f = (d - 85) * 0.02; a.vx += (dx / d) * f; a.vy += (dy / d) * f; b.vx -= (dx / d) * f; b.vy -= (dy / d) * f; });
      nodes.forEach((n) => { n.vx += (W / 2 - n.x) * 0.004; n.vy += (H / 2 - n.y) * 0.004; n.x += Math.max(-20, Math.min(20, n.vx)); n.y += Math.max(-20, Math.min(20, n.vy)); n.vx *= 0.5; n.vy *= 0.5; n.x = Math.max(20, Math.min(W - 170, n.x)); n.y = Math.max(20, Math.min(H - 20, n.y)); });
    }
    return { nodes, edges, idx, W, H };
  }
  function renderGraph(list) {
    const G = buildGraph(list);
    const svg = $("#graph");
    svg.setAttribute("viewBox", `0 0 ${G.W} ${G.H}`);
    const nb = new Set(); if (graphSel) { nb.add(graphSel); G.edges.forEach((e) => { if (e.a === graphSel) nb.add(e.b); if (e.b === graphSel) nb.add(e.a); }); }
    const shape = (n) => n.kind === "authority" ? `<rect x="-7" y="-7" width="14" height="14" fill="var(--st-tendered)"/>` : n.kind === "project" ? `<circle r="6" fill="var(${PI[n.id].group.color})"/>` : `<path d="M0,-8 L8,0 L0,8 L-8,0Z" fill="var(--st-proposed)"/>`;
    svg.innerHTML = G.edges.map((e) => { const a = G.idx[e.a], b = G.idx[e.b]; const hi = graphSel && (e.a === graphSel || e.b === graphSel); return `<line class="g-edge ${e.kind === "jv" ? "jv" : ""} ${hi ? "hi" : ""}" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/>`; }).join("") +
      G.nodes.map((n) => `<g class="g-node ${graphSel && !nb.has(n.id) ? "dim" : ""}" data-node="${esc(n.id)}" transform="translate(${n.x.toFixed(1)},${n.y.toFixed(1)})">${shape(n)}<text x="10" y="4">${esc(n.label)}</text><title>${esc(n.kind + ": " + n.label)}</title></g>`).join("");
    $("#graph-legend").innerHTML = `<span class="lg"><svg width="12" height="12"><rect width="12" height="12" fill="var(--st-tendered)"/></svg>Authority</span><span class="lg"><svg width="12" height="12"><circle cx="6" cy="6" r="5" fill="var(--st-construction)"/></svg>Project (fill = status)</span><span class="lg"><svg width="14" height="14"><path d="M7,0 L14,7 L7,14 L0,7Z" fill="var(--st-proposed)"/></svg>Company</span><span class="lg"><svg width="28" height="8"><line x1="0" y1="4" x2="28" y2="4" stroke="var(--st-awarded)" stroke-dasharray="3 3"/></svg>JV partnership</span><span class="lg muted">Consultants / subcontractors / technology providers: node types defined in schema, none verified in sample.</span>`;
    $$("#graph .g-node").forEach((g) => g.addEventListener("click", () => { graphSel = graphSel === g.dataset.node ? null : g.dataset.node; renderGraph(filtered()); renderGraphSide(G); }));
    renderGraphSide(G);
  }
  function renderGraphSide(G) {
    const box = $("#graph-side");
    if (!graphSel || !G.idx[graphSel]) { box.innerHTML = '<p class="muted">Select a node to see its relationships. Example: click “Larsen &amp; Toubro Limited” to see its projects, JV partners, authorities, states and values.</p>'; return; }
    const n = G.idx[graphSel];
    if (n.kind === "project") { box.innerHTML = `<h3>${esc(PI[n.id].name)}</h3><button class="btn" data-project="${n.id}">Open project detail</button>`; return; }
    if (n.kind === "authority") { const ps = P.filter((p) => p.authority_id === n.id); box.innerHTML = `<h3>${esc(au[n.id].name)}</h3>${table(["Project", "Status", "Ref. value"], ps.map((p) => [projLink(p), stPill(p.status), cr(p.refValue)]), [2])}`; return; }
    const c = co[n.id]; const rows = P.flatMap((p) => p.members.filter((m) => m.company === n.id).map((m) => ({ p, m })));
    const jv = uniq(rows.flatMap((r) => r.m.pkg.contractor.members.map((x) => x.company)).filter((x) => x !== n.id));
    box.innerHTML = `<h3>${esc(c.name)}</h3><dl class="kv"><dt>Aliases</dt><dd>${esc(c.aliases.join(", "))}</dd><dt>Listed</dt><dd>${c.listed == null ? "Not captured" : c.listed ? "Yes" : "No"}</dd><dt>HQ</dt><dd>${esc(c.hq || "Not captured")} · ${esc(c.country)}</dd><dt>Parent</dt><dd>${esc(c.parent || "—")}</dd>
      <dt>JV partners</dt><dd>${jv.map(coLink).join(", ") || "—"}</dd><dt>Authorities</dt><dd>${esc(uniq(rows.map((r) => r.p.authority && r.p.authority.short)).join(", "))}</dd><dt>States</dt><dd>${esc(uniq(rows.flatMap((r) => r.p.states)).join(", "))}</dd>
      <dt>Current (active)</dt><dd>${rows.filter((r) => r.m.pkg.status !== "COMPLETED").map((r) => projLink(r.p)).join("<br>") || "—"}</dd><dt>Completed</dt><dd>${rows.filter((r) => r.m.pkg.status === "COMPLETED").map((r) => projLink(r.p)).join("<br>") || "—"}</dd><dt>Consultants</dt><dd class="muted">None verified in sample</dd></dl>
      ${table(["Project", "Pkg", "Role", "₹cr"], rows.map((r) => [projLink(r.p), esc(r.m.pkg.no), esc(r.m.role) + (r.m.share != null && r.m.pkg.contractor.kind === "JV" ? ` (${r.m.share}%)` : ""), fmt(r.m.pkg.value_cr, 2)]), [3])}
      <p><button class="btn ghost" data-filter-company="${n.id}">Filter all views to this company</button></p>`;
    const b = $("[data-filter-company]", box); if (b) b.addEventListener("click", () => setFilter("company", n.id));
  }

  // ---- K TIMELINE
  function renderTimeline(list) {
    const y0 = 2010, y1 = 2029, pct = (d) => { const s = String(d); const y = +s.slice(0, 4); const m = s.length >= 7 ? +s.slice(5, 7) - 1 : 6; return ((y + m / 12 - y0) / (y1 - y0)) * 100; };
    const axis = []; for (let y = y0; y <= y1; y += 2) axis.push(`<span style="left:${pct(y + "-01")}%">${y}</span>`);
    $("#timeline").innerHTML = `<div class="legend">${GROUPS.map((g) => `<span class="lg"><span style="color:var(${g.color})">${g.glyph}</span>${esc(g.label)}</span>`).join("")}<span class="lg">• milestone (no status change)</span><span class="lg">⚑ planned / revised completion target</span><span class="lg muted">Today: ${AS_OF}</span></div><div class="tl-axis">${axis.join("")}</div>` +
      list.map((p) => {
        const evs = p.events.filter((e) => e.date && /^\d{4}/.test(e.date));
        const first = evs.length ? Math.min(...evs.map((e) => pct(e.date))) : null;
        const marks = [p.dates.planned_completion, p.dates.revised_completion].filter((d) => d && /^\d{4}/.test(d)).map((d) => `<span class="tl-ev" style="left:${pct(d.match(/^\d{4}(-\d{2})?/)[0])}%;color:var(--text-3)" title="${esc("Target completion: " + d)}">⚑</span>`);
        return `<div class="tl-row"><div class="tl-name" data-project="${p.id}">${esc(p.name.split(" (")[0])}<br>${stPill(p.status)}</div><div class="tl-track">${first != null ? `<span class="tl-base" style="left:${first}%;right:${100 - pct(AS_OF)}%"></span>` : ""}` +
          evs.map((e) => { const g = e.status ? groupOf(e.status) : { color: "--text-3", glyph: "•" }; return `<span class="tl-ev" style="left:${pct(e.date)}%;color:var(${g.color})" title="${esc(e.date + " — " + (e.status ? S[e.status].label : "Milestone") + ": " + e.event + " [" + e.source + "]")}">${g.glyph}</span>`; }).join("") + marks.join("") + `</div></div>`;
      }).join("") + `<p class="footnote">Undated events (e.g. a re-tender with no captured date) are listed in the project detail but not plotted. Hover a glyph for event, status and source.</p>`;
  }

  // ---- L QUALITY
  function renderQuality() {
    const n = P.length;
    const staleDays = 365;
    const m = [
      ["Total records", n],
      ["Sources", D.sources.length],
      ["Records with ≥1 Tier-1 source", P.filter((p) => p.srcIds.some((id) => src[id] && src[id].tier === 1)).length],
      ["Needs verification (REPORTED/INFERRED/UNKNOWN)", P.filter((p) => !["VERIFIED", "CROSS_VERIFIED"].includes(p.confidence)).length],
      ["Missing contractor data", P.filter((p) => !p.companies.length).length],
      ["Missing reference value", P.filter((p) => p.refValue == null).length],
      ["Conflicting values", P.filter((p) => p.value_conflict).length],
      ["Coordinates approximate", P.filter((p) => p.geom.precision === "APPROXIMATE").length + " / " + n],
      ["Missing completion date", P.filter((p) => !p.dates.actual_completion && !p.dates.revised_completion && !p.dates.planned_completion).length],
      ["Missing authority", P.filter((p) => !p.authority_id).length],
      ["Stale (status > " + staleDays + " d old)", P.filter((p) => p.dq.ageDays > staleDays).length],
      ["Sources without pub. date", D.sources.filter((s) => !s.pub_date).length],
      ["Last updated", AS_OF],
    ];
    $("#quality").innerHTML = `<div class="q-grid">${m.map(([k, v]) => `<div class="q-cell"><span class="k-label">${esc(k)}</span><span class="k-val">${esc(v)}</span></div>`).join("")}</div>
      <p class="muted">Score = 35% source quality (best tier + record confidence) · 20% independence (distinct publishers) · 20% recency (age of latest status/source date) · 25% completeness (value, contractor, geometry, completion date, authority, length). It rates the <b>evidence</b>, never the project.</p>` +
      table(["Project", "Score", "Quality", "Independence", "Recency", "Completeness", "Latest dated evidence", "Age (d)", "Record conf.", "Flags"],
        P.slice().sort((a, b) => a.dq.score - b.dq.score).map((p) => {
          const flags = [p.value_conflict && "value conflict", !p.companies.length && "no contractor", p.refValue == null && "no ref value", !p.authority_id && "no authority", p.dq.ageDays > staleDays && "stale"].filter(Boolean);
          const mt = (v) => `<span class="score">${Math.round(v * 100)}</span><span class="meter"><i style="width:${Math.round(v * 100)}%"></i></span>`;
          return [projLink(p), `<b class="score">${p.dq.score}</b>`, mt(p.dq.quality), mt(p.dq.independence), mt(p.dq.recency), mt(p.dq.completeness), esc(p.dq.lastDate || "—"), fmt(p.dq.ageDays), cf(p.confidence), flags.map((f) => `<span class="tag warn">${esc(f)}</span>`).join(" ")];
        }), [1, 7]);
  }

  // ---- M SOURCES
  function renderSources() {
    const refs = {}; P.forEach((p) => p.srcIds.forEach((id) => (refs[id] = refs[id] || new Set()).add(p.id)));
    $("#src-count").textContent = `${D.sources.length} sources · accessed ${AS_OF}`;
    const tierCounts = [1, 2, 3, 4].map((t) => [TIER[t], D.sources.filter((s) => s.tier === t).length]);
    $("#sources").innerHTML = `<div class="grid2"><div><h3>Sources by reliability tier</h3>${bars(tierCounts, (v) => v)}</div><div><h3>Rules</h3><p class="muted">Tier 3–4 sources are used for discovery; claims supported only by Tier 4 remain REPORTED until a Tier 1–2 source is attached. Publication dates marked “—” were not captured and count against freshness.</p></div></div>` +
      table(["ID", "Tier", "Publisher", "Title", "Type", "Published", "Accessed", "Used by"], D.sources.map((s) => [`<span class="mono">${s.id}</span>`, esc(TIER[s.tier]), esc(s.publisher), `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`, esc(s.type), esc(s.pub_date || "—"), esc(s.access_date), [...(refs[s.id] || [])].map((id) => projLink(PI[id])).join(", ") || '<span class="muted">—</span>']));
  }

  // ------------------------------------------------------------ 5 DRAWER
  function openPanel(title, html) {
    $("#d-id").textContent = ""; $("#d-title").textContent = title; $("#d-body").innerHTML = html; $("#drawer").hidden = false;
  }
  function miniMap(p) {
    const pts = p.geom.coords.map(proj);
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    let minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = Math.max(0.6, (maxX - minX) * 0.25, (maxY - minY) * 0.25);
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const W = 700, H = 220, s = Math.min(W / (maxX - minX), H / (maxY - minY)), ox = (W - (maxX - minX) * s) / 2 - minX * s, oy = (H - (maxY - minY) * s) / 2 - minY * s;
    const g = p.group, line = pts.map((q) => (q[0] * s + ox).toFixed(1) + "," + (q[1] * s + oy).toFixed(1)).join(" ");
    return `<svg class="mini-map" viewBox="0 0 ${W} ${H}" role="img" aria-label="Schematic project map"><g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(3)})">${basePaths.map((b) => `<path class="state" style="cursor:default" d="${b.d}"/>`).join("")}</g>` +
      (p.geom.kind === "line" ? `<polyline class="proj-line" points="${line}" stroke="var(${g.color})" stroke-width="3.5" ${g.dash ? `stroke-dasharray="${g.dash}"` : ""}/>` : "") +
      pts.map((q, i) => `<circle cx="${(q[0] * s + ox).toFixed(1)}" cy="${(q[1] * s + oy).toFixed(1)}" r="${i === 0 || i === pts.length - 1 || p.geom.kind === "point" ? 5 : 2.5}" fill="var(${g.color})" stroke="var(--surface-2)" stroke-width="1.5"/>`).join("") +
      `<text x="8" y="${H - 8}" class="proj-label">${esc(p.geom.precision)} · ${esc(p.geom.basis)}${p.geom.planned ? " · PLANNED" : ""}</text></svg>`;
  }
  function openProject(id) {
    const p = PI[id]; if (!p) return;
    const a = p.authority;
    const primary = p.packages.flatMap((k) => (k.contractor ? k.contractor.members.map((m) => ({ m, k })) : []));
    const jvs = p.packages.filter((k) => k.contractor && k.contractor.kind === "JV");
    const who = [
      ["Who owns / sponsors it?", a ? `${esc(a.name)}${p.nodal_ministry ? " · nodal: " + esc(au[p.nodal_ministry].short) : ""} ${srcLink(p.status_source)}` : `<span class="muted">${esc(p.authority_note || "Not captured")}</span>`],
      ["Who awarded it?", p.packages.some((k) => k.contractor) && a ? esc(a.short) + " (awarding authority for ingested packages)" : '<span class="muted">No award ingested</span>'],
      ["Who designed it?", '<span class="muted">Not yet sourced (DPR / design consultant)</span>'],
      ["Who supervised it?", '<span class="muted">Not yet sourced (AE / IE / PMC)</span>'],
      ["Who financed it?", p.funding ? esc(p.funding) : '<span class="muted">Not yet sourced</span>'],
      ["Who won the contract(s)?", primary.length ? uniq(primary.map((x) => x.m.company)).map(coLink).join(", ") : '<span class="muted">Package contractors not ingested</span>'],
      ["Who are the JV partners?", jvs.length ? jvs.map((k) => esc(k.no) + ": " + k.contractor.members.map((m) => coName(m.company) + (m.share != null ? ` (${m.share}%)` : "")).join(" + ")).join("<br>") : "—"],
      ["Main construction companies?", primary.length ? uniq(primary.map((x) => x.m.company)).map(coLink).join(", ") : '<span class="muted">Not ingested</span>'],
      ["Specialist contractors?", '<span class="muted">None verified</span>'],
      ["Major technology / systems providers?", '<span class="muted">None verified — see potential requirements below</span>'],
      ["Who operates / maintains it?", '<span class="muted">Not yet sourced</span>'],
    ];
    const tree = [`${a ? a.short : "Authority n/a"}  (${a ? a.level : "—"})`, `└─ ${p.name}`]
      .concat(p.packages.map((k, i) => { const last = i === p.packages.length - 1; const pre = last ? "   └─ " : "   ├─ "; const sub = last ? "      " : "   │  ";
        const c = k.contractor ? (k.contractor.kind === "JV" ? "JV\n" + k.contractor.members.map((m, j) => sub + (j === k.contractor.members.length - 1 ? "   └─ " : "   ├─ ") + coName(m.company) + (m.share != null ? ` [${m.share}%]` : "") + " — " + m.role).join("\n") : coName(k.contractor.members[0].company)) : "(not awarded)";
        return pre + `${k.no} · ${k.value_cr != null ? "₹" + fmt(k.value_cr, 2) + " cr" : "value n/a"} · ${S[k.status] ? S[k.status].label : k.status}\n${sub}   → ${c}`; }))
      .concat(p.packages.length ? [] : [`   └─ ${p.packages_summary.count != null ? p.packages_summary.count + " packages reported — " : ""}package contracts not ingested`]);
    $("#d-id").textContent = `${p.id} · ${p.type} · ${p.category}`;
    $("#d-title").textContent = p.name;
    $("#d-body").innerHTML = `
      <div class="hdr-grid">
        <div><span class="k-label">Status</span>${stPill(p.status)}<br><span class="muted">as of ${esc(p.status_asof)}</span></div>
        <div><span class="k-label">Reference value</span><span class="num">${cr(p.refValue)}</span>${p.conflict ? '<br><span class="tag warn">multiple values</span>' : ""}</div>
        <div><span class="k-label">Length</span><span class="num">${p.length_km != null ? fmt(p.length_km, 2) + " km" : "Not captured"}</span></div>
        <div><span class="k-label">State(s)</span>${esc(p.states.join(", "))}</div>
        <div><span class="k-label">Authority</span>${esc(a ? a.short : "Not captured")}</div>
        <div><span class="k-label">Contractor(s)</span>${p.companies.map(coLink).join(", ") || '<span class="muted">Not ingested</span>'}</div>
        <div><span class="k-label">Record confidence</span>${cf(p.confidence)}</div>
        <div><span class="k-label">Data-confidence score</span><span class="num">${p.dq.score}/100</span></div>
      </div>
      <h3>Project map</h3>${miniMap(p)}
      <h3>Summary</h3><dl class="kv">
        <dt>Aliases</dt><dd>${esc(p.aliases.join(" · "))}</dd><dt>Corridor / highway</dt><dd>${esc(p.corridor)} · ${esc(p.highway_no || "—")}</dd><dt>Programme</dt><dd>${esc(p.program || "—")}</dd>
        <dt>Origin → destination</dt><dd>${esc(p.origin)} → ${esc(p.destination)}</dd><dt>Length basis</dt><dd>${esc(p.length_note)}</dd><dt>Lanes</dt><dd>${esc(p.lanes || "Not captured")}</dd>
        <dt>Terrain</dt><dd>${esc(p.terrain || "—")}</dd><dt>Strategic importance</dt><dd>${esc(p.strategic || "—")}</dd>${p.structures ? `<dt>Structures</dt><dd>${esc(p.structures)}</dd>` : ""}</dl>
      <h3>Who built it?</h3><div class="who">${who.map(([q, v]) => `<div class="q">${q}</div><div>${v}</div>`).join("")}</div>
      <h3>Contract structure</h3><div class="tree">${esc(tree.join("\n"))}</div>
      ${p.packages.length ? table(["Pkg", "Name", "Contractor", "₹cr", "km", "Award", "Status", "Prog.", "Evidence"], p.packages.map((k) => [esc(k.no), esc(k.name), k.contractor ? k.contractor.members.map((m) => coLink(m.company)).join(" + ") : "—", fmt(k.value_cr, 2), fmt(k.length_km, 2), esc(k.award_date || "—"), stPill(k.status), k.progress_pct != null ? k.progress_pct + "%" : "—", srcLink(k.source) + " " + cf(k.confidence)]), [3, 4]) : ""}
      <p class="note">${esc(p.packages_summary.note || "")}</p>
      ${p.prior_contractors ? `<p class="note">Prior contractor(s): ${p.prior_contractors.map((x) => coName(x.company) + " — " + x.role + " [" + x.source + "]").join("; ")}</p>` : ""}
      <h3>Financials — all reported values (none silently selected)</h3>
      ${table(["Value", "Value type", "Date", "Source", "Confidence", "Reference?"], p.values.map((v) => [cr(v.value_cr), esc(v.type), esc(v.date || "—"), srcLink(v.source), cf(v.confidence), v.ref ? "✓ reference" : ""]), [0])}
      ${p.value_conflict ? `<p class="note">${esc(p.value_conflict)}</p>` : ""}${!p.values.length ? '<p class="empty">No value reported in captured sources.</p>' : ""}
      <h3>Timeline (append-only status history)</h3>${table(["Date", "Precision", "Status", "Event", "Source"], p.events.map((e) => [`<span class="mono">${esc(e.date || "undated")}</span>`, esc(e.precision), evPill(e), esc(e.event), srcLink(e.source)]))}
      <dl class="kv"><dt>Planned completion</dt><dd>${esc(p.dates.planned_completion || "Not documented")}</dd><dt>Revised completion</dt><dd>${esc(p.dates.revised_completion || "—")}</dd><dt>Actual completion</dt><dd>${esc(p.dates.actual_completion || "—")}</dd></dl>
      <h3>Progress</h3><p>${p.progress.physical_pct != null ? `<b class="num">${p.progress.physical_pct}%</b> physical · ` : ""}${esc(p.progress.note || "—")} <span class="muted">(as of ${esc(p.progress.asof)})</span></p>
      <h3>Documented risks &amp; delays</h3>${p.risks.length ? table(["Category", "Documented cause", "Source"], p.risks.map((r) => [esc(r.category), esc(r.text), srcLink(r.source)])) : '<p class="empty">No documented delay causes captured. (Causes are never inferred.)</p>'}
      <h3>Technology / systems requirements</h3>${p.tech.length ? table(["Domain", "Classification", "Basis"], p.tech.map((t) => [esc(t.domain), `<span class="tag ${t.kind === "documented" ? "" : "warn"}">${t.kind === "documented" ? "Documented requirement" : "Potential — inferred from characteristics"}</span>`, esc(t.basis)])) : '<p class="empty">None recorded.</p>'}
      ${p.opportunity ? `<h3>Opportunity signal</h3><p><b>${esc(p.opportunity.category)}</b> — ${esc(p.opportunity.signal)} ${srcLink(p.opportunity.source)} <span class="muted">as of ${esc(p.opportunity.asof)}</span></p>` : ""}
      <h3>Stakeholders</h3><p class="empty">No publicly identified project officials captured in the sample (schema: stakeholders table — professional, public information only).</p>
      <h3>Sources</h3>${table(["ID", "Tier", "Publisher", "Title", "Published"], p.srcIds.map((id) => src[id]).filter(Boolean).map((s) => [`<span class="mono">${s.id}</span>`, "T" + s.tier, esc(s.publisher), `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`, esc(s.pub_date || "—")]))}
      <h3>Freshness</h3><dl class="kv"><dt>Last verified</dt><dd>${esc(p.last_verified)}</dd><dt>Last source publication</dt><dd>${esc(p.lastSourcePub || "Not captured")}</dd><dt>Last project update</dt><dd>${esc(p.status_asof)}</dd></dl>`;
    $("#drawer").hidden = false;
  }

  // ------------------------------------------------------------ 6 SEARCH
  function searchIndex() {
    const rows = [];
    P.forEach((p) => rows.push({ kind: "Project", id: p.id, text: [p.name, ...p.aliases, p.corridor, p.highway_no, ...p.states, p.origin, p.destination, p.type, p.authority && p.authority.short, p.authority && p.authority.name, ...p.companies.map(coName), ...p.packages.map((k) => k.no)].join(" ").toLowerCase(), p }));
    D.companies.forEach((c) => rows.push({ kind: "Company", id: c.id, text: [c.name, ...c.aliases].join(" ").toLowerCase(), c }));
    D.authorities.forEach((a) => rows.push({ kind: "Authority", id: a.id, text: [a.short, a.name].join(" ").toLowerCase(), a }));
    uniq(P.flatMap((p) => p.states)).forEach((s) => rows.push({ kind: "State", id: s, text: s.toLowerCase() }));
    return rows;
  }
  function initSearch() {
    const idx = searchIndex(); const box = $("#search-results"), inp = $("#search"); let cur = 0, res = [];
    const draw = () => {
      box.innerHTML = res.map((r, i) => {
        if (r.kind === "Project") { const p = r.p; return `<div class="sr-row ${i === cur ? "active" : ""}" data-i="${i}"><span><b>${esc(p.name)}</b> <span class="tag">Project</span></span>${stPill(p.status)}<span class="sr-meta">${cr(p.refValue)} · ${esc(p.companies.map(coName).join(", ") || "contractor n/a")} · ${esc(p.authority ? p.authority.short : "authority n/a")} · ${esc(p.states.join(", "))} · source ${esc(p.status_source)}</span></div>`; }
        const label = r.kind === "Company" ? r.c.name : r.kind === "Authority" ? r.a.short + " — " + r.a.name : r.id;
        const n = r.kind === "Company" ? P.filter((p) => p.companies.includes(r.id)).length : r.kind === "Authority" ? P.filter((p) => p.authority_id === r.id).length : P.filter((p) => p.states.includes(r.id)).length;
        return `<div class="sr-row ${i === cur ? "active" : ""}" data-i="${i}"><span><b>${esc(label)}</b> <span class="tag">${r.kind}</span></span><span class="muted">${n} project(s)</span><span class="sr-meta">Enter to filter all views</span></div>`;
      }).join("") || '<div class="sr-row"><span class="muted">No match in sample. Search covers project, alias, corridor, highway, state, city, contractor, JV member, authority, package.</span></div>';
      box.hidden = false;
      $$(".sr-row[data-i]", box).forEach((el) => el.addEventListener("mousedown", (e) => { e.preventDefault(); pick(res[+el.dataset.i]); }));
    };
    const pick = (r) => {
      if (!r) return; box.hidden = true; inp.blur();
      if (r.kind === "Project") openProject(r.id);
      else if (r.kind === "Company") { F.company = r.id; syncControls(); renderAll(); showView("contractors"); }
      else if (r.kind === "Authority") { F.authority = r.id; syncControls(); renderAll(); showView("authorities"); }
      else { F.state = r.id; syncControls(); renderAll(); showView("states"); }
    };
    inp.addEventListener("input", () => { const q = inp.value.trim().toLowerCase(); if (!q) { box.hidden = true; return; } const terms = q.split(/\s+/); res = idx.filter((r) => terms.every((t) => r.text.includes(t))).slice(0, 12); cur = 0; draw(); });
    inp.addEventListener("keydown", (e) => { if (e.key === "ArrowDown") { cur = Math.min(res.length - 1, cur + 1); draw(); e.preventDefault(); } else if (e.key === "ArrowUp") { cur = Math.max(0, cur - 1); draw(); e.preventDefault(); } else if (e.key === "Enter") pick(res[cur]); else if (e.key === "Escape") { box.hidden = true; inp.blur(); } });
    inp.addEventListener("blur", () => setTimeout(() => (box.hidden = true), 120));
    document.addEventListener("keydown", (e) => { if (e.key === "/" && document.activeElement !== inp) { e.preventDefault(); inp.focus(); } if (e.key === "Escape") $("#drawer").hidden = true; });
  }

  // ------------------------------------------------------------ exports
  function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function exportCSV() {
    const cols = ["id", "name", "type", "status", "status_asof", "states", "authority", "contractors", "reference_value_cr", "all_values", "length_km", "confidence", "dq_score", "geometry_precision", "last_verified", "sources"];
    const q = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const rows = filtered().map((p) => [p.id, p.name, p.type, S[p.status].label, p.status_asof, p.states.join("; "), p.authority ? p.authority.short : "", p.companies.map(coName).join("; "), p.refValue, p.values.map((v) => `${v.value_cr} (${v.type}; ${v.source})`).join(" | "), p.length_km, p.confidence, p.dq.score, p.geom.precision, p.last_verified, p.srcIds.map((id) => src[id] ? src[id].url : id).join(" ")].map(q).join(","));
    download(`itis-projects-${AS_OF}.csv`, "﻿" + cols.join(",") + "\n" + rows.join("\n"), "text/csv");
  }

  // ------------------------------------------------------------ 7 BOOT
  let currentView = "map";
  function showView(v) {
    currentView = v;
    $$("#rail button").forEach((b) => b.classList.toggle("active", b.dataset.view === v));
    $$(".view").forEach((s) => s.classList.toggle("active", s.id === "view-" + v));
    try { localStorage.setItem("itis-view", v); } catch (e) { /* storage unavailable */ }
    renderAll();
  }
  function renderAll() {
    const list = filtered();
    renderChips(); renderKPIs(list);
    const V = {
      map: () => { renderMap(list); renderPipeline(list); renderFeed(list); },
      states: () => renderStates(list), corridors: () => renderCorridors(list), projects: () => renderProjects(list),
      contractors: () => renderContractors(list), authorities: () => renderAuthorities(list), tenders: () => renderTenders(list),
      radar: () => renderRadar(list), graph: () => renderGraph(list), timeline: () => renderTimeline(list), quality: renderQuality, sources: renderSources,
    };
    V[currentView]();
  }
  function initTheme() {
    let t = null; try { t = localStorage.getItem("itis-theme"); } catch (e) { /* ignore */ }
    if (t) document.documentElement.setAttribute("data-theme", t);
    $("#theme-toggle").addEventListener("click", () => {
      const curDark = document.documentElement.getAttribute("data-theme") ? document.documentElement.getAttribute("data-theme") === "dark" : !matchMedia("(prefers-color-scheme: light)").matches;
      const next = curDark ? "light" : "dark"; document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("itis-theme", next); } catch (e) { /* ignore */ }
      renderAll();
    });
  }
  function boot() {
    $("#asof").textContent = AS_OF;
    initTheme(); initControls(); initSearch(); mapEvents(); renderLegend();
    $$("#rail button").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
    $("#c-sort").addEventListener("change", () => renderAll());
    $("#d-close").addEventListener("click", () => ($("#drawer").hidden = true));
    $("#d-print").addEventListener("click", () => window.print());
    $("#export-csv").addEventListener("click", exportCSV);
    $("#export-json").addEventListener("click", () => download(`itis-sample-${AS_OF}.json`, JSON.stringify(D, null, 2), "application/json"));
    // delegated links anywhere in the app
    document.addEventListener("click", (e) => {
      const pj = e.target.closest("[data-project]"); if (pj && !e.target.closest("#map")) { openProject(pj.dataset.project); return; }
      const c = e.target.closest("[data-company]"); if (c) { $("#drawer").hidden = true; graphSel = c.dataset.company; showView("graph"); }
    });
    let v = "map"; try { v = localStorage.getItem("itis-view") || "map"; } catch (e) { /* ignore */ }
    showView($("#view-" + v) ? v : "map");
  }
  boot();
})();
