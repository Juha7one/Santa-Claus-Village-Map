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

/**
 * Checks if the place matches the search query across all languages and multiple fields.
 */
export const matchesSearch = (place: any, query: string): boolean => {
    if (!query) return true;
    const lower = query.toLowerCase();

    // Fields to search in
    const fields: (keyof any)[] = ['name', 'description', 'category', 'categoryKey', 'subCategory'];

    return fields.some(field => {
        const val = place[field];
        if (!val) return false;

        if (typeof val === 'string') {
            return val.toLowerCase().includes(lower);
        }

        if (typeof val === 'object') {
            // Search through all language versions in the Record<string, string>
            return Object.values(val as Record<string, string>).some(text =>
                text && typeof text === 'string' && decodeHtml(text).toLowerCase().includes(lower)
            );
        }

        return false;
    });
};
