import { Platform } from 'react-native';

// ── Backend URL ──────────────────────────────────────────────────────────────
// On web builds, EXPO_PUBLIC_API_URL is injected at build time via Vercel env.
// On native dev, falls back to localhost.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'web' ? '' : 'http://localhost:3000');

// ── Storage keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  PROFILE: 'health_profile',
  SCAN_HISTORY: 'scan_history',
};

// ── Scan history limit ────────────────────────────────────────────────────────
export const MAX_SCAN_HISTORY = 20;

// ── Allergen keyword map ──────────────────────────────────────────────────────
export const ALLERGEN_KEYWORDS = {
  peanuts:    ['peanut', 'groundnut', 'arachis oil'],
  treenuts:   ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut'],
  milk:       ['milk', 'lactose', 'whey', 'casein', 'butter', 'cream', 'cheese', 'yogurt'],
  eggs:       ['egg', 'albumin', 'ovalbumin', 'mayonnaise'],
  wheat:      ['wheat', 'gluten', 'flour', 'semolina', 'spelt', 'durum'],
  soy:        ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh'],
  fish:       ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'bass', 'flounder', 'anchovy'],
  shellfish:  ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'clam', 'oyster', 'scallop'],
  sesame:     ['sesame', 'tahini', 'til', 'gingelly'],
  nsaids:     ['ibuprofen', 'aspirin', 'naproxen', 'diclofenac', 'indomethacin'],
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'amoxil'],
  sulfa:      ['sulfonamide', 'sulfamethoxazole', 'trimethoprim', 'bactrim'],
};
