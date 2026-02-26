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
    // translations contains { en, fi }
    // We use translations.en as the absolute fallback for any missing language or key
    const en = translations.en;
    const fi = translations.fi;

    // Base is either fi or en
    const base = (currentLang === 'fi') ? fi : en;

    // UI extra is what we added in uiTranslations.ts
    const uiExtra = uiTranslations[currentLang] || {};

    return {
      ...base,
      categories: {
        ...(base.categories || {}),
        ...(uiExtra.categories || {})
      },
      ui: {
        ...(base.ui || {}),
        ...(uiExtra.ui || {})
      }
    };
  }, [currentLang]);
}
