# Sonorisation — maquette « Platine de nuit » (v1)

Maquette du nouveau site de **Sonorisation**, DJ et animateur à Bruay-La-Buissière (62700).
Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages

| Face | Fichier | Contenu |
|---|---|---|
| A | `index.html` | Ouverture vinyle 3D (WebGL), le DJ, événements, pads d’ambiance, animations, galerie, zone 50 km, livre d’or, appel final |
| B | `prestations.html` | Disque qui s’ouvre, liste des événements, soirée type (égaliseur), playlist, matériel, animations, photos |
| C | `livre-d-or.html` | Emplacements d’avis réels, témoignage (simulé), photos et vidéos |
| D | `contact.html` | Table de mixage, devis en 6 pistes (simulé), horaires « joignable maintenant », zone |
| — | `mentions-legales.html` | Mentions, confidentialité, crédits |
| — | `404.html` | « Disque rayé » |

## À compléter avec le client

- Raison sociale, forme juridique, SIRET, adresse complète, e-mail, directeur de publication
- Lien de la page Facebook (le t-shirt indique « edwin sonorisation fardel ») et lien des avis Google
- Avis réels (aucun avis n’est inventé)
- Liste détaillée du matériel son et lumière
- Disponibilités du samedi et du dimanche
- Prénom « Edwin » à confirmer (tiré de l’adresse du site)
- Vidéos de prestations
- Déroulé de la soirée type (exemple à valider)
- Avant la mise en ligne réelle : retirer `<meta name="robots" content="noindex">` dans chaque page

## Images

- `assets/img/real/` : photos réelles reprises du site actuel, converties en WebP (plusieurs tailles)
- `assets/img/grok/` : emplacement des images Grok (G01 à G30, voir le document « Images à créer avec Grok »)
- En attendant, chaque emplacement affiche un visuel provisoire dessiné en code, marqué « Provisoire · Gxx »

## Effets

Vinyle WebGL qui se « scratche » au défilement (résolution adaptative, repli CSS sans WebGL), bras de lecture et crossfader de progression, transitions « balayage laser », pads d’ambiance qui changent la couleur et le tempo du site, compteurs façon afficheur BPM, carte radar des 50 km, égaliseur de la soirée type, devis qui presse un disque, onde au survol des photos, curseur vinyle, boutons magnétiques, cartes 3D.

Son démo : boucles originales synthétisées par le navigateur (Web Audio), uniquement après un clic.
Mode calme : bouton toujours visible, et activé automatiquement si « réduire les animations » est demandé par le système. Jamais plus de 3 flashs par seconde.

## Technique

- GSAP 3.15 + ScrollTrigger + SplitText (licence standard gratuite), Lenis 1.3.27 (MIT, compilé en module), OGL 1.0.11 (Unlicense) — tous hébergés dans `assets/js/vendor/`
- Polices Unbounded, Inter, JetBrains Mono (SIL OFL), sous-ensemble latin en WOFF2 dans `assets/fonts/`
- Communes et contours : IGN Admin Express / INSEE 2018 via france-geojson (`assets/data/`) — distances à vol d’oiseau, à actualiser avec l’API Géo en production
- `vercel.json` : `cleanUrls` activé
