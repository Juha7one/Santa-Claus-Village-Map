import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { translations } from '../locales';
import { uiTranslations } from '../locales/uiTranslations';

/**
 * This hook detects the current language and returns the appropriate 
 * UI translation object. It prioritizes the URL 'lang' parameter,
 * then i18next's detected language, falling back to English.
 */
export function useTranslations() {
  const { i18n } = useTranslation();

  // 1. Check URL directly for immediate response
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang')?.split('-')[0];

  // 2. Fallback to i18next state
  const i18nLang = i18n.language?.split('-')[0];

  const currentLang = langParam || i18nLang || 'en';

  return useMemo(() => {
    const baseTranslations = translations[currentLang] || translations.en; // Get base translations for currentLang, fallback to en
    const uiExtra = uiTranslations[currentLang];

    if (!uiExtra) {
      return baseTranslations; // If no UI extras, return base
    }

    // Merge base with UI extras. Ensure all keys from base are present, then override/add from uiExtra.
    // This assumes uiExtra might have top-level keys like 'categories' or 'ui'
    // and also specific keys that might be at the root level of the translation object.
    // A deep merge would be more robust, but for simplicity, we'll merge top-level objects.
    const mergedTranslations = { ...baseTranslations };

    if (uiExtra.categories) {
      mergedTranslations.categories = { ...baseTranslations.categories, ...uiExtra.categories };
    }
    if (uiExtra.ui) {
      mergedTranslations.ui = { ...baseTranslations.ui, ...uiExtra.ui };
    }
    // Add any other top-level keys from uiExtra that are not 'categories' or 'ui'
    for (const key in uiExtra) {
      if (key !== 'categories' && key !== 'ui' && uiExtra.hasOwnProperty(key)) {
        mergedTranslations[key] = uiExtra[key];
      }
    }

    return mergedTranslations;
  }, [currentLang]);
}
