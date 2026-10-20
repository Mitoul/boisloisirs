/*
 * Réalisations — photos dans public/realisations/<slug>/01.jpg, 02.jpg…
 * 4 photos = chronologie (01 avant · 02-03 pendant · 04 après).
 * 1 photo  = pas de phase (omettre "phase").
 * Pour ajouter un chantier : copier les photos, ajouter un bloc ci-dessous.
 */
export const phases = {
  avant: "Avant",
  pendant: "Pendant les travaux",
  apres: "Après"
};

export const chantiers = [
  {
    slug: "abattage-helecine",
    category: "Abattage",
    title: "Abattage à Hélécine",
    summary: "Abattage d'un grand arbre en site arboré, avec câble de traction puis débitage du tronc.",
    cover: "/realisations/abattage-helecine/01.jpg",
    photos: [
      { phase: "avant", src: "/realisations/abattage-helecine/01.jpg", alt: "Arbres sur pied avant l'abattage" },
      { phase: "pendant", src: "/realisations/abattage-helecine/02.jpg", alt: "Câble de traction fixé au tronc" },
      { phase: "pendant", src: "/realisations/abattage-helecine/03.jpg", alt: "Tronc abattu et tronçonneuse" },
      { phase: "apres", src: "/realisations/abattage-helecine/04.jpg", alt: "Rondins débités sur la pelouse" }
    ]
  },
  {
    slug: "abattage-hetre",
    category: "Abattage",
    title: "Abattage d'un hêtre au bord d'un étang",
    summary: "Évacuation et débitage d'un hêtre tombé au bord de l'eau.",
    cover: "/realisations/abattage-hetre/01.jpg",
    photos: [
      { phase: "avant", src: "/realisations/abattage-hetre/01.jpg", alt: "Hêtre tombé au bord de l'étang" },
      { phase: "pendant", src: "/realisations/abattage-hetre/02.jpg", alt: "Hêtre couché sur la rive" },
      { phase: "pendant", src: "/realisations/abattage-hetre/03.jpg", alt: "Tronc débité en tronçons" },
      { phase: "apres", src: "/realisations/abattage-hetre/04.jpg", alt: "Souche et branches sur la berge" }
    ]
  },
  {
    slug: "abattage-tempete",
    category: "Abattage",
    title: "Intervention après tempête",
    summary: "Dégagement d'un arbre tombé près d'une habitation, avec le chargeur télescopique.",
    cover: "/realisations/abattage-tempete/01.jpg",
    photos: [
      { phase: "avant", src: "/realisations/abattage-tempete/01.jpg", alt: "Arbre tombé contre la maison" },
      { phase: "pendant", src: "/realisations/abattage-tempete/02.jpg", alt: "Arbre en cours de découpe" },
      { phase: "pendant", src: "/realisations/abattage-tempete/03.jpg", alt: "Tronc tombé sur la pelouse" },
      { phase: "apres", src: "/realisations/abattage-tempete/04.jpg", alt: "Chargeur télescopique dégageant le tronc" }
    ]
  },
  {
    slug: "nivellement-terrain",
    category: "Nivellement",
    title: "Nettoyage et nivellement de terrain",
    summary: "Terrain en friche dessouché, nettoyé puis nivelé.",
    cover: "/realisations/nivellement-terrain/01.jpg",
    photos: [
      { phase: "avant", src: "/realisations/nivellement-terrain/01.jpg", alt: "Terrain en friche avant travaux" },
      { phase: "pendant", src: "/realisations/nivellement-terrain/02.jpg", alt: "Dessouchage avec le chargeur" },
      { phase: "pendant", src: "/realisations/nivellement-terrain/03.jpg", alt: "Terrain dégagé" },
      { phase: "apres", src: "/realisations/nivellement-terrain/04.jpg", alt: "Terrain nivelé" }
    ]
  },
  {
    slug: "terrassement-piscine",
    category: "Terrassement",
    title: "Terrassement pour piscine, citerne…",
    summary: "Travaux de terrassement réalisés par Bois Loisirs.",
    cover: "/realisations/terrassement-piscine/01.jpg",
    photos: [
      { src: "/realisations/terrassement-piscine/01.jpg", alt: "Travaux de terrassement" }
    ]
  },
  {
    slug: "amenagement-terrasse",
    category: "Aménagement extérieur",
    title: "Aménagements extérieurs",
    summary: "Carport, dalle de béton, terrasse, palissades.",
    cover: "/realisations/amenagement-terrasse/01.jpg",
    photos: [
      { src: "/realisations/amenagement-terrasse/01.jpg", alt: "Aménagement extérieur" }
    ]
  }
];
