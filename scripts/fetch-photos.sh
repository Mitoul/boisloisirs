#!/usr/bin/env bash
# À lancer EN LOCAL (le site d'origine doit être accessible) : bash scripts/fetch-photos.sh
# Télécharge les photos sources depuis boisloisirs.be vers public/realisations/<slug>/
# Les 404 sont ignorés ; ajustez la liste après avoir repéré les vrais noms dans la médiathèque WordPress
# (https://www.boisloisirs.be/wp-admin/upload.php) ou via "Enregistrer l'image sous".
set -u
B="https://www.boisloisirs.be/wp-content/uploads/2025/08"
get() { mkdir -p "public/realisations/$1"; curl -fsSL "$B/$2" -o "public/realisations/$1/$3" && echo "OK  $3" || echo "404 $2"; }
get terrassement-piscine terrassement-avant.jpg avant-1.jpg
get amenagement-terrasse amenagement-avant.jpg avant-1.jpg
get nivellement-terrain  nivellement-page.jpg   apres-1.jpg
get abattage             abattage-page.jpg      pendant-1.jpg
