import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.PUBLIC_SUPABASE_URL || "";
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
const BUCKET = "site-media";
const CATEGORIES = ["Abattage", "Nivellement", "Terrassement", "Aménagement extérieur", "Bois de chauffage", "Autre"];
const PHASES = [["", "Sans étape"], ["avant", "Avant"], ["pendant", "Pendant"], ["apres", "Après"]];
const DEFAULT_HERO = { "wood-hero": "/bois-page.webp", "pellets-hero": "/palette-pellets-comfo.webp" };

const $ = (selector) => document.querySelector(selector);
const loginPanel = $("#login-panel");
const dashboard = $("#dashboard");
const loginStatus = $("#login-status");

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[c]);

if (!url || !anonKey) {
  if (loginStatus) loginStatus.textContent = "Supabase n’est pas encore configuré. Ajoutez PUBLIC_SUPABASE_URL et PUBLIC_SUPABASE_ANON_KEY dans .env.";
} else {
  const supabase = createClient(url, anonKey);

  /* ---------- Session ---------- */
  async function refreshSession() {
    const { data } = await supabase.auth.getSession();
    if (data.session) showDashboard();
    else showLogin();
  }
  function showLogin() {
    loginPanel.hidden = false;
    dashboard.hidden = true;
  }
  let dashboardLoaded = false;
  async function showDashboard() {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    if (dashboardLoaded) return;
    dashboardLoaded = true;
    await Promise.all([loadSettings(), loadMedia(), loadChantiers(), loadRequests()]);
  }

  $("#login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Connexion…";
    const { error } = await supabase.auth.signInWithPassword({ email: $("#login-email")?.value, password: $("#login-password")?.value });
    loginStatus.textContent = error ? error.message : "";
    await refreshSession();
  });
  $("#logout")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    dashboardLoaded = false;
    await refreshSession();
  });

  /* ---------- Prix ---------- */
  async function loadSettings() {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
    if (error) return;
    $("#price-small").value = data.wood_price_small;
    $("#price-large").value = data.wood_price_large;
  }
  $("#save-prices")?.addEventListener("click", async () => {
    const { error } = await supabase.from("site_settings").update({ wood_price_small: Number($("#price-small").value), wood_price_large: Number($("#price-large").value) }).eq("id", 1);
    $("#price-status").textContent = error ? error.message : "Prix enregistrés.";
  });

  /* ---------- Photos produits ---------- */
  async function loadMedia() {
    const { data } = await supabase.from("site_media").select("*").in("slot", ["wood-hero", "pellets-hero"]);
    (data || []).forEach((item) => {
      const preview = item.slot === "wood-hero" ? $("#wood-preview") : $("#pellets-preview");
      if (preview) preview.src = item.url.startsWith("https://") ? item.url : DEFAULT_HERO[item.slot];
    });
  }
  document.querySelectorAll("[data-upload]").forEach((button) => {
    button.addEventListener("click", async () => {
      const slot = button.dataset.upload;
      const input = slot === "wood-hero" ? $("#wood-image") : $("#pellets-image");
      const status = slot === "wood-hero" ? $("#wood-status") : $("#pellets-status");
      const file = input?.files?.[0];
      if (!file) { status.textContent = "Choisissez d’abord une image."; return; }
      status.textContent = "Préparation…";
      const blob = await toWebp(file, 1600);
      status.textContent = "Téléversement…";
      const path = `products/${slot}.webp`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadError) { status.textContent = uploadError.message; return; }
      const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const product = slot === "wood-hero" ? "wood" : "pellets";
      const { error: mediaError } = await supabase.from("site_media").upsert({ product, slot, url: `${publicData.publicUrl}?v=${Date.now()}` }, { onConflict: "slot" });
      status.textContent = mediaError ? mediaError.message : "Photo mise à jour.";
      await loadMedia();
    });
  });

  /* ---------- Outils images ---------- */
  // Réduit (1600 px max) et convertit en WebP côté navigateur : les photos de téléphone font souvent 5 Mo+.
  async function toWebp(file, maxSize) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
      if (blob) return blob;
    } catch { /* on envoie le fichier tel quel */ }
    return file;
  }
  const storagePathFromUrl = (publicUrl) => {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = publicUrl.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(publicUrl.slice(i + marker.length).split("?")[0]);
  };
  const slugify = (text) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "chantier";

  /* ---------- Réalisations ---------- */
  const chantiersBox = $("#chantiers-admin");
  const chantierStatus = $("#chantier-status");
  let chantiers = [];
  const say = (message) => { chantierStatus.textContent = message; };

  async function loadChantiers() {
    const { data, error } = await supabase.from("chantiers").select("*, chantier_photos(*)").order("position", { ascending: true }).order("id", { ascending: false });
    if (error) {
      chantiersBox.textContent = /does not exist|schema cache/i.test(error.message)
        ? "La table des réalisations n’existe pas encore : exécutez supabase/realisations.sql dans Supabase."
        : error.message;
      return;
    }
    chantiers = (data || []).map((c) => ({ ...c, chantier_photos: (c.chantier_photos || []).sort((a, b) => a.position - b.position) }));
    renderChantiers();
  }

  function renderChantiers() {
    if (!chantiers.length) { chantiersBox.textContent = "Aucune réalisation pour l’instant."; return; }
    chantiersBox.innerHTML = chantiers.map((c) => `
      <article class="chantier-admin" data-chantier="${c.id}">
        <header class="chantier-admin-head">
          <strong>${escapeHtml(c.title)}</strong>
          <span class="badge ${c.published ? "ok" : ""}">${c.published ? "Publié" : "Brouillon"}</span>
          <span class="admin-muted">${c.chantier_photos.length} photo${c.chantier_photos.length > 1 ? "s" : ""}</span>
        </header>
        <div class="admin-grid two">
          <label>Titre<input data-field="title" value="${escapeHtml(c.title)}" maxlength="120" /></label>
          <label>Catégorie
            <select data-field="category">${[...new Set([...CATEGORIES, c.category])].map((x) => `<option ${x === c.category ? "selected" : ""}>${escapeHtml(x)}</option>`).join("")}</select>
          </label>
        </div>
        <label class="chantier-summary">Description courte<textarea data-field="summary" maxlength="400" rows="2">${escapeHtml(c.summary)}</textarea></label>
        <div class="chantier-checks">
          <label><input type="checkbox" data-field="published" ${c.published ? "checked" : ""} /> Visible sur le site</label>
          <label><input type="checkbox" data-field="featured" ${c.featured ? "checked" : ""} /> Afficher sur la page d’accueil</label>
        </div>
        <div class="chantier-actions">
          <button class="admin-button" data-action="save-chantier">Enregistrer le chantier</button>
          <button class="admin-button danger" data-action="delete-chantier">Supprimer le chantier</button>
        </div>

        <h3>Photos</h3>
        <div class="photo-admin-grid">
          ${c.chantier_photos.length ? c.chantier_photos.map((p, i) => `
            <figure class="photo-admin" data-photo="${p.id}">
              <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.alt)}" loading="lazy" />
              <select data-photo-field="phase" aria-label="Étape">${PHASES.map(([v, l]) => `<option value="${v}" ${(p.phase || "") === v ? "selected" : ""}>${l}</option>`).join("")}</select>
              <input data-photo-field="alt" value="${escapeHtml(p.alt)}" maxlength="200" placeholder="Description de la photo" aria-label="Description de la photo" />
              <div class="photo-admin-buttons">
                <button type="button" data-action="photo-up" aria-label="Déplacer avant" ${i === 0 ? "disabled" : ""}>←</button>
                <button type="button" data-action="photo-down" aria-label="Déplacer après" ${i === c.chantier_photos.length - 1 ? "disabled" : ""}>→</button>
                <button type="button" data-action="photo-delete" class="danger" aria-label="Supprimer la photo">✕</button>
              </div>
            </figure>`).join("") : '<p class="admin-muted">Aucune photo pour ce chantier.</p>'}
        </div>
        <div class="photo-upload">
          <label>Ajouter des photos<input type="file" data-upload-files accept="image/jpeg,image/png,image/webp" multiple /></label>
          <label>Étape
            <select data-upload-phase>${PHASES.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select>
          </label>
          <button class="admin-button" data-action="upload-photos">Ajouter</button>
        </div>
      </article>`).join("");
  }

  const findChantier = (el) => chantiers.find((c) => c.id === Number(el.closest("[data-chantier]")?.dataset.chantier));
  const find = (el) => ({ chantier: findChantier(el), photo: findChantier(el)?.chantier_photos.find((p) => p.id === Number(el.closest("[data-photo]")?.dataset.photo)) });

  // Création
  $("#chantier-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = $("#new-title").value.trim();
    if (title.length < 3) { say("Le titre doit contenir au moins 3 caractères."); return; }
    let slug = slugify(title);
    const taken = new Set(chantiers.map((c) => c.slug));
    for (let n = 2; taken.has(slug); n++) slug = `${slugify(title)}-${n}`;
    say("Création…");
    const { error } = await supabase.from("chantiers").insert({ slug, title, category: $("#new-category").value, summary: $("#new-summary").value.trim(), published: false, position: 0 });
    if (error) { say(error.message); return; }
    event.target.reset();
    say("Chantier créé en brouillon : ajoutez des photos puis cochez « Visible sur le site ».");
    await loadChantiers();
  });

  // Actions (délégation)
  chantiersBox?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const { chantier, photo } = find(button);
    if (!chantier) return;
    button.disabled = true;
    try {
      if (action === "save-chantier") {
        const card = button.closest("[data-chantier]");
        const val = (name) => card.querySelector(`[data-field="${name}"]`);
        const title = val("title").value.trim();
        if (title.length < 3) { say("Le titre doit contenir au moins 3 caractères."); return; }
        if (val("published").checked && !chantier.chantier_photos.length) { say("Ajoutez au moins une photo avant de publier ce chantier."); return; }
        const { error } = await supabase.from("chantiers").update({ title, category: val("category").value, summary: val("summary").value.trim(), published: val("published").checked, featured: val("featured").checked }).eq("id", chantier.id);
        say(error ? error.message : "Chantier enregistré.");
        await loadChantiers();
      } else if (action === "delete-chantier") {
        if (!confirm(`Supprimer définitivement « ${chantier.title} » et toutes ses photos ?`)) return;
        const paths = chantier.chantier_photos.map((p) => storagePathFromUrl(p.url)).filter(Boolean);
        if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
        const { error } = await supabase.from("chantiers").delete().eq("id", chantier.id);
        say(error ? error.message : "Chantier supprimé.");
        await loadChantiers();
      } else if (action === "photo-delete") {
        if (!confirm("Supprimer cette photo ?")) return;
        const path = storagePathFromUrl(photo.url);
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        const { error } = await supabase.from("chantier_photos").delete().eq("id", photo.id);
        say(error ? error.message : "Photo supprimée.");
        await loadChantiers();
      } else if (action === "photo-up" || action === "photo-down") {
        const list = chantier.chantier_photos;
        const i = list.indexOf(photo);
        const j = action === "photo-up" ? i - 1 : i + 1;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        const results = await Promise.all(list.map((p, index) => supabase.from("chantier_photos").update({ position: index + 1 }).eq("id", p.id)));
        const failed = results.find((r) => r.error);
        say(failed ? failed.error.message : "Ordre enregistré.");
        await loadChantiers();
      } else if (action === "upload-photos") {
        const card = button.closest("[data-chantier]");
        const files = [...(card.querySelector("[data-upload-files]").files || [])];
        if (!files.length) { say("Choisissez d’abord une ou plusieurs photos."); return; }
        const phase = card.querySelector("[data-upload-phase]").value || null;
        let position = Math.max(0, ...chantier.chantier_photos.map((p) => p.position));
        let done = 0;
        for (const file of files) {
          say(`Téléversement ${done + 1}/${files.length}…`);
          const blob = await toWebp(file, 1600);
          const path = `realisations/${chantier.id}/${crypto.randomUUID()}.webp`;
          const { error: upError } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/webp" });
          if (upError) { say(upError.message); break; }
          const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
          const { error } = await supabase.from("chantier_photos").insert({ chantier_id: chantier.id, url: pub.publicUrl, alt: chantier.title, phase, position: ++position });
          if (error) { say(error.message); break; }
          done++;
        }
        if (done === files.length) say(`${done} photo${done > 1 ? "s" : ""} ajoutée${done > 1 ? "s" : ""}.`);
        await loadChantiers();
      }
    } finally {
      button.disabled = false;
    }
  });

  // Modification d'une photo (étape / description) : enregistrement immédiat
  chantiersBox?.addEventListener("change", async (event) => {
    const field = event.target.dataset.photoField;
    if (!field) return;
    const { photo } = find(event.target);
    if (!photo) return;
    const value = field === "phase" ? event.target.value || null : event.target.value.trim();
    const { error } = await supabase.from("chantier_photos").update({ [field]: value }).eq("id", photo.id);
    if (error) say(error.message);
    else { photo[field] = value; say("Photo enregistrée."); }
  });

  /* ---------- Demandes ---------- */
  async function loadRequests() {
    const container = $("#requests-list");
    const { data, error } = await supabase.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) { container.textContent = error.message; return; }
    if (!data?.length) { container.textContent = "Aucune demande reçue."; return; }
    container.innerHTML = data.map((request) => `
      <article class="request-item">
        <div><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong> · ${escapeHtml(request.request_type)}</div>
        <div>${escapeHtml(request.service || request.product)} · ${escapeHtml(request.quantity || "quantité non précisée")}</div>
        <div>${escapeHtml(request.email)} · ${escapeHtml(request.phone)}</div>
        <p>${escapeHtml(request.message)}</p>
        <small>${new Date(request.created_at).toLocaleString("fr-BE")}</small>
      </article>`).join("");
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) showDashboard();
    else showLogin();
  });
  refreshSession();
}
