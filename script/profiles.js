/**
 * @file profiles.js
 * @description Gestion des profils de personnages.
 *   Partagé entre index.html (page d'accueil) et skyrim.html (checklist).
 *
 * Stockage localStorage :
 *   PROFILES_KEY        : 'skyrim_profiles_v1' — liste des profils [{ id, name, createdAt }]
 *   ACTIVE_PROFILE_KEY  : 'skyrim_active_profile' — id du dernier profil sélectionné
 *   getStorageKey(id)   : 'skyrim_checklist_{id}' — progression d'un profil
 */

const PROFILES_KEY       = 'skyrim_profiles_v1';
const ACTIVE_PROFILE_KEY = 'skyrim_active_profile';

/** @param {string} id @returns {string} */
function getStorageKey(id) { return 'skyrim_checklist_' + id; }

/** @returns {{ id: string, name: string, createdAt: number }[]} */
function getProfiles() {
  try { return JSON.parse(localStorage.getItem(PROFILES_KEY)) || []; }
  catch { return []; }
}

/** @param {{ id: string, name: string, createdAt: number }[]} profiles */
function saveProfiles(profiles) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

/**
 * Migration v1 → système de profils.
 * Si des données de l'ancienne clé skyrim_checklist_v1 existent,
 * crée un profil "Dokiin" pour les récupérer.
 * Si aucune donnée ancienne et aucun profil : ne crée rien (l'utilisateur est invité à créer son premier personnage).
 * @returns {{ id: string, name: string, createdAt: number }[]}
 */
function migrateV1IfNeeded() {
  const profiles = getProfiles();
  if (profiles.length > 0) return profiles;
  const oldData = localStorage.getItem('skyrim_checklist_v1');
  if (!oldData) return [];
  const id = 'profile_' + Date.now();
  const profile = { id, name: 'Dokiin', createdAt: Date.now() };
  localStorage.setItem(getStorageKey(id), oldData);
  saveProfiles([profile]);
  return [profile];
}

/**
 * Crée un nouveau profil et le persiste.
 * @param {string} name
 * @returns {{ id: string, name: string, createdAt: number }}
 */
function createProfile(name) {
  const profiles = getProfiles();
  const id = 'profile_' + Date.now();
  const profile = { id, name: name.trim(), createdAt: Date.now() };
  profiles.push(profile);
  saveProfiles(profiles);
  return profile;
}

/**
 * Supprime un profil et sa progression associée.
 * @param {string} id
 */
function deleteProfile(id) {
  saveProfiles(getProfiles().filter(p => p.id !== id));
  localStorage.removeItem(getStorageKey(id));
  if (localStorage.getItem(ACTIVE_PROFILE_KEY) === id) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
}

/**
 * Retourne le nombre d'items cochés pour un profil.
 * Utilisable sans CHECKLIST_DATA (index.html).
 * @param {string} profileId
 * @returns {number}
 */
function getProfileDone(profileId) {
  try {
    const data = JSON.parse(localStorage.getItem(getStorageKey(profileId))) || {};
    return Object.keys(data).length;
  } catch { return 0; }
}

/**
 * Retourne le pourcentage de complétion d'un profil.
 * Nécessite que skyrim.html ait été chargé au moins une fois (stocke le total).
 * @param {string} profileId
 * @returns {string} ex: "42%" ou "—" si total inconnu
 */
function getProfilePct(profileId) {
  const total = parseInt(localStorage.getItem('skyrim_total_items') || '0', 10);
  if (!total) return '—';
  return Math.round((getProfileDone(profileId) / total) * 100) + ' %';
}
