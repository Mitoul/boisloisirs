# AUDIT — Bois Loisirs (phase 0)

## Stack
Astro 7 statique, JS/CSS maison (pas de TypeScript), Supabase (admin + contact), déploiement GitHub Pages via branche `deploy-test` (push sur `develop` → test.boisloisirs.be).

## Constats
**CRITIQUE**
- `.env` présent dans le zip (clés Supabase). Ignoré par Git, mais ne jamais partager le zip tel quel. La clé `anon` est publique par conception, vérifier qu'aucune `service_role` n'a jamais été collée dedans.

**IMPORTANT**
- Admin : `supabase-js` chargé depuis `esm.sh` à l'exécution → dépendance externe ; préférer le paquet npm.
- `site.seo.image` = `/og-image.jpg` absent de `public/` → pas d'image de partage.
- `site.js` contient des valeurs placeholder (`services`, `logo.alt`) et `PUBLIC_SITE_URL` par défaut = prod : vérifier le canonical/sitemap sur le sous-domaine de test.
- Test : ajouter `noindex` quand `PUBLIC_SITE_ENV=test` (à vérifier dans Layout).
- Images lourdes (jpg 100-320 Ko, png pellets 880 Ko) : convertir en WebP/AVIF.
- Aucun test automatisé (Playwright + axe) ni lint.

**MINEUR**
- README Astro par défaut ; `.DS_Store` versionnés ; pas de lien « Réalisations » vers une vraie page (corrigé).

## Ajouté dans cette itération : galerie « évolution du chantier »
- `src/content/chantiers.js` : un chantier = une chronologie Avant / Pendant / Après.
- `/realisations/` (liste) et `/realisations/<slug>/` (timeline + visionneuse plein écran, clavier ←/→, `<dialog>` natif, sans dépendance).
- Fallback automatique vers l'image locale si une photo manque.
- `scripts/fetch-photos.sh` : récupère les photos depuis l'ancien site (à lancer en local).
- Navigation : « Réalisations » pointe vers `/realisations/`.

## À faire ensuite (phases suivantes)
1. Récupérer toutes les vraies photos (le sandbox n'a pas accès à boisloisirs.be) et compléter `chantiers.js`.
2. Optimisation images (WebP) + noindex test + og-image.
3. Playwright/axe : 390 · 768 · 1024 · 1440 px.
4. Option : gérer les chantiers depuis `/admin/` (table Supabase `chantiers` + Storage) pour que le client ajoute lui-même les photos.


## Itération 2 — corrections (QA Playwright + axe, 390 · 768 · 1024 · 1440 px)
Avant : 20 violations de contraste sur l'accueil, `lang="fr_BE"` invalide, débordement horizontal de 27 px à 1024 px (bouton « Devis gratuit »), `<main>` imbriqués (contact, pellets), pas de `<h1>` sur /realisations/.
Après : **0 violation axe, 0 débordement, 0 image cassée** sur 8 pages × 4 tailles.

- Images : JPG/PNG → WebP (4,1 Mo → 2,5 Mo), `og-image.jpg` créée, images du site d'origine (hotlinkées) remplacées par des copies locales.
- Polices : Poppins auto-hébergée (`@fontsource`), plus de Google Fonts (RGPD, perf).
- SEO : `robots.txt` dynamique (bloque tout hors production, `/admin/` interdit), `/admin` exclu du sitemap, `lang="fr-BE"`.
- Accessibilité : contrastes (vert principal `#00770f`, gris, bois), h1/h2 cohérents, un seul `<main>`, menu burger jusqu'à 1100 px.
- Galerie : l'accueil lit maintenant les chantiers (`featured`), cartes cliquables vers les fiches.

## Reste à faire
1. **Admin des réalisations** (ajout/modification des photos par le client) : table Supabase `chantiers` + Storage, à faire plus tard.
2. L'admin charge `supabase-js` depuis esm.sh → à passer sur le paquet npm.
3. Vérifier en ligne (non testable depuis le sandbox) : appels Supabase des pages produits, formulaire de contact, Lighthouse.
4. Photos d'origine en meilleure résolution (actuellement 600×600).
5. Mentions légales / vie privée à faire valider par le client.
