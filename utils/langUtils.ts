import { LocalizedString } from '../types';

/**
 * Decodes HTML entities using a temporary textarea element.
 */
function decodeHtml(html: string): string {
    if (!html || !html.includes('&')) return html;
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

/**
 * Extracts the correct string for the given language from a LocalizedString object or string.
 * Falls back to English ('en') if the requested language is missing.
 */
export const getLangString = (value: LocalizedString | undefined | null, lang: string): string => {
    if (!value) return '';
    const rawValue = typeof value === 'string'
        ? value
        : (value[lang] || value['en'] || Object.values(value)[0] || '');

    return decodeHtml(rawValue);
};
