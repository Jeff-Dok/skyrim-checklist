# Documentation — script/profiles.js

> Gestion CRUD des profils de personnages.
> Partagé entre `index.html` (accueil) et `skyrim.html` (checklist).
> Chargé en **2e** position, après i18n.js.

---

## Rôle du fichier

Ce fichier est la **couche de données pour les profils**. Il ne touche jamais au DOM —
il expose seulement des fonctions utilitaires que les deux pages utilisent.

---

## Constantes de clés localStorage

```js
const PROFILES_KEY       = 'skyrim_profiles_v1';
const ACTIVE_PROFILE_KEY = 'skyrim_active_profile';
```

| Constante | Clé localStorage | Contenu |
|---|---|---|
| `PROFILES_KEY` | `'skyrim_profiles_v1'` | `[{ id, name, createdAt }]` |
| `ACTIVE_PROFILE_KEY` | `'skyrim_active_profile'` | `'profile_1234567890'` |

---

## `getStorageKey(id)`
```js
function getStorageKey(id) { return 'skyrim_checklist_' + id; }
// Ex: getStorageKey('profile_1710000000') → 'skyrim_checklist_profile_1710000000'
```
Retourne la clé localStorage de la **progression** d'un profil.
Chaque profil a ses propres données de checklist isolées.

---

## `getProfiles()`
```js
function getProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; }
  catch { return []; }
}
```
Retourne la liste de tous les profils. Retourne `[]` si erreur JSON ou absent.

**Format d'un profil :**
```js
{
  id: 'profile_1710000000',   // timestamp Unix en ms
  name: 'Dok',                // nom du personnage (max 30 chars)
  createdAt: 1710000000000    // timestamp de création
}
```

---

## `saveProfiles(profiles)`
```js
function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}
```
Écrase la liste complète des profils dans le localStorage.
Utilisée en interne par `createProfile()` et `deleteProfile()`.

---

## `migrateV1IfNeeded()`
```js
function migrateV1IfNeeded() {
  const profiles = getProfiles();
  if (profiles.length > 0) return profiles; // déjà migré

  // Première utilisation : crée le profil "Dok" avec les anciennes données
  const id = 'profile_' + Date.now();
  const oldData = localStorage.getItem('skyrim_checklist_v1');
  if (oldData) localStorage.setItem(getStorageKey(id), oldData); // migre l'ancien save
  saveProfiles([{ id, name: 'Dok', createdAt: Date.now() }]);
}
```
**Migration one-shot** : si aucun profil n'existe (ancienne version du projet),
crée automatiquement un profil "Dok" avec les données de l'ancienne clé
`skyrim_checklist_v1`.

Appelé **une seule fois** dans le `<script>` inline de `index.html` avant tout rendu.

---

## `createProfile(name)`
```js
function createProfile(name) {
  const profiles = getProfiles();
  const id = 'profile_' + Date.now();
  const profile = { id, name: name.trim(), createdAt: Date.now() };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}
```
Crée un nouveau profil, le persiste, et retourne l'objet créé.
L'appelant (index.html) redirige ensuite vers skyrim.html avec `playProfile(profile.id)`.

---

## `deleteProfile(id)`
```js
function deleteProfile(id) {
  saveProfiles(getProfiles().filter(p => p.id !== id));
  localStorage.removeItem(getStorageKey(id));          // supprime la progression
  if (localStorage.getItem(ACTIVE_PROFILE_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);       // désactive si c'était l'actif
  }
}
```
Supprime le profil ET toute sa progression associée.
Si c'était le profil actif, efface aussi `skyrim_active_profile`.

---

## `getProfileDone(profileId)`
```js
function getProfileDone(profileId) {
  const data = JSON.parse(localStorage.getItem(getStorageKey(profileId))) || {};
  return Object.keys(data).length; // nombre d'items cochés
}
```
Compte les items cochés pour un profil.
**Utilisable sans `CHECKLIST_DATA`** (donc disponible sur index.html).

---

## `getProfilePct(profileId)`
```js
function getProfilePct(profileId) {
  const total = parseInt(localStorage.getItem('skyrim_total_items') || '0', 10);
  if (!total) return '—';
  return Math.round((getProfileDone(profileId) / total) * 100) + ' %';
}
```
Retourne le pourcentage de complétion sous forme de string (ex: `"42 %"`).
Retourne `'—'` si le total n'est pas encore connu (jamais ouvert skyrim.html).

`skyrim_total_items` est écrit par `app.js` au premier lancement de la checklist.

---

## Flux d'utilisation

```
index.html charge → migrateV1IfNeeded() + renderProfiles()
                                    ↓
Utilisateur clique "▶ Jouer" → playProfile(id)
    → localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    → window.location.href = 'skyrim.html'

skyrim.html charge → app.js → init()
    → activeProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY)
    → load() → checked = JSON.parse(getStorageKey(activeProfileId))
```
