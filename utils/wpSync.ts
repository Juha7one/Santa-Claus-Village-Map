import { LocalizedString, Place } from '../types';
import { CATEGORIES } from '../constants';
import { supabase } from '../src/lib/supabase';

// Helper to translate text using MyMemory or Google Translate
export async function translateText(text: string, from: string, to: string): Promise<string> {
    if (!text || from === to) return text;
    const googleKey = (import.meta as any).env.VITE_GOOGLE_TRANSLATE_API_KEY;
    const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    if (!cleanText) return text;

    try {
        if (googleKey && googleKey !== "") {
            const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${googleKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: cleanText,
                    source: from,
                    target: to,
                    format: 'text'
                })
            });
            const data = await res.json();
            if (data.data?.translations?.[0]?.translatedText) {
                return data.data.translations[0].translatedText;
            }
        }

        const email = "juha.tahvonen@santaclausvillage.info";
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText.slice(0, 500))}&langpair=${from}|${to}&de=${email}`);
        const data = await response.json();
        const translated = data.responseData?.translatedText;

        if (translated && (translated.includes("MYMEMORY WARNING") || translated.includes("YOU USED ALL AVAILABLE FREE TRANSLATIONS"))) {
            return text;
        }

        return translated || text;
    } catch (e) {
        console.error("Translation error:", e);
        return text;
    }
}

export interface WpSyncResult {
    name: Record<string, string>;
    description: Record<string, string>;
    address: Record<string, string>;
    openingHours: Record<string, string>;
    imageUrl: string;
    phone: string;
    email: string;
    website: string;
    facebookUrl: string;
    instagramUrl: string;
}

export const syncPlaceFromWp = async (linkedWpUrl: string, onStatus?: (status: string) => void): Promise<WpSyncResult> => {
    if (onStatus) onStatus("Initializing sync...");

    const getWpInfo = (urlStr: string) => {
        const u = new URL(urlStr);
        const parts = u.pathname.split('/').filter(Boolean);
        const wpLanguages = ['fi', 'de', 'fr', 'es', 'it'];
        const firstPartIsLang = wpLanguages.includes(parts[0]);
        const lang = firstPartIsLang ? parts[0] : 'en';
        const typeIdx = firstPartIsLang ? 1 : 0;
        const type = parts[typeIdx];
        const slug = parts[typeIdx + 1] || type;
        return { lang, type, slug };
    };

    const info = getWpInfo(linkedWpUrl.trim());
    const typeMap: Record<string, string> = {
        'restaurants': 'restaurants', 'ravintolat': 'restaurants',
        'accommodation': 'accommodation', 'majoitus': 'accommodation',
        'shops': 'shops', 'ostokset': 'shops',
        'activities': 'activities', 'aktiviteetit': 'activities',
        'services': 'services', 'palvelut': 'services',
        'news': 'posts', 'uutiset': 'posts'
    };
    const wpType = typeMap[info.type] || 'pages';

    const fetchWp = async (lang: string, slug: string) => {
        const api = `https://santaclausvillage.info/wp-json/wp/v2/${wpType}?slug=${slug}&_embed&lang=${lang}`;
        try {
            const proxy1 = `https://api.allorigins.win/get?url=${encodeURIComponent(api)}`;
            const res = await fetch(proxy1);
            if (!res.ok) throw new Error("Proxy 1 down");
            const json = await res.json();
            const data = JSON.parse(json.contents);
            return Array.isArray(data) ? data[0] : data;
        } catch (e) {
            try {
                const proxy2 = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(api)}`;
                const res = await fetch(proxy2);
                if (!res.ok) throw new Error("Proxy 2 down");
                const data = await res.json();
                return Array.isArray(data) ? data[0] : data;
            } catch (e2) {
                return null;
            }
        }
    };

    const extract = (post: any) => {
        if (!post) return null;
        const acf = post.acf || {};
        let desc = acf.description || acf.content || acf.kuvaus || "";

        if (!desc && post.content?.rendered) {
            const doc = new DOMParser().parseFromString(post.content.rendered, 'text/html');
            doc.querySelectorAll('script, style, img').forEach(el => el.remove());
            desc = doc.body.innerHTML.trim();
        }

        if (!desc && post.excerpt?.rendered) {
            const doc = new DOMParser().parseFromString(post.excerpt.rendered, 'text/html');
            desc = doc.body.textContent || "";
        }

        const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || "";
        const forceStr = (val: any) => (typeof val === 'string' ? val : (val ? String(val) : ""));

        return {
            name: forceStr(post.title?.rendered),
            description: forceStr(desc).trim(),
            address: forceStr(acf.address),
            openingHours: forceStr(acf.opening_hours),
            featured: forceStr(featured),
            acf
        };
    };

    if (onStatus) onStatus("Fetching Master (EN) data...");
    let enPost = null;
    if (info.lang === 'en') {
        enPost = await fetchWp('en', info.slug);
    } else {
        const startingPost = await fetchWp(info.lang, info.slug);
        if (startingPost?.translations?.en) {
            const enId = startingPost.translations.en;
            const api = `https://santaclausvillage.info/wp-json/wp/v2/${wpType}/${enId}?_embed`;
            try {
                const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(api)}`;
                const res = await fetch(proxy);
                const json = await res.json();
                enPost = JSON.parse(json.contents);
            } catch (e) { }
        }
        if (!enPost) enPost = await fetchWp('en', info.slug);
    }

    if (!enPost) throw new Error("EN post not found.");

    const enRaw = extract(enPost)!;
    const acf = enRaw.acf;

    const results: WpSyncResult = {
        name: { en: enRaw.name },
        description: { en: enRaw.description },
        address: { en: enRaw.address },
        openingHours: { en: enRaw.openingHours },
        imageUrl: enRaw.featured || "",
        phone: acf.phone || "",
        email: acf.email || "",
        website: acf.links?.[0]?.url || acf.website || "",
        facebookUrl: acf.facebook || "",
        instagramUrl: acf.instagram || "",
    };

    const wpLanguages = ['fi', 'de', 'fr', 'es', 'it'];
    const aiOnlyLanguages = ['zh', 'ja', 'ko', 'sv', 'ar'];
    const translationMap = enPost.translations || {};

    for (const lang of wpLanguages) {
        if (onStatus) onStatus(`Syncing ${lang.toUpperCase()} from website...`);
        let post = null;
        if (translationMap[lang]) {
            const id = translationMap[lang];
            const baseUrl = `https://santaclausvillage.info/wp-json/wp/v2/${wpType}/${id}?_embed`;
            try {
                const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
                const res = await fetch(proxy);
                const json = await res.json();
                post = JSON.parse(json.contents);
            } catch (e) { }
        }

        if (!post && info.lang === lang) {
            post = await fetchWp(lang, info.slug);
        }

        const data = extract(post);
        if (data) {
            if (data.name) results.name[lang] = data.name;
            if (data.description) results.description[lang] = data.description;
            if (data.address) results.address[lang] = data.address;
            if (data.openingHours) results.openingHours[lang] = data.openingHours;
        }
    }

    const allTargetLangs = [...wpLanguages, ...aiOnlyLanguages];
    for (const lang of allTargetLangs) {
        const needsName = !results.name[lang];
        const needsDesc = !results.description[lang];
        const needsHours = !results.openingHours[lang];

        if (needsName || needsDesc || needsHours) {
            if (onStatus) onStatus(`AI Translation: ${lang.toUpperCase()}...`);
            try {
                if (needsName) results.name[lang] = await translateText(results.name.en, 'en', lang);
                if (needsDesc) results.description[lang] = await translateText(results.description.en, 'en', lang);
                if (!results.address[lang]) results.address[lang] = results.address.en;
                if (needsHours) results.openingHours[lang] = await translateText(results.openingHours.en, 'en', lang);
            } catch (e) { }
        }
    }

    return results;
};

export const savePlaceToDb = async (placeId: string | null, placeData: any) => {
    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (placeId && !placeId.startsWith('user_place_') && isUUID(placeId)) {
        const { error } = await supabase.from('places').update(placeData).eq('id', placeId);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('places').insert([{ ...placeData, original_id: placeId }]);
        if (error) throw error;
    }
};
