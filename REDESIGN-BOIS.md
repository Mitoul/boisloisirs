# Refonte — page Bois de chauffage

Cette version ajoute une première vraie page produit pour le bois de chauffage et modernise la homepage.

## Ce qui a été ajouté

- `/produits/bois/` : nouvelle page produit.
- Hero produit avec bénéfices, CTA et visuel.
- Section des essences.
- Section tarifs.
- Section livraison en 3 étapes.
- CTA vers les pellets / contact.
- Les cartes de la homepage deviennent cliquables.
- Navigation mise à jour avec « Produits ».
- Métadonnées SEO de base améliorées.
- Correction du conteneur CSS (`--container-max-width`).

## Image du bois

Pour la première intégration, le hero utilise temporairement l'image actuellement publiée sur le site :

`https://www.boisloisirs.be/wp-content/uploads/2026/02/bois-page.jpg`

Pour la production, il est préférable de copier cette image dans `public/bois-chauffage.jpg` puis de remplacer `woodProduct.image.src` dans `src/content/wood.js` par :

`/bois-chauffage.jpg`

## Installation

Depuis le dossier du projet :

```bash
npm install
npm run dev
```

Puis ouvrir :

`http://localhost:4321/produits/bois/`

## Prochaine étape recommandée

Créer la page `/produits/pellets/` avec la même logique visuelle, puis séparer définitivement la navigation en deux familles :

- Produits : Bois de chauffage / Pellets
- Services : Abattage / Nivellement / Terrassement / Aménagements extérieurs
