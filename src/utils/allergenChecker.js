import { ALLERGEN_KEYWORDS } from '../constants';

export function checkAllergens(extractedText, profile) {
  const text = extractedText.toLowerCase();
  const warnings = [];

  for (const userAllergen of profile.foodAllergies) {
    const normalized = userAllergen.toLowerCase().trim();
    const keywords = ALLERGEN_KEYWORDS[normalized] || [normalized];
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

  for (const userAllergen of profile.drugAllergies) {
    const normalized = userAllergen.toLowerCase().trim();
    const keywords = ALLERGEN_KEYWORDS[normalized] || [normalized];
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
  const allKeywords = [];
  for (const allergen of [...profile.foodAllergies, ...profile.drugAllergies]) {
    const normalized = allergen.toLowerCase().trim();
    const keywords = ALLERGEN_KEYWORDS[normalized] || [normalized];
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
