# Junior Heritier — Portfolio photographique

Portfolio éditorial responsive réalisé en HTML, CSS et JavaScript natifs. Les photos sont hébergées sur Cloudinary. La connexion Google affiche le nom, l’adresse e-mail et l’image du profil ; Apple et GitHub sont indiqués comme prochaines options.

## Lancer le site

Depuis le dossier du projet, démarre un serveur local :

```bash
python -m http.server 8000
```

Ouvre ensuite <http://localhost:8000>. La connexion Google ne fonctionne pas en ouvrant directement `index.html` avec `file://`.

## Connexion Google

Le projet utilise Google Identity Services et le client OAuth Web déjà présent dans `auth.js`. Dans Google Cloud Console → **API et services → Identifiants**, ajoute aux **Origines JavaScript autorisées** chacune des origines utilisées :

- `http://localhost:8000` et `http://127.0.0.1:8000` pour les tests locaux ;
- l’origine du site une fois déployé, par exemple `https://nom-utilisateur.github.io` pour GitHub Pages.

Une origine ne contient ni chemin de page ni barre oblique finale. Si l’écran de consentement est en mode test, ajoute aussi les comptes Google à autoriser dans la liste des utilisateurs test.

L’identifiant client OAuth est public et peut être inclus dans le code navigateur ; **ne publie jamais de client secret**. Apple et GitHub utilisent leurs propres fournisseurs et nécessitent chacun une configuration séparée ; les boutons restent désactivés tant qu’ils ne sont pas configurés.

### Limite de sécurité

Cette version statique est une démonstration de connexion et d’affichage de profil, pas un contrôle d’accès sécurisé. Le profil de session est conservé dans `sessionStorage`, modifiable par l’utilisateur, et les URL Cloudinary des photos sont publiques. La connexion n’empêche donc pas un visiteur d’accéder directement aux images. Pour protéger réellement du contenu, il faut un backend qui valide les jetons Google et délivre les images depuis un stockage privé. La connexion ne crée pas d’inscription à une newsletter.

## Cloudinary

Le cloud name `zodnyfht` et les identifiants publics sont configurés dans `script.js` :

| Photo | Public ID |
| --- | --- |
| Portrait en studio | `portfolio/portrait-duo` |
| Portrait avec casquette | `portfolio/portrait-regard` |
| Portrait en veston | `ortfolio/portrait-elegance` |
| Portrait urbain | `portfolio/portrait-urbain` |

Le dossier `ortfolio` (sans le premier `p`) est intentionnel : il correspond au Public ID de la photo tel qu’il apparaît dans son URL Cloudinary. Les photos ne sont pas stockées dans le dépôt.

Les URL Cloudinary appliquent `f_auto` et `q_auto` pour choisir le format et la qualité. Les transformations `w_...`, `c_fill`, `g_auto` et `ar_4:5` adaptent les vignettes. `srcset` et `sizes` laissent le navigateur choisir une largeur responsive ; `loading="lazy"` et `decoding="async"` diffèrent le chargement. La lightbox demande une version plus large avec `c_limit`.

## Personnaliser

- Modifie les titres, descriptions ou catégories des photos dans le tableau `photos` de `script.js`.
- Les filtres disponibles sont « Tout », « Portrait » et « Urbain ».
- Remplace `bonjour@exemple.com` et adapte le titre, le logo et les textes dans `index.html`.

## Déploiement

Le portfolio est statique et ne nécessite ni compilation ni backend pour être hébergé. Publie le dépôt avec GitHub Pages, Vercel ou un autre hébergeur statique. Ajoute l’origine publiée aux origines JavaScript autorisées du client OAuth Google, puis indique dans cette section le lien du dépôt et celui du site déployé.
