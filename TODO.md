# TODO — Skyrim Checklist

## Groupes de quêtes manquants (données à ajouter dans data.js)

Ces groupes ont un knotwork prêt mais 0 données :

- [X] **Bards College** — quêtes de la guilde des bardes
- [X] **Side Quests** — quêtes secondaires
- [X] **Miscellaneous** — quêtes misc (IDs 226–326, tous les holds complétés)
- [X] **Favors** — faveurs diverses (110 items, IDs 327–436 : Activity Favors + Favors for Citizens + Thane Tasks)
- [X] **Dawnguard** — DLC Dawnguard (quêtes principales + secondaires) — 49 items, IDs 437–485
- [X] **Dragonborn** — DLC Dragonborn (quêtes principales + secondaires) — 56 items, IDs 486–541
- [~] **Fishing** — DLC Fishing (22 quêtes, IDs 552–573) — données ajoutées, 9 quêtes CC restantes à classer
- [X] **Creation Club** — 84 quêtes (IDs 574–657, 22 sections reclassées) : Armor Quests / Weapon Quests / Major Questlines (Ghosts, S&S, The Cause, Bittercup, Divine Crusader, Gray Cowl, Forgotten Seasons) / Homes (7 colonnes) / Companions (Pets, Horses, Followers) / Misc (Farming, Crafting, Spells)

## Enrichissement des descriptions (guide Prima)

- [X] Main Quest — toutes enrichies
- [X] Companions — toutes enrichies
- [X] College of Winterhold — toutes enrichies
- [X] Thieves Guild — toutes enrichies
- [X] Dark Brotherhood — toutes enrichies
- [X] Civil War — toutes enrichies
- [X] Daedric (15 quêtes) — toutes enrichies + corrections (level 163, group/giver 182)
- [X] Bards College (4 quêtes) — toutes enrichies
- [X] Divine Quests (6 quêtes) — toutes enrichies
- [X] The Greybeards / The Blades — enrichies + correction Meditations on Words of Power
- [X] Side Quests (20 quêtes + 5 ajouts : IDs 547–551) — toutes enrichies
- [X] Dungeon Quests (23 quêtes) — toutes enrichies + corrections (Wilhelm, Otar, Selveni)
- [X] Dawnguard (main quests 437–450) — toutes enrichies + correction critique ID 441
- [X] Dragonborn (main quests 486–492) — toutes enrichies + correction ID 489 (4 stones, pas 6)
- [X] Miscellaneous Objectives (226–326) — descriptions déjà spécifiques, OK
- [X] Favors (327–436) — descriptions simples/radiant, OK tel quel
- [X] Dawnguard faction/vampire/side quests (IDs 451–485) — radiant, OK
- [X] Dragonborn side quests (IDs 493–541) — toutes vérifiées, OK

## Knotworks manquants (img: null dans QUEST_GROUPS)

Ces 4 groupes n'ont pas encore de knotwork PNG :
- [ ] **Divine Quests** — à créer : `divine_quest.png`
- [ ] **The Greybeards** — à créer : `greybeards_quest.png`
- [ ] **The Blades** — à créer : `blades_quest.png`
- [ ] **Dungeon Quests** — à créer : `dungeon_quest.png`

Pistes pour la prochaine session :
- Style existant : fond sombre, motif entrelacé (knotwork) doré/cuivré, texte en haut
- Option 1 : générer via IA (Midjourney / DALL-E) avec prompt style "Nordic knotwork banner"
- Option 2 : modifier un knotwork existant (recadrage, recoloriage, ajout de symbole)
- Option 3 : créer un SVG ou HTML5 Canvas simplifié qui s'auto-génère côté code
- Référence visuelle : les PNGs existants font tous ~800×200px environ (à vérifier)

## Catégories vides (données + rendu à implémenter)

- [X] **Dragon Shouts** — 81 mots (27 cris × 3 mots, IDs 658–738) — grille 3 colonnes, police DragonScript, DLC badges
- [X] **Spells** — 170 sorts (IDs 739–908) : base + Dawnguard + Dragonborn + 53 CC — colonnes par niveau (Novice→Master), icônes WebP 64px
- [X] **Enchanting Effects** — 53 effets (IDs 909–961) : 18 armes + 35 armures, grille 6 colonnes, school + slots dans modal
- [X] **Alchemy Ingredients** — 183 ingrédients (IDs 962–1144) en ordre alphabétique, grille 5 colonnes, icônes WebP 64px, modal anglais (Group/Origin/Effects/How to Obtain/Garden)
- [ ] **Books** — Skill Books (~90 livres, 1 par skill par niveau)
- [ ] **Perks** — perks spéciaux (scope à définir)
- [ ] **Collectible** — scope à définir (cartes ? listes par type ?)
- [ ] **Unique Gear** — armes/armures uniques
- [ ] **Locations** — lieux à découvrir
- [ ] **Merchants** — marchands particuliers
- [ ] **Recruitable Followers** — compagnons recrutables
- [ ] **Achievements** — succès Steam/PlayStation (icones deja presentes dans assets/icons/achievements/)

## Fonctionnalités UI

- [ ] Rendu **Achievements** — grille avec icone par succès
- [X] Rendu **Dragon Shouts** — grille 3 colonnes, police DragonScript, info modal avec translation/DLC/location
- [ ] Rendu **Collectible** — mise en page à définir
- [ ] Rendu **Unique Gear** — potentiellement grille avec image de l'objet
- [ ] **Export / Import** — sauvegarder/restaurer la progression en JSON
- [ ] **Reset** — bouton de remise à zéro avec confirmation

## Qualité & polish

- [ ] Favicon (absent des assets)
- [ ] Responsive mobile — tester et améliorer
- [ ] Vérifier que `extract.py` couvre toutes les catégories du `.xlsx`
- [ ] Compléter `Skyrim Checklist — Master.xlsx` avec les données manquantes
