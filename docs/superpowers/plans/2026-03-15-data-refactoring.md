# Data Refactoring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Séparer `data.js` et `data_fr.js` en fichiers par catégorie, et fusionner les traductions FR directement dans chaque item (`name_fr`, `desc_fr`, `word_fr`).

**Architecture:** Un script Python génère les 6 fichiers de données mergés (`script/data/*.js`), un loader `index.js` assemble `CHECKLIST_DATA`, et `app.js` est mis à jour pour lire `item.name_fr` au lieu de `DATA_FR_NAMES[id]`.

**Tech Stack:** Vanilla JS (no build system), Python 3 (script de migration), navigateur pour vérification.

**Spec:** `docs/superpowers/specs/2026-03-15-data-refactoring-design.md`

---

## Chunk 1 : Script de migration + génération des fichiers de données

### Task 1 : Créer le script Python de migration

**Files:**
- Create: `Scripts_Python/merge_data.py`

- [ ] **Step 1.1 : Créer `Scripts_Python/merge_data.py`**

```python
#!/usr/bin/env python3
"""
merge_data.py — Fusionne data.js et data_fr.js en fichiers par catégorie.

Usage : python Scripts_Python/merge_data.py
Output : script/data/quests.js, shouts.js, spells.js, enchanting.js, alchemy.js,
         achievements.js, index.js
"""

import json, re, os, ast
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_JS   = ROOT / 'script' / 'data.js'
DATA_FR   = ROOT / 'script' / 'data_fr.js'
OUT_DIR   = ROOT / 'script' / 'data'

# ── Helpers ─────────────────────────────────────────────────────────────────

def extract_js_object(src: str, var_name: str) -> str:
    """Extrait le corps d'une déclaration `const VAR = { ... };` ou `{ ... }` sur plusieurs lignes."""
    pattern = rf'const\s+{re.escape(var_name)}\s*=\s*(\{{[\s\S]*?\}});'
    m = re.search(pattern, src)
    if not m:
        raise ValueError(f"Variable '{var_name}' non trouvée dans le fichier source.")
    return m.group(1)


def parse_fr_dict(src: str, var_name: str) -> dict:
    """
    Parse un objet JS { key: 'value', ... } (clés entières, valeurs chaînes) → dict Python.
    Utilise ast.literal_eval après normalisation (guillemets simples → doubles).
    """
    body = extract_js_object(src, var_name)
    # Remplacer les guillemets simples JS par guillemets doubles Python-safe
    # On gère les apostrophes échappées (\') → placeholder puis retour
    body = body.replace("\\'", "__APOS__")
    # Clés entières sans guillemets : 1: → "1": (ancré au début de ligne pour éviter de corrompre les valeurs)
    body = re.sub(r'(?m)^\s*(\d+)\s*:', lambda m: m.group(0).replace(m.group(1), f'"{m.group(1)}"', 1), body)
    # Guillemets simples → doubles (valeurs)
    body = re.sub(r"'(.*?)'", lambda m: '"' + m.group(1).replace('"', '\\"') + '"', body, flags=re.DOTALL)
    body = body.replace("__APOS__", "'")
    # Virgules trailing
    body = re.sub(r',\s*\}', '}', body)
    body = re.sub(r',\s*\]', ']', body)
    try:
        raw = json.loads(body)
    except json.JSONDecodeError as e:
        raise ValueError(f"Échec JSON pour '{var_name}': {e}\n{body[:300]}")
    return {int(k): v for k, v in raw.items()}


def parse_checklist_data(src: str) -> dict:
    """Parse CHECKLIST_DATA depuis data.js — format JSON valide après strip du préfixe."""
    m = re.search(r'const\s+CHECKLIST_DATA\s*=\s*(\{[\s\S]*\n\})\s*;', src)
    if not m:
        raise ValueError("CHECKLIST_DATA non trouvé dans data.js")
    body = m.group(1)
    # Supprimer les commentaires JS (// ...)
    body = re.sub(r'//[^\n]*', '', body)
    # Trailing commas
    body = re.sub(r',(\s*[\}\]])', r'\1', body)
    return json.loads(body)


def merge_item(item: dict, names_fr: dict, words_fr: dict, desc_fr: dict) -> dict:
    """Ajoute name_fr / word_fr / desc_fr sur un item si disponible."""
    out = dict(item)
    iid = item['id']
    if iid in names_fr:
        out['name_fr'] = names_fr[iid]
    if iid in words_fr:
        out['word_fr'] = words_fr[iid]
    if iid in desc_fr:
        out['desc_fr'] = desc_fr[iid]
    return out


def items_to_js(var_name: str, items: list) -> str:
    """Sérialise une liste d'items en déclaration JS `const VAR = [...]`."""
    lines = [f'const {var_name} = [']
    for item in items:
        lines.append('  ' + json.dumps(item, ensure_ascii=False) + ',')
    lines.append('];')
    return '\n'.join(lines) + '\n'


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    src_en = DATA_JS.read_text(encoding='utf-8')
    src_fr = DATA_FR.read_text(encoding='utf-8')

    print("Parsing data.js...")
    checklist = parse_checklist_data(src_en)

    print("Parsing data_fr.js...")
    names_fr = parse_fr_dict(src_fr, 'DATA_FR_NAMES')
    words_fr = parse_fr_dict(src_fr, 'DATA_FR_WORDS')
    desc_fr  = parse_fr_dict(src_fr, 'DATA_FR_DESC')

    print(f"  DATA_FR_NAMES : {len(names_fr)} entrées")
    print(f"  DATA_FR_WORDS : {len(words_fr)} entrées")
    print(f"  DATA_FR_DESC  : {len(desc_fr)} entrées")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Mapping : clé CHECKLIST_DATA → (nom_var, nom_fichier)
    categories = [
        ('Quests',        'QUESTS_DATA',        'quests'),
        ('Dragon Shouts', 'SHOUTS_DATA',         'shouts'),
        ('Spells',        'SPELLS_DATA',          'spells'),
        ('Enchanting',    'ENCHANTING_DATA',      'enchanting'),
        ('Alchemy',       'ALCHEMY_DATA',         'alchemy'),
        ('Achievements',  'ACHIEVEMENTS_DATA',    'achievements'),
    ]

    totals = {}
    for cat_key, var_name, file_stem in categories:
        items = checklist.get(cat_key, [])
        merged = [merge_item(i, names_fr, words_fr, desc_fr) for i in items]
        out_path = OUT_DIR / f'{file_stem}.js'
        out_path.write_text(items_to_js(var_name, merged), encoding='utf-8')
        totals[cat_key] = len(merged)
        print(f"  ✓ {out_path.name} — {len(merged)} items")

    # Loader index.js
    index_lines = ['const CHECKLIST_DATA = {']
    for cat_key, var_name, _ in categories:
        index_lines.append(f'  "{cat_key}": {var_name},')
    index_lines += [
        '  "Books":      [],',
        '  "Perks":      [],',
        '  "Collectible":[],',
        '};',
    ]
    (OUT_DIR / 'index.js').write_text('\n'.join(index_lines) + '\n', encoding='utf-8')
    print(f"  ✓ index.js")

    # Vérification
    print("\nVérification des totaux :")
    for cat_key, var_name, _ in categories:
        orig = len(checklist.get(cat_key, []))
        gen  = totals[cat_key]
        status = "✓" if orig == gen else "✗ MISMATCH"
        print(f"  {status} {cat_key}: {orig} → {gen}")

    print("\nMigration terminée.")

if __name__ == '__main__':
    main()
```

- [ ] **Step 1.2 : Vérifier que Python 3 est disponible**

```bash
python --version
```
Attendu : `Python 3.x.x`

---

### Task 2 : Exécuter le script de migration

**Files:**
- Create: `script/data/quests.js`, `script/data/shouts.js`, `script/data/spells.js`, `script/data/enchanting.js`, `script/data/alchemy.js`, `script/data/achievements.js`, `script/data/index.js`

- [ ] **Step 2.1 : Exécuter le script**

```bash
cd "C:/Users/jnfra/OneDrive/Documents/Web_Projet/skyrim_project"
python Scripts_Python/merge_data.py
```

Attendu (exemple) :
```
Parsing data.js...
Parsing data_fr.js...
  DATA_FR_NAMES : xxx entrées
  DATA_FR_WORDS : 81 entrées
  DATA_FR_DESC  : xxx entrées
  ✓ quests.js — 657 items
  ✓ shouts.js — 81 items
  ✓ spells.js — 170 items
  ✓ enchanting.js — 53 items
  ✓ alchemy.js — 474 items
  ✓ achievements.js — 76 items
  ✓ index.js
Vérification des totaux :
  ✓ Quests: 657 → 657
  ✓ Dragon Shouts: 81 → 81
  ✓ Spells: 170 → 170
  ✓ Enchanting: 53 → 53
  ✓ Alchemy: 474 → 474
  ✓ Achievements: 76 → 76
Migration terminée.
```

Si un "✗ MISMATCH" apparaît : **STOP** — diagnostiquer le parsing avant de continuer.

- [ ] **Step 2.2 : Vérifier que les fichiers existent**

```bash
ls script/data/
```
Attendu : `achievements.js  alchemy.js  enchanting.js  index.js  quests.js  shouts.js  spells.js`

- [ ] **Step 2.3 : Spot-check manuel — quests.js**

Lire les 5 premières lignes de `script/data/quests.js` et vérifier :
- Item ID 1 a `"name":"Unbound"` et `"name_fr":"Libération"` et `"desc_fr"` non vide
- Item ID 1 n'a PAS de `"word_fr"` (les shouts seulement)

- [ ] **Step 2.4 : Spot-check manuel — shouts.js**

Lire les premières lignes de `script/data/shouts.js` et vérifier :
- Item ID 658 a `"name":"Fus"` (inchangé), `"word_en":"Force"`, `"word_fr":"..."` (sens FR du mot)
- Item ID 658 n'a PAS de `"name_fr"` (noms propres, pas traduits)

- [ ] **Step 2.5 : Spot-check manuel — alchemy.js**

Lire quelques lignes pour vérifier :
- Item ID 962 (premier ingrédient) : a `"name_fr"` et `"desc_fr"`
- Item ID 1145 (première potion) : a `"desc_fr"`, mais PAS de `"name_fr"` (potions non traduites)

- [ ] **Step 2.6 : Commit — données générées**

```bash
git add script/data/
git add Scripts_Python/merge_data.py
git commit -m "feat: sépare les données en fichiers par catégorie avec EN/FR fusionnés"
```

---

## Chunk 2 : Mise à jour de skyrim.html et app.js

### Task 3 : Mettre à jour skyrim.html

**Files:**
- Modify: `skyrim.html`

- [ ] **Step 3.1 : Lire les lignes 170–180 de `skyrim.html`** pour identifier les balises script actuelles.

- [ ] **Step 3.2 : Remplacer les deux lignes `<script src="script/data*.js" defer>`**

Trouver :
```html
    <script src="script/data.js" defer></script>
    <script src="script/data_fr.js" defer></script>
```

Remplacer par :
```html
    <script src="script/data/quests.js" defer></script>
    <script src="script/data/shouts.js" defer></script>
    <script src="script/data/spells.js" defer></script>
    <script src="script/data/enchanting.js" defer></script>
    <script src="script/data/alchemy.js" defer></script>
    <script src="script/data/achievements.js" defer></script>
    <script src="script/data/index.js" defer></script>
```

Note : `index.html` ne charge aucun script de données — ne pas le modifier.

---

### Task 4 : Mettre à jour app.js — remplacer les 7 sites DATA_FR_*

**Files:**
- Modify: `script/app.js`

Les 7 sites à modifier (dans l'ordre d'apparition) :

#### Site 1 — Ligne ~452 : fonction `itemName()`

- [ ] **Step 4.1 : Remplacer le lookup dans `itemName()`**

Trouver :
```js
function itemName(item) {
  if (typeof getLang === 'function' && getLang() === 'fr') {
    const fr = typeof DATA_FR_NAMES !== 'undefined' && DATA_FR_NAMES[item.id];
    if (fr) return fr;
  }
  return item.name;
}
```

Remplacer par :
```js
function itemName(item) {
  if (typeof getLang === 'function' && getLang() === 'fr' && item.name_fr) {
    return item.name_fr;
  }
  return item.name;
}
```

#### Sites 2 & 3 — Ligne ~694–696 : `renderAchievementRow()`

- [ ] **Step 4.2 : Remplacer les deux lookups dans `renderAchievementRow()`**

Trouver :
```js
  const nameFr  = getLang() === 'fr' && typeof DATA_FR_NAMES !== 'undefined' && DATA_FR_NAMES[item.id];
  const dispName = nameFr || item.name;
  const descFr  = getLang() === 'fr' && typeof DATA_FR_DESC !== 'undefined' && DATA_FR_DESC[item.id];
  const dispDesc = descFr || item.desc || '';
```

Remplacer par :
```js
  const dispName = (getLang() === 'fr' && item.name_fr) || item.name;
  const dispDesc = (getLang() === 'fr' && item.desc_fr) || item.desc || '';
```

#### Site 4 — Ligne ~978 : rendu des Dragon Shouts (accès direct sans guard)

- [ ] **Step 4.3 : Remplacer `DATA_FR_WORDS` dans le rendu des shouts**

Trouver (ligne ~978) :
```js
            <span class="item-sub"><span class="word-en">${escHtml(getLang() === 'fr' ? (DATA_FR_WORDS[item.id] || item.word_en || '') : (item.word_en || ''))}</span></span>
```

Remplacer par :
```js
            <span class="item-sub"><span class="word-en">${escHtml(getLang() === 'fr' ? (item.word_fr || item.word_en || '') : (item.word_en || ''))}</span></span>
```

#### Site 5 — Ligne ~1282 : `buildSub()`

- [ ] **Step 4.4 : Remplacer le lookup dans `buildSub()`**

Trouver :
```js
  const _desc = (getLang() === 'fr' && typeof DATA_FR_DESC !== 'undefined' && DATA_FR_DESC[item.id]) || item.desc;
```

Remplacer par :
```js
  const _desc = (getLang() === 'fr' && item.desc_fr) || item.desc;
```

#### Site 6 — Ligne ~1348 : modal Potions/Poisons

- [ ] **Step 4.5 : Remplacer le lookup dans la modal potion**

Trouver :
```js
    const _potionDesc = (getLang() === 'fr' && typeof DATA_FR_DESC !== 'undefined' && DATA_FR_DESC[item.id]) || item.desc;
```

Remplacer par :
```js
    const _potionDesc = (getLang() === 'fr' && item.desc_fr) || item.desc;
```

#### Site 7 — Ligne ~1370 : modal générale

- [ ] **Step 4.6 : Remplacer le lookup dans la modal générale**

Trouver :
```js
    const descFr = getLang() === 'fr' && typeof DATA_FR_DESC !== 'undefined' && DATA_FR_DESC[item.id];
    if (descFr || item.desc) rows.push(makeInfoRow(t('modalDesc'), descFr || item.desc));
```

Remplacer par :
```js
    const descFr = getLang() === 'fr' && item.desc_fr;
    if (descFr || item.desc) rows.push(makeInfoRow(t('modalDesc'), descFr || item.desc));
```

- [ ] **Step 4.7 : Mettre à jour le commentaire de la fonction `itemName()` dans app.js**

Trouver :
```js
 * Utilise DATA_FR_NAMES (data_fr.js) si la langue est FR et qu'une traduction existe.
```

Remplacer par :
```js
 * Utilise item.name_fr si la langue est FR et que la traduction est disponible.
```

- [ ] **Step 4.8 : Vérifier qu'aucune référence à DATA_FR_NAMES / DATA_FR_DESC / DATA_FR_WORDS ne subsiste dans app.js**

```bash
grep -n "DATA_FR_NAMES\|DATA_FR_DESC\|DATA_FR_WORDS" script/app.js
```

Attendu : **aucune sortie** (0 résultats).

- [ ] **Step 4.9 : Commit — app.js et skyrim.html mis à jour**

```bash
git add script/app.js skyrim.html
git commit -m "refactor: remplace lookups DATA_FR_* par item.name_fr / item.desc_fr / item.word_fr"
```

---

## Chunk 3 : Vérification et nettoyage

### Task 5 : Vérifier l'application dans le navigateur

- [ ] **Step 5.1 : Créer un profil de test et ouvrir skyrim.html avec Playwright**

1. Naviguer vers `file:///C:/Users/jnfra/OneDrive/Documents/Web_Projet/skyrim_project/index.html`
2. Créer un profil nommé "Test" : remplir le champ de nom, cliquer sur le bouton de création
3. Vérifier la redirection automatique vers `skyrim.html`
4. Si pas de redirection : cliquer sur le profil "Test" pour l'activer

- [ ] **Step 5.2 : Vérifier la console pour erreurs JavaScript**

Utiliser `browser_console_messages` de Playwright. Attendu : **aucune erreur** (ni `ReferenceError`, ni `TypeError`).

- [ ] **Step 5.3 : Vérifier que les données s'affichent en anglais (mode EN)**

- Les onglets sont visibles
- Les items de "Quests" ont des noms anglais
- Le badge de progression affiche des chiffres cohérents (657 items pour Quests)

- [ ] **Step 5.4 : Basculer en français et vérifier les traductions**

Cliquer sur le bouton de langue (FR/EN).

Vérifier :
- Un item de "Quests" affiche son `name_fr` (ex: "Unbound" → "Libération")
- L'onglet Dragon Shouts : les significations des mots sont en français
- Les achievements affichent leur `name_fr`

- [ ] **Step 5.5 : Ouvrir la modale d'info d'une quête et vérifier `desc_fr`**

Cliquer sur le bouton ⓘ d'une quête, vérifier que la description est en français.

- [ ] **Step 5.6 : Vérifier qu'une potion/poison s'affiche correctement**

Aller dans l'onglet Alchemy → Potions, vérifier qu'un item s'affiche (avec image ou fallback).

---

### Task 6 : Supprimer les anciens fichiers

> **Effectuer uniquement si toutes les vérifications du Task 5 sont passées.**

- [ ] **Step 6.1 : Supprimer `script/data.js` et `script/data_fr.js`**

```bash
rm script/data.js
rm script/data_fr.js
```

- [ ] **Step 6.2 : Vérifier que les catégories placeholder vides de data.js ne sont pas dans CATEGORY_META**

```bash
grep -n "Locations\|Unique Gear\|Recruitable" script/app.js
```

Attendu : 0 résultats dans `CATEGORY_META` (ces clés étaient dans data.js mais non affichées — elles peuvent être ignorées).

- [ ] **Step 6.3 : Vérifier qu'aucune autre référence à ces fichiers ne subsiste**

```bash
grep -rn "data\.js\|data_fr\.js" --include="*.html" --include="*.js" .
```

Attendu : 0 résultats (ou seulement dans des commentaires ou docs).

- [ ] **Step 6.4 : Recharger l'app et vérifier — aucune erreur console**

Même vérification qu'en 5.2 après suppression des anciens fichiers.

- [ ] **Step 6.5 : Commit final**

```bash
git add -u
git commit -m "chore: supprime data.js et data_fr.js (remplacés par script/data/)"
```

---

## Récapitulatif des fichiers touchés

| Fichier | Action |
|---------|--------|
| `Scripts_Python/merge_data.py` | Créé |
| `script/data/quests.js` | Créé |
| `script/data/shouts.js` | Créé |
| `script/data/spells.js` | Créé |
| `script/data/enchanting.js` | Créé |
| `script/data/alchemy.js` | Créé |
| `script/data/achievements.js` | Créé |
| `script/data/index.js` | Créé |
| `skyrim.html` | Modifié (balises `<script>`) |
| `script/app.js` | Modifié (7 sites DATA_FR_*) |
| `script/data.js` | Supprimé |
| `script/data_fr.js` | Supprimé |
| `index.html` | Non modifié |
