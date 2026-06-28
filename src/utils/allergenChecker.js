// Allergen checker — compares extracted text against user's health profile
// Uses keyword matching + optional AI call

const COMMON_ALLERGEN_KEYWORDS = {
  peanuts: ['peanut', 'groundnut', 'arachis oil'],
  treenuts: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia', 'brazil nut'],
  milk: ['milk', 'lactose', 'whey', 'casein', 'butter', 'cream', 'cheese', 'yogurt'],
  eggs: ['egg', 'albumin', 'ovalbumin', 'mayonnaise'],
  wheat: ['wheat', 'gluten', 'flour', 'semolina', 'spelt', 'durum'],
  soy: ['soy', 'soya', 'tofu', 'edamame', 'miso', 'tempeh'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'tilapia', 'bass', 'flounder', 'anchovy'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'clam', 'oyster', 'scallop'],
  sesame: ['sesame', 'tahini', 'til', 'gingelly'],
  nsaids: ['ibuprofen', 'aspirin', 'naproxen', 'diclofenac', 'indomethacin'],
  penicillin: ['penicillin', 'amoxicillin', 'ampicillin', 'amoxil'],
  sulfa: ['sulfonamide', 'sulfamethoxazole', 'trimethoprim', 'bactrim'],
};

export function checkAllergens(extractedText, profile) {
  const text = extractedText.toLowerCase();
  const warnings = [];
  const safe = [];

  // Check food allergies
  for (const userAllergen of profile.foodAllergies) {
    const normalized = userAllergen.toLowerCase().trim();
    const keywords = COMMON_ALLERGEN_KEYWORDS[normalized] || [normalized];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        warnings.push({
          type: 'food',
          allergen: userAllergen,
          found: kw,
          severity: 'danger',
          message: `Contains ${kw} — you are allergic to ${userAllergen}`,
        });
        break;
      }
    }
  }

  // Check drug allergies
  for (const userAllergen of profile.drugAllergies) {
    const normalized = userAllergen.toLowerCase().trim();
    const keywords = COMMON_ALLERGEN_KEYWORDS[normalized] || [normalized];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        warnings.push({
          type: 'drug',
          allergen: userAllergen,
          found: kw,
          severity: 'danger',
          message: `This medicine contains ${kw} — you are allergic to ${userAllergen}`,
        });
        break;
      }
    }
  }

  // Check current medications for interactions (basic duplicate check)
  for (const med of profile.medications) {
    const normalized = med.toLowerCase().trim();
    if (text.includes(normalized)) {
      warnings.push({
        type: 'interaction',
        allergen: med,
        found: normalized,
        severity: 'warning',
        message: `You are already taking ${med} — check with your doctor before taking this again`,
      });
    }
  }

  return {
    warnings,
    safe: warnings.length === 0,
    summary:
      warnings.length === 0
        ? 'No known allergens detected based on your profile.'
        : `${warnings.length} issue${warnings.length > 1 ? 's' : ''} found based on your profile.`,
  };
}

export function highlightAllergens(text, profile) {
  // Returns array of segments: { text, isAllergen, allergenName }
  const allKeywords = [];
  for (const allergen of [...profile.foodAllergies, ...profile.drugAllergies]) {
    const normalized = allergen.toLowerCase().trim();
    const keywords = COMMON_ALLERGEN_KEYWORDS[normalized] || [normalized];
    for (const kw of keywords) {
      allKeywords.push({ kw, allergen });
    }
  }

  if (allKeywords.length === 0) return [{ text, isAllergen: false }];

  const regex = new RegExp(`(${allKeywords.map((k) => k.kw).join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part) => {
    const match = allKeywords.find((k) => k.kw === part.toLowerCase());
    return { text: part, isAllergen: !!match, allergenName: match?.allergen };
  });
}
