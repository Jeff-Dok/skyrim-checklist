# TODO — Skyrim Checklist

## Groupes de quêtes manquants (données à ajouter dans data.js)

- [X] **Bards College** — quêtes de la guilde des bardes
- [X] **Side Quests** — quêtes secondaires
- [X] **Miscellaneous** — quêtes misc (IDs 226–326, tous les holds complétés)
- [X] **Favors** — faveurs diverses (110 items, IDs 327–436 : Activity Favors + Favors for Citizens + Thane Tasks)
- [X] **Dawnguard** — DLC Dawnguard (quêtes principales + secondaires) — 49 items, IDs 437–485
- [X] **Dragonborn** — DLC Dragonborn (quêtes principales + secondaires) — 56 items, IDs 486–541
- [~] **Fishing** — DLC Fishing (22 quêtes, IDs 552–573) — données ajoutées, 9 quêtes CC restantes à classer
- [X] **Creation Club** — 84 quêtes (IDs 574–657, 22 sections reclassées)

---

## Enrichissement des descriptions (guide Prima)

- [X] Main Quest — toutes enrichies
- [X] Companions — toutes enrichies
- [X] College of Winterhold — toutes enrichies
- [X] Thieves Guild — toutes enrichies
- [X] Dark Brotherhood — toutes enrichies
- [X] Civil War — toutes enrichies
- [X] Daedric (15 quêtes) — toutes enrichies
- [X] Bards College (4 quêtes) — toutes enrichies
- [X] Divine Quests (6 quêtes) — toutes enrichies
- [X] The Greybeards / The Blades — enrichies
- [X] Side Quests (20 quêtes + 5 ajouts IDs 547–551) — toutes enrichies
- [X] Dungeon Quests (23 quêtes) — toutes enrichies
- [X] Dawnguard — toutes enrichies
- [X] Dragonborn — toutes enrichies
- [X] Miscellaneous Objectives, Favors, radiant quests — OK tel quel

---

## Knotworks manquants (img: null dans QUEST_GROUPS)

Ces 4 groupes n'ont pas encore de banner WebP (1030×74px) :
- [ ] **Divine Quests** → `divine_quest.webp`
- [X] **The Greybeards** → `greybeards_quest.webp` ✅ ajouté et optimisé (PNG→WebP, 83Ko→5.8Ko)
- [ ] **The Blades** → `blades_quest.webp`
- [ ] **Dungeon Quests** → `dungeon_quest.webp`

Pistes : Midjourney / DALL-E avec prompt "Nordic knotwork banner 1030x74" ou recadrage d'un existant.

---

## Catégorie Alchemy — sections à compléter

La catégorie Alchemy Ingredients est rendue (1 colonne, 4 sections collapsibles).

### Potions ✅ COMPLÉTÉ
- [X] 212 items codés (IDs 1145–1356), groupes Health/Magicka/Stamina/Skill
- [X] Types dans Skill : 19 Fortify + Invisibility + Regen + Resist + Waterbreathing + Thieves Guild + DLC/Special
- [ ] **Vérifier les images** — certains `img` peuvent ne pas avoir de fichier correspondant (`onerror` fallback actif)

### Poisons ✅ COMPLÉTÉ
- [X] 79 items codés (IDs 1357–1435), groupes Damage/Crowd Control/Weakness/Lingering/Special
- [X] Types collapsibles comme Potions
- [ ] **Vérifier les images** — SlowMagicka*/SlowStamina* au lieu de LingeringMagicka*/LingeringStamina*

### Recipes
- [ ] Scope à définir — recettes d'alchimie ? combinaisons ingrédients → effet ?

---

## Scrolls (nouvelle catégorie potentielle)

- [ ] **Données préparées** — `Sections/potions_poisons_beverages.txt` section SCROLLS
  - 56 scrolls complets avec ID, effet, valeur, location (UESP + Prima)
  - Organisés par école : Alteration, Conjuration, Destruction, Illusion, Restoration + Quest/Special
- [ ] **Décision** : inclure dans Alchemy ? créer catégorie séparée ? ignorer ?
- [ ] **Rendu** à définir si retenu

---

## Spiders (données CC disponibles)

- [ ] **Données préparées** — `Sections/potions_poisons_beverages.txt` section SPIDERS
  - 15 spiders CC avec effets et descriptions (Prima guide)
- [ ] **Décision** : inclure dans quelle catégorie ?

---

## Scripts utilitaires (agents Python — mis à jour cette session)

Tous dans `C:\Users\jnfra\.claude\agents\` :

- [X] `analyze_image.py` — analyse 1 image via Claude API → `.txt`
- [X] `batch_analyze.py` — analyse tous PNG/JPG/WEBP d'un dossier
- [X] `download_uesp_images.py` — télécharge icônes UESP depuis URL(s)
  - Patterns : `SR-icon-*.png/jpg` et `SR-item-*.png/jpg`
  - Routing auto : `UESP/icon/` ou `UESP/item/` selon le nom
  - Multi-URL supporté : `python script.py url1 url2 url3`
  - Dest par défaut : `C:\Users\jnfra\OneDrive\Pictures\UESP`
- [X] `process_ingredient_images.py` — convertit PNG/JPG → WebP 64px
  - Retire tout ce qui est avant le dernier `-` du nom
  - Retire les apostrophes du nom
  - Reproduit la structure source dans `UESP/webp/icon/` ou `UESP/webp/item/`
- [X] `build_sections.py` — fusionne pages PDF du guide Prima
  - Usage : `python build_sections.py "Nom" page_debut [page_fin]`
  - Output : `skyrim_project/Sections/Nom.pdf`

---

## Catégories à implémenter (données + rendu)

- [X] **Dragon Shouts** — 81 mots (IDs 658–738)
- [X] **Spells** — 170 sorts (IDs 739–908)
- [X] **Enchanting Effects** — 53 effets (IDs 909–961)
- [X] **Alchemy Ingredients** — 183 ingrédients (IDs 962–1144) — section Ingredients complète
- [X] **Alchemy Potions** — 212 items codés (IDs 1145–1356) : Health/Magicka/Stamina/Skill (tous Fortify, Regen, Resist, Invisibility, Waterbreathing, Thieves Guild, DLC, Special)
- [X] **Alchemy Poisons** — 79 items codés (IDs 1357–1435) : Damage/Crowd Control/Weakness/Lingering/Special
- [ ] **Alchemy Recipes** — scope à définir
- [~] **Books** — Structure placeholder : 3 groupes (Skills, Quests, Lores) — "Data coming soon"
  - Données à récupérer (UESP : Skyrim:Skill Books)
  - Rendu : liste par compétence, avec nom du livre + skill boosté
- [~] **Perks** — Structure placeholder : 6 groupes, sous-groupes Combat/Magic/Stealth — "Data coming soon"
  - Données à coder pour chacun des 18 skill trees
- [ ] **Collectible** — scope à définir (cartes au trésor ? Stones of Barenziah ? Flûtes de barde ?)
- [ ] **Unique Gear** — armes/armures uniques
  - Données partiellement préparées (URLs UESP téléchargées cette session)
  - Images `SR-item-*.png` dans `UESP/item/` → à convertir en WebP
  - Rendu potentiel : grille avec image de l'objet
- [ ] **Locations** — lieux à découvrir (Donjons, Villes, Camps, etc.)
- [ ] **Merchants** — marchands spécialisés avec inventaire notable
- [ ] **Recruitable Followers** — compagnons recrutables avec conditions
- [ ] **Achievements** — succès Steam/PlayStation
  - Icônes déjà présentes : `assets/icons/achievements/` (non trackées)
  - Rendu : grille avec icône par succès

---

## Fonctionnalités UI

- [X] **Multi-profils** — index.html (sélection/création/suppression) + skyrim.html (checklist par profil)
- [X] **Internationalisation FR/EN** — i18n.js + data_fr.js (1038 traductions IDs 1–1144) + t() partout dans app.js
- [X] **Traductions Dragon Shouts FR** — headers + mots propres + `DATA_FR_WORDS` (significations FR)
- [X] **Traductions Spells FR** — ~40 corrections (noms officiels via wiki FR) + `SPELL_SCHOOL_FR_MAP`
- [ ] **Traductions Potions/Poisons FR** — data_fr.js ne couvre pas encore les IDs 1145–1435
- [ ] **Images Potions/Poisons** — 13 items mis à jour cette session (HealingExtreme, MagickaExtreme, StaminaExtreme, Ale), vérifier les autres null restants
- [ ] **Export / Import** — sauvegarder/restaurer la progression en JSON
- [ ] **Reset** — bouton remise à zéro avec confirmation modale
- [ ] **Rendu Achievements** — grille icône + nom + description
- [ ] **Rendu Collectible** — mise en page à définir selon scope
- [ ] **Rendu Unique Gear** — grille avec image WebP de l'objet

---

## Qualité & polish

- [X] **Favicon** — `assets/images/logos/favicon.ico` ajouté + référencé dans index.html et skyrim.html
- [ ] **Responsive mobile** — tester sur mobile réel / DevTools 375px
- [ ] **Vérifier `extract.py`** — couvre-t-il toutes les catégories du `.xlsx` ?
- [ ] **Compléter le `.xlsx`** avec les données des nouvelles catégories
