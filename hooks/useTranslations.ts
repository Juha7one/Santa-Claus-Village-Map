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
    console.log(`[useTranslations] Lang detected: ${currentLang}`);

    const en = translations.en;

    // If it's Finnish, we have a full manual file
    if (currentLang === 'fi' && translations.fi) {
      return translations.fi;
    }

    // For other languages, use UI translations if available, otherwise fallback to English UI
    if (uiTranslations[currentLang]) {
      return {
        ...en,
        categories: { ...en.categories, ...uiTranslations[currentLang].categories },
        ui: { ...en.ui, ...uiTranslations[currentLang].ui }
      };
    }

    return en;
  }, [currentLang]);
}
