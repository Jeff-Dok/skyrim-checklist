# Scripts Python — Skyrim Checklist

> Documentation d'utilisation de tous les scripts du dossier `Scripts_Python/`.

---

## Installation des dépendances

Tous les scripts nécessitent Python 3.10+.
Installe les bibliothèques une seule fois :

```bash
pip install requests beautifulsoup4 Pillow anthropic
```

Pour `analyze_image.py` et `batch_analyze.py`, tu as besoin d'une **clé API Anthropic** :

```bash
# Windows (PowerShell)
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Windows (cmd)
set ANTHROPIC_API_KEY=sk-ant-...
```

---

## Vue d'ensemble des scripts

| Script | Rôle | Dépendances |
|---|---|---|
| `download_url.py` | Télécharge le contenu complet d'une URL (profondeur configurable) | `requests`, `beautifulsoup4` |
| `download_uesp_images.py` | Télécharge des icônes depuis le wiki UESP | `requests`, `beautifulsoup4` |
| `process_ingredient_images.py` | Convertit PNG/JPG → WebP 64px optimisé | `Pillow` |
| `analyze_image.py` | Analyse une image via Claude Vision | `anthropic` + API key |
| `batch_analyze.py` | Analyse un dossier entier d'images via Claude | `anthropic` + API key |
| `build_sections.py` | Fusionne des pages du guide PDF Skyrim | `poppler` (pdfunite) |

---

## 1. `download_url.py`

### Rôle
Télécharge le contenu complet d'une URL : pages HTML, images, fichiers liés.
Suit les liens jusqu'à une profondeur configurable (défaut : 2 niveaux).

Fonctionne avec **n'importe quelle source** :
- Pages web normales (UESP wiki, sites de documentation, etc.)
- Index de répertoires (Apache/Nginx style)
- Repos GitHub (utilise l'API GitHub automatiquement)
- URLs directes vers des fichiers

### Destination
Dossier **Téléchargements** du système (`C:\Users\{toi}\Downloads`), organisé par domaine.
Ex : `Downloads/en.uesp.net/wiki/Skyrim:Alchemy/index.html`

### Usage

```bash
# Télécharger une page UESP et tout ce qui est lié (profondeur 2 par défaut)
python download_url.py https://en.uesp.net/wiki/Skyrim:Alchemy

# Télécharger un repo GitHub
python download_url.py https://github.com/user/repo

# Profondeur 0 = juste cette page, rien d'autre
python download_url.py https://site.com/page --depth 0

# Profondeur 1 = page + liens directs seulement
python download_url.py https://site.com/page --depth 1

# Sauvegarder dans un dossier personnalisé
python download_url.py https://site.com --dest MonDossier/Skyrim

# Sans sauvegarder les pages HTML (seulement les images, PDF, etc.)
python download_url.py https://site.com --no-html

# Suivre les liens vers d'autres domaines (attention : peut télécharger beaucoup)
python download_url.py https://site.com --any-domain

# Réduire le délai entre requêtes (plus rapide, moins poli)
python download_url.py https://site.com --delay 0.1
```

### Options
| Option | Défaut | Description |
|---|---|---|
| `url` | *(requis)* | URL à télécharger |
| `--depth` | `2` | Profondeur de récursion (0 = page seule) |
| `--dest` | `~/Downloads/` | Dossier de destination |
| `--no-html` | (sauvegarde HTML) | Ne télécharge que les assets (images, pdf…) |
| `--any-domain` | (même domaine) | Suit aussi les liens vers d'autres domaines |
| `--delay` | `0.3` | Délai en secondes entre chaque requête |

### Comprendre la profondeur

```
Profondeur 0 : juste l'URL donnée
Profondeur 1 : URL + tous les liens trouvés sur cette page
Profondeur 2 : URL + liens de la page + liens des pages liées  ← défaut
```

### Cas spécial : GitHub
Quand tu donnes une URL GitHub, le script utilise automatiquement
l'**API GitHub** (pas de scraping HTML) pour lister et télécharger les fichiers.

```bash
# Repo entier
python download_url.py https://github.com/user/mon-repo

# Sous-dossier spécifique
python download_url.py https://github.com/user/repo/tree/main/src/components
```

### Cas spécial : Index de répertoire
Si l'URL pointe vers un listing de fichiers (ex: serveur Apache), le script
le détecte automatiquement et télécharge tous les fichiers listés.

```bash
python download_url.py https://site.com/files/
```

### Reprendre un téléchargement interrompu
Si le script est interrompu (Ctrl+C, erreur réseau...), relance simplement
la même commande. Les fichiers déjà présents seront ignorés (`[skip]`).

```bash
# Même commande → reprend là où ça s'est arrêté
python download_url.py https://en.uesp.net/wiki/Skyrim:Alchemy
```

---

## 3. `download_uesp_images.py`

### Rôle
Télécharge en masse les images du wiki UESP (uesp.net).
Cible les icônes Skyrim dont le nom commence par `SR-icon-` ou `SR-item-`.

### Destination
`UESP/Pictures/` à la racine du projet (créé automatiquement).

### Usage

```bash
# Télécharger TOUT (SR-icon- + SR-item-)
python download_uesp_images.py

# Télécharger seulement les SR-icon-
python download_uesp_images.py --prefix SR-icon-

# Télécharger vers un dossier personnalisé
python download_uesp_images.py --dest assets/images/ingredients

# Combiner
python download_uesp_images.py --prefix SR-ingr- --dest UESP/Ingredients
```

### Options
| Option | Défaut | Description |
|---|---|---|
| `--prefix` | (les deux) | Préfixe des images à cibler |
| `--dest` | `UESP/Pictures/` | Dossier de destination |

### Résultat
Les images sont sauvegardées avec leur nom original UESP (ex: `SR-icon-spell-Fire.png`).
Utilise `process_ingredient_images.py` ensuite pour les renommer et convertir.

---

## 4. `process_ingredient_images.py`

### Rôle
Convertit des images PNG/JPG/WEBP en **WebP 64×64 px** optimisé.

Règle de nommage :
- `SR-ingr-Abecean_Longfin.png` → **`Abecean_Longfin.webp`**
- `Garlic.jpg` → **`Garlic.webp`** (pas de `-` → garde le nom complet)

La partie **après le dernier `-`** devient le nom du fichier de sortie.

### Dossiers par défaut
- **Source** : `lookAt/` à la racine du projet
- **Destination** : `UESP/webp/` à la racine du projet

### Usage

```bash
# Traiter lookAt/ → UESP/webp/ (défaut)
python process_ingredient_images.py

# Source et destination personnalisées
python process_ingredient_images.py --src UESP/Pictures --dest assets/images/ingredients

# Taille personnalisée (128px au lieu de 64px)
python process_ingredient_images.py --size 128

# Sans rogner au carré (resize simple)
python process_ingredient_images.py --no-crop

# Écraser les fichiers existants
python process_ingredient_images.py --overwrite
```

### Options
| Option | Défaut | Description |
|---|---|---|
| `--src` | `lookAt/` | Dossier source |
| `--dest` | `UESP/webp/` | Dossier de destination |
| `--size` | `64` | Taille en pixels (carré) |
| `--no-crop` | (rogne par défaut) | Resize sans rogner |
| `--overwrite` | (skip si existe) | Écraser les fichiers existants |

### Workflow typique avec download_uesp_images.py

```bash
# 1. Télécharger les icônes depuis UESP
python download_uesp_images.py --prefix SR-ingr- --dest lookAt

# 2. Convertir en WebP 64px
python process_ingredient_images.py --src lookAt --dest assets/images/ingredients
```

---

## 5. `analyze_image.py`

### Rôle
Envoie **une seule image** à Claude Vision (API Anthropic) et sauvegarde la réponse
dans un fichier `.txt`.

Utile pour :
- Identifier le nom exact d'un item depuis une icône
- Obtenir une description détaillée d'une image de Skyrim
- Extraire du texte ou des données d'une capture d'écran

### Prérequis
Variable d'environnement `ANTHROPIC_API_KEY` définie.

### Usage

```bash
# Analyse basique (prompt par défaut = identification Skyrim)
python analyze_image.py lookAt/SR-ingr-Garlic.png

# Avec un prompt personnalisé
python analyze_image.py icone.png --prompt "Quel sort est représenté sur cette icône?"

# Sauvegarder dans un fichier spécifique
python analyze_image.py icone.png --out resultats/garlic.txt

# Afficher aussi dans le terminal
python analyze_image.py icone.png --print

# Utiliser un modèle différent
python analyze_image.py icone.png --model claude-opus-4-6
```

### Options
| Option | Défaut | Description |
|---|---|---|
| `image` | *(requis)* | Chemin vers l'image |
| `--prompt` | Identification Skyrim | Prompt envoyé à Claude |
| `--out` | `{image}.txt` | Fichier de sortie |
| `--model` | `claude-sonnet-4-6` | Modèle Claude à utiliser |
| `--print` | (silencieux) | Affiche le résultat dans le terminal |

### Formats supportés
PNG, JPG, JPEG, WEBP, GIF

### Exemple de sortie (`icone.txt`)
```
Image  : lookAt/SR-ingr-Garlic.png
Prompt : Identifie cet ingrédient Skyrim...
Modèle : claude-sonnet-4-6
------------------------------------------------------------
This is a Garlic icon from The Elder Scrolls V: Skyrim.
In-game name: Garlic
It is an alchemy ingredient used to brew potions.
```

---

## 6. `batch_analyze.py`

### Rôle
Lance l'analyse Claude Vision sur **TOUS** les PNG/JPG/WEBP d'un dossier.
Génère un fichier `.txt` par image + un rapport Markdown récapitulatif.

### Prérequis
Variable d'environnement `ANTHROPIC_API_KEY` définie.

### Usage

```bash
# Analyser lookAt/ (défaut)
python batch_analyze.py

# Analyser un autre dossier
python batch_analyze.py --src UESP/Pictures

# Prompt rapide — juste le nom
python batch_analyze.py --prompt "Donne uniquement le nom anglais exact de cet item Skyrim, un seul mot ou expression."

# Ignorer les images déjà analysées (utile pour reprendre après interruption)
python batch_analyze.py --skip-existing

# Sauvegarder le rapport ailleurs
python batch_analyze.py --report resultats/rapport_alchemy.md
```

### Options
| Option | Défaut | Description |
|---|---|---|
| `--src` | `lookAt/` | Dossier source |
| `--prompt` | Identification Skyrim | Prompt envoyé pour chaque image |
| `--model` | `claude-sonnet-4-6` | Modèle Claude |
| `--skip-existing` | (analyse tout) | Ignore si `.txt` existe déjà |
| `--report` | `{src}/rapport.md` | Chemin du rapport final |

### Sortie
- **Un `.txt` par image** dans le même dossier que l'image
- **`rapport.md`** : tableau récapitulatif avec résultats et statuts

### Exemple de rapport
```markdown
# Rapport d'analyse — lookAt/

| Fichier | Résultat | Statut |
|---|---|---|
| `SR-ingr-Garlic.png` | Garlic | ✅ |
| `SR-ingr-Wheat.png` | Wheat | ✅ |
| `SR-ingr-Unknown.png` | RATE_LIMIT | ❌ |
```

### Reprendre après interruption
Si le script est interrompu (erreur réseau, rate limit, etc.) :
```bash
# --skip-existing repart là où tu en étais
python batch_analyze.py --skip-existing
```

---

## 7. `build_sections.py`

### Rôle
Fusionne des pages individuelles du **Skyrim_Guide.pdf** en un PDF thématique.
Le guide a été pré-découpé page par page dans `Guide/page_N.pdf`.

### Prérequis
`pdfunite` de Poppler doit être installé. Le chemin est codé en dur dans le script :
```python
POPPLER = r"C:\Users\jnfra\AppData\Local\...\poppler-25.07.0\Library\bin\pdfunite.exe"
```
Si tu réinstalles Poppler, mets à jour ce chemin dans le fichier.

### Usage

```bash
# Fusionner les pages 148 à 151 → Sections/Potions.pdf
python build_sections.py Potions 148 151

# Page unique
python build_sections.py Alchemy 148

# Nom avec espaces (utilise des guillemets)
python build_sections.py "Dragon Shouts" 100 115
```

### Arguments
| Argument | Requis | Description |
|---|---|---|
| `nom` | Oui | Nom du fichier de sortie (sans extension) |
| `page_debut` | Oui | Numéro de page de début dans le guide |
| `page_fin` | Non | Numéro de page de fin (défaut = page_debut) |

### Sortie
Les PDFs fusionnés sont sauvegardés dans `skyrim_project/Sections/`.

### Sections utiles (pages du guide Prima)
| Section | Pages |
|---|---|
| Alchemy | 148–151 |
| *(ajoute tes propres références ici)* | |

---

## Workflow complet — Ajouter des icônes d'ingrédients

```bash
# Étape 1 : Télécharger depuis UESP
python download_uesp_images.py --prefix SR-ingr- --dest lookAt

# Étape 2 : Identifier les items avec Claude (optionnel)
python batch_analyze.py --src lookAt --prompt "Donne le nom exact en anglais de cet ingrédient Skyrim."

# Étape 3 : Convertir en WebP 64px
python process_ingredient_images.py --src lookAt --dest ../assets/images/ingredients

# Étape 4 : Les icônes sont prêtes dans assets/images/ingredients/
```

---

## Dépannage

### `ModuleNotFoundError: No module named 'anthropic'`
```bash
pip install anthropic
```

### `ModuleNotFoundError: No module named 'PIL'`
```bash
pip install Pillow
```

### `ANTHROPIC_API_KEY manquante`
```bash
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-ton-api-key-ici"

# Pour le rendre permanent : l'ajouter dans les variables d'environnement système Windows
```

### `RateLimitError` dans batch_analyze.py
Le script attend automatiquement 10 secondes et reprend.
Si ça arrive souvent, relance avec `--skip-existing` pour ne traiter que les images restantes.

### `pdfunite.exe` introuvable (build_sections.py)
Réinstalle Poppler et mets à jour la variable `POPPLER` dans le script avec le bon chemin.
