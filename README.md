# Sonorisation — maquette « Platine de nuit » (v3)

Maquette du nouveau site de **Sonorisation**, DJ et animateur à Bruay-La-Buissière (62700).
Site statique (HTML, CSS, JavaScript), sans étape de construction, prêt pour Vercel.

## Pages

| Face | Fichier | Contenu |
|---|---|---|
| A | `index.html` | Ouverture vinyle 3D (WebGL), le DJ, événements (liens devis préremplis), pads d’ambiance, animations, galerie, zone 50 km, appel final |
| B | `prestations.html` | Disque qui s’ouvre, liste des événements, soirée type (égaliseur), styles musicaux, matériel, comment ça se passe, questions fréquentes |
| C | `livre-d-or.html` | Avis (état vide honnête), témoignage (simulé), photos et emplacement vidéo |
| D | `contact.html` | Devis en 6 étapes (simulé, erreurs sous les champs), horaires « joignable maintenant », numéro à copier |
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
- Déroulé de la soirée type et étapes « Comment ça se passe » (exemples à valider)
- Réponses de la FAQ marquées « à compléter » : tarifs indicatifs, délai de réservation conseillé
- Avant la mise en ligne réelle : retirer `<meta name="robots" content="noindex">` dans chaque page et l’en-tête `X-Robots-Tag` de `vercel.json`

## Images

- `assets/img/real/` : photos réelles reprises du site actuel, converties en WebP (plusieurs tailles)
- `assets/img/grok/` : images d’ambiance générées avec Grok (G01 à G30), en WebP 2 tailles ; celles qui montrent une scène de fête portent la mention « Illustration »
- G01/G02 servent de fond au vinyle WebGL, G29 de texture de brume dans le shader
- Les visuels dessinés en code (`assets/js/core/placeholders.js`) restent disponibles pour tout futur emplacement sans image

## Effets

Vinyle WebGL qui se « scratche » au défilement (résolution adaptative, repli CSS sans WebGL), bras de lecture et crossfader de progression, transitions « balayage laser », pads d’ambiance qui changent la couleur et le tempo de la page (les boutons d’action restent verts), compteurs façon afficheur BPM, carte radar des 50 km, égaliseur de la soirée type, bac de styles à feuilleter, onde au survol des photos, curseur vinyle, boutons magnétiques, cartes 3D.

Son démo : boucles originales synthétisées par le navigateur (Web Audio), uniquement après un clic.
Mode calme : bouton toujours visible, et activé automatiquement si « réduire les animations » est demandé par le système. Jamais plus de 3 flashs par seconde.

## Technique

- GSAP 3.15 + ScrollTrigger + SplitText (licence standard gratuite), Lenis 1.3.27 (MIT, compilé en module), OGL 1.0.11 (Unlicense) — tous hébergés dans `assets/js/vendor/`
- Polices Unbounded, Inter, JetBrains Mono (SIL OFL), sous-ensemble latin en WOFF2 dans `assets/fonts/`
- Communes et contours : IGN Admin Express / INSEE 2018 via france-geojson (`assets/data/`) — distances à vol d’oiseau, à actualiser avec l’API Géo en production
- `vercel.json` : `cleanUrls` activé

## Nouveautés v3 (audit complet)

- Téléphone : l’ouverture ne passe plus sous l’en-tête, le disque se range au-dessus du texte, barre du bas « Devis + Appeler » toujours à portée de pouce (Son et Calme en icônes)
- Titres recalibrés pour tenir à 320 px, accents des capitales plus coupés
- Devis : erreurs affichées sous chaque champ, liste des communes au-dessus des boutons, confirmation amenée à l’écran
- Moins de répétitions (photos, sections), un seul traitement colorimétrique pour les photos réelles
- Prestations : « Comment ça se passe » et questions fréquentes à la place des doublons
- Ouverture raccourcie (≈ 1,2 s), transitions plus rapides, zones tactiles d’au moins 44 px, survols réservés à la souris
