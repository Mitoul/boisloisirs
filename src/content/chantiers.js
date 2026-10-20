/*
 * Réalisations — chaque chantier a une chronologie de photos.
 * phase : "avant" | "pendant" | "apres"
 * Les fichiers vont dans public/realisations/<slug>/ (voir scripts/fetch-photos.sh).
 * Tant qu'une photo n'existe pas, on renvoie vers une image locale provisoire (fallback).
 */
export const phases = {
  avant: "Avant",
  pendant: "Pendant les travaux",
  apres: "Après"
};

export const chantiers = [
  {
    slug: "terrassement-piscine",
    category: "Terrassement",
    title: "Terrassement pour projet extérieur",
    summary: "Préparation du terrain et excavation.",
    cover: "/terrassement-accueil.jpg",
    photos: [
      { phase: "avant", src: "/realisations/terrassement-piscine/avant-1.jpg", fallback: "/terrassement-accueil.jpg", alt: "Terrain avant terrassement" }
    ]
  },
  {
    slug: "amenagement-terrasse",
    category: "Aménagement extérieur",
    title: "Terrasse et mise en lumière",
    summary: "De la dalle à la terrasse terminée.",
    cover: "/amenagement-accueil.jpg",
    photos: [
      { phase: "avant", src: "/realisations/amenagement-terrasse/avant-1.jpg", fallback: "/amenagement-accueil.jpg", alt: "Terrain avant aménagement" }
    ]
  },
  {
    slug: "nivellement-terrain",
    category: "Nivellement",
    title: "Nettoyage et nivellement de terrain",
    summary: "Remise en état d'un terrain en friche.",
    cover: "/nivellement-accueil.jpg",
    photos: [
      { phase: "apres", src: "/realisations/nivellement-terrain/apres-1.jpg", fallback: "/nivellement-accueil.jpg", alt: "Terrain nivelé" }
    ]
  },
  {
    slug: "abattage",
    category: "Abattage",
    title: "Abattage et préparation du bois",
    summary: "Abattage, dessouchage, broyage.",
    cover: "/abattage-accueil.jpg",
    photos: [
      { phase: "pendant", src: "/realisations/abattage/pendant-1.jpg", fallback: "/abattage-accueil.jpg", alt: "Abattage d'un arbre" }
    ]
  }
];
