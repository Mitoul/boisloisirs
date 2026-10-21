/*
 * Réalisations « en direct » : lit les chantiers gérés dans l'admin (Supabase)
 * et les affiche à la place du contenu statique généré au build.
 * Sans Supabase, ou si la table est vide / injoignable, le contenu statique reste affiché.
 */
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";

export const phaseLabels = { avant: "Avant", pendant: "Pendant les travaux", apres: "Après" };
const phaseOrder = ["avant", "pendant", "apres"];

export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

// N'autorise que des chemins du site ou des URL https (pas de javascript:, data:…)
export function safeUrl(url) {
  const u = String(url ?? "");
  return u.startsWith("/") && !u.startsWith("//") || u.startsWith("https://") ? u : "";
}

export async function loadChantiers() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const select = "slug,title,category,summary,featured,position,chantier_photos(url,alt,phase,position)";
    const res = await fetch(`${SUPABASE_URL}/rest/v1/chantiers?select=${select}&published=eq.true&order=position.asc,id.desc`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    const list = rows
      .map((row) => {
        const photos = (row.chantier_photos || [])
          .filter((p) => safeUrl(p.url))
          .sort((a, b) => a.position - b.position)
          .map((p) => ({ src: p.url, alt: p.alt || row.title, phase: p.phase || undefined }));
        return { slug: row.slug, title: row.title, category: row.category, summary: row.summary, featured: row.featured, cover: photos[0]?.src || "", photos };
      })
      .filter((c) => c.photos.length > 0);
    return list.length ? list : null;
  } catch {
    return null;
  }
}

export function cardHtml(c, href, { showCount = true, summary = true } = {}) {
  return `<a class="gallery-card" href="${esc(href)}">
    <div class="gallery-image"><img src="${esc(safeUrl(c.cover))}" alt="${esc(c.title)}" loading="lazy" decoding="async" /></div>
    <div class="gallery-content">
      <span>${esc(c.category)}</span>
      <h2>${esc(c.title)}</h2>
      ${summary && c.summary ? `<p>${esc(c.summary)}</p>` : ""}
      ${showCount && c.photos.length > 1 ? `<small>${c.photos.length} photos</small>` : ""}
    </div>
  </a>`;
}

export function timelineHtml(c) {
  const hasPhases = c.photos.some((p) => p.phase);
  const groups = hasPhases
    ? phaseOrder.map((k) => ({ label: phaseLabels[k], photos: c.photos.filter((p) => p.phase === k) })).concat([{ label: "", photos: c.photos.filter((p) => !p.phase) }]).filter((g) => g.photos.length)
    : [{ label: "", photos: c.photos }];
  return `<ol class="timeline">${groups.map((g) => `<li class="timeline-step">
    ${g.label ? `<h2>${esc(g.label)}</h2>` : ""}
    <div class="timeline-photos">${g.photos.map((p) => `<a href="${esc(safeUrl(p.src))}" data-lightbox data-alt="${esc(p.alt)}" data-caption="${esc(g.label ? `${g.label} — ${p.alt}` : p.alt)}"><img src="${esc(safeUrl(p.src))}" alt="${esc(p.alt)}" loading="lazy" decoding="async" /></a>`).join("")}</div>
  </li>`).join("")}</ol>`;
}
