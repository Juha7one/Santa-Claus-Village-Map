
import { LocalizedString } from '../types';

/**
 * Extracts the correct string for the given language from a LocalizedString object or string.
 * Falls back to English ('en') if the requested language is missing.
 */
export const getLangString = (value: LocalizedString | undefined | null, lang: string): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;

    // Default to English, then try to find any available string if English is also missing
    return value[lang] || value['en'] || Object.values(value)[0] || '';
};
