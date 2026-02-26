import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        debug: true,
        interpolation: {
            escapeValue: false,
        },
        detection: {
            // Check 'lang' parameter since user prefers it over 'lng'
            order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
            lookupQuerystring: 'lang',
            caches: ['localStorage', 'cookie'],
        },
        resources: {
            // If we want to use i18next properly, we'd put labels here.
            // For now, useTranslations.ts handles the object selection.
        }
    });

export default i18n;
