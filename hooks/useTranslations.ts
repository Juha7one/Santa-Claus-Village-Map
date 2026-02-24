import { translations } from '../locales';

// This hook now detects the user's browser language and returns the
// appropriate translation object. It defaults to English if a specific
// translation is not found.
export function useTranslations() {
  // Get the user's preferred language from the browser, taking the primary language code
  const userLang = navigator.language.split('-')[0]; // e.g., 'en-US' -> 'en', 'fi-FI' -> 'fi'

  // Check if a translation for the user's language exists in our translations object
  if (userLang === 'fi' && translations.fi) {
    return translations.fi;
  }
  
  // Default to English
  return translations.en;
}
