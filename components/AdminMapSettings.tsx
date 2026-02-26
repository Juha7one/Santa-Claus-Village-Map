import React, { useState, useEffect } from 'react';
import { CATEGORIES, getCategoryColor } from '../constants';
import { getLangString } from '../utils/langUtils';
import { LocalizedString, Place, Coordinates } from '../types';

// Simple translation helper using MyMemory API (Free, no key needed for low volume)
async function translateText(text: string, from: string, to: string): Promise<string> {
    if (!text || from === to) return text;
    const googleKey = (import.meta as any).env.VITE_GOOGLE_TRANSLATE_API_KEY;
    const cleanText = text.replace(/<[^>]*>/g, ' ').trim();
    if (!cleanText) return text;

    try {
        if (googleKey && googleKey !== "") {
            console.log(`Using Google Translate for: ${to}`);
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

        console.log(`Using MyMemory for: ${to}`);
        const email = "juha.tahvonen@santaclausvillage.info";
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText.slice(0, 500))}&langpair=${from}|${to}&de=${email}`);
        const data = await response.json();
        const translated = data.responseData?.translatedText;

        if (translated && (translated.includes("MYMEMORY WARNING") || translated.includes("YOU USED ALL AVAILABLE FREE TRANSLATIONS"))) {
            console.warn("MyMemory quota exceeded for today.");
            return text;
        }

        return translated || text;
    } catch (e) {
        console.error("Translation error:", e);
        return text;
    }
}
import { supabase } from '../src/lib/supabase';

interface AdminMapSettingsProps {
    existingPlace: Place | null;
    clickedLocation: Coordinates | null;
    onClose: () => void;
    onSaveSuccess: () => void;
    onLocationChange: (coords: Coordinates) => void;
}

const AdminMapSettings: React.FC<AdminMapSettingsProps> = ({ existingPlace, clickedLocation, onClose, onSaveSuccess, onLocationChange }) => {
    // Field states (Primary edits in English)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [openingHours, setOpeningHours] = useState('');

    // Store full translation objects from DB to preserve other languages
    const [fullTranslations, setFullTranslations] = useState<{
        name: Record<string, string>;
        description: Record<string, string>;
        address: Record<string, string>;
        openingHours: Record<string, string>;
    }>({
        name: {}, description: {}, address: {}, openingHours: {}
    });

    const [categoryKey, setCategoryKey] = useState('Attractions');
    const [imageUrl, setImageUrl] = useState('');
    const [bookingUrl, setBookingUrl] = useState('');
    const [linkedWpUrl, setLinkedWpUrl] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [facebookUrl, setFacebookUrl] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [subCategory, setSubCategory] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [latInput, setLatInput] = useState('');
    const [lngInput, setLngInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (existingPlace) {
            // Load English content into state for editing
            setName(getLangString(existingPlace.name, 'en'));
            setDescription(getLangString(existingPlace.description, 'en'));
            setAddress(getLangString(existingPlace.address, 'en'));
            setOpeningHours(getLangString(existingPlace.openingHours, 'en'));

            // Store other languages to avoid overwriting them
            const getObj = (val: LocalizedString | undefined) => (typeof val === 'object' && val !== null ? val : {});
            setFullTranslations({
                name: getObj(existingPlace.name),
                description: getObj(existingPlace.description),
                address: getObj(existingPlace.address),
                openingHours: getObj(existingPlace.openingHours)
            });

            setCategoryKey(existingPlace.categoryKey || 'Attractions');
            setImageUrl(existingPlace.imageUrl || '');
            setLinkedWpUrl(existingPlace.linkedWpUrl || '');
            setPhone(existingPlace.phone || '');
            setEmail(existingPlace.email || '');
            setWebsite(existingPlace.website || '');
            setFacebookUrl(existingPlace.facebookUrl || '');
            setInstagramUrl(existingPlace.instagramUrl || '');
            setSubCategory(existingPlace.subCategory || '');
            setLatInput(existingPlace.location.lat.toString());
            setLngInput(existingPlace.location.lng.toString());
        } else if (clickedLocation) {
            setName('');
            setCategoryKey('Attractions');
            setDescription('');
            setImageUrl('');
            setBookingUrl('');
            setLinkedWpUrl('');
            setAddress('');
            setPhone('');
            setEmail('');
            setWebsite('');
            setOpeningHours('');
            setFacebookUrl('');
            setInstagramUrl('');
            setSubCategory('');
            setLatInput(clickedLocation.lat.toString());
            setLngInput(clickedLocation.lng.toString());
        }
    }, [existingPlace, clickedLocation]);

    const handleWpSync = async () => {
        setIsSyncing(true);
        setError(null);
        setSyncStatus("Initializing global sync...");

        try {
            console.log("Starting global sync for URL:", linkedWpUrl);

            // 1. Determine base path info
            const getWpInfo = (urlStr: string) => {
                const u = new URL(urlStr);
                const parts = u.pathname.split('/').filter(Boolean);
                // Detect language prefix if any
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

            // 2. Fetch Helper with Retry/Multi-proxy support
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

            // 3. Define Language Sets
            const wpLanguages = ['fi', 'de', 'fr', 'es', 'it'];
            const aiOnlyLanguages = ['zh', 'ja', 'ko', 'sv', 'ar'];

            // 4. Fetch English (Master)
            setSyncStatus("Fetching Master (EN) data...");
            let enPost = null;
            if (info.lang === 'en') {
                enPost = await fetchWp('en', info.slug);
            } else {
                const startingPost = await fetchWp(info.lang, info.slug);
                if (startingPost?.translations?.en) {
                    const enId = startingPost.translations.en;
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://santaclausvillage.info/wp-json/wp/v2/${wpType}/${enId}?_embed`)}`;
                    try {
                        const res = await fetch(proxyUrl);
                        const json = await res.json();
                        enPost = JSON.parse(json.contents);
                    } catch (e) { }
                }
                if (!enPost) enPost = await fetchWp('en', info.slug);
            }
            if (!enPost) throw new Error("EN post not found.");

            const extract = (post: any) => {
                if (!post) return null;
                const acf = post.acf || {};
                let desc = acf.description || acf.content || acf.kuvaus || "";
                let source = "ACF";

                if (!desc && post.content?.rendered) {
                    const doc = new DOMParser().parseFromString(post.content.rendered, 'text/html');
                    doc.querySelectorAll('script, style, img').forEach(el => el.remove());
                    desc = doc.body.innerHTML.trim();
                    source = "Content";
                }

                if (!desc && post.excerpt?.rendered) {
                    const doc = new DOMParser().parseFromString(post.excerpt.rendered, 'text/html');
                    desc = doc.body.textContent || "";
                    source = "Excerpt";
                }

                const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || "";
                const forceStr = (val: any) => (typeof val === 'string' ? val : (val ? String(val) : ""));

                const result = {
                    name: forceStr(post.title?.rendered),
                    description: forceStr(desc).trim(),
                    address: forceStr(acf.address),
                    openingHours: forceStr(acf.opening_hours),
                    featured: forceStr(featured)
                };
                console.log(`Extracted from ${source}:`, result.name, result.description?.slice(0, 50) + "...");
                return result;
            };

            const enData = extract(enPost)!;

            // 5. Build full translation Map
            const newTranslations = {
                name: { en: enData.name } as Record<string, string>,
                description: { en: enData.description } as Record<string, string>,
                address: { en: enData.address } as Record<string, string>,
                openingHours: { en: enData.openingHours } as Record<string, string>
            };

            // Enhanced Translation Detection: Check for translations in metadata
            const translationMap = enPost.translations || {}; // { "fi": 123, "de": 456 }
            console.log("Translation Map for fetching:", translationMap);

            for (const lang of wpLanguages) {
                setSyncStatus(`Syncing ${lang.toUpperCase()} from website...`);

                let post = null;
                // If we have an ID for this language, fetch by ID (most reliable)
                if (translationMap[lang]) {
                    const id = translationMap[lang];
                    console.log(`Fetching ${lang} by ID: ${id}`);
                    // Use the site's base API for all languages if using Polylang, 
                    // or the specific language sub-site API if using WPML/Multi-site.
                    // Most SCV lang setups for REST are through ?lang= prefix or separate routes.
                    const baseUrl = `https://santaclausvillage.info/wp-json/wp/v2/${wpType}/${id}?_embed`;
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
                    try {
                        const res = await fetch(proxyUrl);
                        const json = await res.json();
                        post = JSON.parse(json.contents);
                    } catch (e) {
                        console.warn(`Failed to fetch ${lang} by ID ${id}, falling back to slug.`);
                    }
                }

                // Fallback to fetch by slug ONLY if ID fetch failed AND the starting URL matches this language
                if (!post && info.lang === lang) {
                    post = await fetchWp(lang, info.slug);
                }

                const data = extract(post);
                if (data && (data.name || data.description)) {
                    console.log(`Successfully found ${lang} content on website.`, data.description?.slice(0, 50));
                    if (data.name) newTranslations.name[lang] = data.name;
                    if (data.description) newTranslations.description[lang] = data.description;
                    if (data.address) newTranslations.address[lang] = data.address;
                    if (data.openingHours) newTranslations.openingHours[lang] = data.openingHours;
                } else {
                    console.log(`${lang} content NOT found on website (looked at id/slug), will use AI.`);
                    // If we have an existing translation in the DB for this language, 
                    // maybe we should keep it? For now, we follow the AI path as requested 
                    // but with better detection.
                }
            }

            // 7. AI Fill Gaps (only for missing fields)
            const allTargetLangs = [...wpLanguages, ...aiOnlyLanguages];
            for (const lang of allTargetLangs) {
                const needsName = !newTranslations.name[lang];
                const needsDesc = !newTranslations.description[lang];
                const needsHours = !newTranslations.openingHours[lang];

                if (needsName || needsDesc || needsHours) {
                    try {
                        setSyncStatus(`AI Translation: ${lang.toUpperCase()}...`);
                        if (needsName) {
                            newTranslations.name[lang] = await translateText(enData.name, 'en', lang);
                        }
                        if (needsDesc) {
                            newTranslations.description[lang] = await translateText(enData.description, 'en', lang);
                        }
                        if (!newTranslations.address[lang]) newTranslations.address[lang] = enData.address;
                        if (needsHours) {
                            newTranslations.openingHours[lang] = await translateText(enData.openingHours, 'en', lang);
                        }
                    } catch (aiErr) {
                        console.error(`AI error for ${lang}:`, aiErr);
                    }
                } else {
                    console.log(`Skipping AI for ${lang} - already has content.`);
                }
            }
            console.log("Final Sync Data:", newTranslations);

            // 8. Update State
            setName(enData.name);
            setDescription(enData.description);
            setAddress(enData.address);
            setOpeningHours(enData.openingHours);
            setImageUrl(enData.featured);
            setFullTranslations(newTranslations);

            // Universal data
            const acf = enPost.acf || {};
            if (acf.phone) setPhone(acf.phone);
            if (acf.email) setEmail(acf.email);
            const siteUrl = acf.links?.[0]?.url || acf.website || "";
            if (siteUrl) {
                setWebsite(siteUrl);
                if (!bookingUrl) setBookingUrl(siteUrl);
            }
            if (acf.facebook) setFacebookUrl(acf.facebook);
            if (acf.instagram) setInstagramUrl(acf.instagram);

            setSyncStatus("Global Sync Complete!");
            setTimeout(() => setSyncStatus(null), 3000);
            alert("Global Sync Ready! 11 languages processed.");
        } catch (err: any) {
            console.error("Sync error:", err);
            setError(`Sync failed: ${err.message}`);
            setSyncStatus(null);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const lat = parseFloat(latInput);
        const lng = parseFloat(lngInput);

        if (isNaN(lat) || isNaN(lng)) {
            setError("Location coordinates are invalid.");
            setIsLoading(false);
            return;
        }

        const categoryLabel = CATEGORIES.find(c => c.key === categoryKey)?.label || categoryKey;

        const placeData = {
            name: { ...fullTranslations.name, en: name.trim() },
            category: categoryLabel,
            category_key: categoryKey,
            description: { ...fullTranslations.description, en: description.trim() },
            image_url: imageUrl.trim() || null,
            location_lat: lat,
            location_lng: lng,
            booking_url: bookingUrl.trim() || null,
            linked_wp_url: linkedWpUrl.trim() || null,
            address: { ...fullTranslations.address, en: address.trim() },
            phone: phone.trim() || null,
            email: email.trim() || null,
            website: website.trim() || null,
            opening_hours: { ...fullTranslations.openingHours, en: openingHours.trim() },
            facebook_url: facebookUrl.trim() || null,
            instagram_url: instagramUrl.trim() || null,
            sub_category: subCategory.trim() || null
        };

        try {
            // Very simple pseudo-uuid check: UUIDs are 36 chars long and contain dashes at specific positions
            // e.g. 550e8400-e29b-41d4-a716-446655440000
            const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (existingPlace && existingPlace.id && !existingPlace.id.startsWith('user_place_') && isUUID(existingPlace.id)) {
                // Update existing DB entry
                const { error: supabaseError } = await supabase
                    .from('places')
                    .update(placeData)
                    .eq('id', existingPlace.id);
                if (supabaseError) throw supabaseError;
            } else {
                // Insert as new DB entry, letting Supabase generate the UUID
                const { error: supabaseError } = await supabase
                    .from('places')
                    .insert([{ ...placeData, original_id: existingPlace?.id }]);
                if (supabaseError) throw supabaseError;
            }
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to save to database");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingPlace || !existingPlace.id || existingPlace.id.startsWith('user_place_')) return;

        const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUUID(existingPlace.id)) {
            alert("This is a built-in map marker and cannot be deleted yet until fully migrated to the database.");
            return;
        }

        if (!window.confirm("Are you sure you want to delete this place?")) return;

        setIsLoading(true);
        try {
            const { error: supabaseError } = await supabase
                .from('places')
                .delete()
                .eq('id', existingPlace.id);
            if (supabaseError) throw supabaseError;
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to delete");
            setIsLoading(false);
        }
    }

    return (
        <div className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-gray-200">
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center flex-shrink-0">
                <h2 className="text-lg font-bold">{existingPlace ? 'Edit Map Marker' : 'Add New Marker'}</h2>
                <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-gray-50">
                {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                <div className="flex gap-2">
                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-1">Latitude</label>
                        <input required type="text" value={latInput} onChange={(e) => {
                            setLatInput(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) onLocationChange({ lat: val, lng: parseFloat(lngInput) || 0 });
                        }} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. 66.54..." />
                    </div>
                    <div className="flex-1">
                        <label className="block text-gray-700 font-bold mb-1">Longitude</label>
                        <input required type="text" value={lngInput} onChange={(e) => {
                            setLngInput(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) onLocationChange({ lat: parseFloat(latInput) || 0, lng: val });
                        }} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. 25.84..." />
                    </div>
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-1">Place Name (English)</label>
                    <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500" placeholder="e.g. Santa's Office" />
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-1">Category</label>
                    <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500">
                        {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                </div>

                {categoryKey === 'Transportation' && (
                    <div className="pt-1">
                        <label className="block text-gray-700 font-bold mb-2 text-xs uppercase tracking-wider opacity-70">Marker Type</label>
                        <div className="flex gap-6 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <label className="flex items-center text-sm cursor-pointer group">
                                <input
                                    type="radio"
                                    name="subCategory"
                                    value="parking"
                                    checked={!subCategory || subCategory === 'parking'}
                                    onChange={(e) => setSubCategory(e.target.value)}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 group-hover:text-blue-600 font-medium">Parking (P)</span>
                            </label>
                            <label className="flex items-center text-sm cursor-pointer group">
                                <input
                                    type="radio"
                                    name="subCategory"
                                    value="bus"
                                    checked={subCategory === 'bus'}
                                    onChange={(e) => setSubCategory(e.target.value)}
                                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 group-hover:text-blue-600 font-medium">Bus Stop</span>
                            </label>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-gray-700 font-bold mb-1">Booking URL / Action Link</label>
                    <input type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className="w-full border rounded p-2 text-xs" placeholder="https://..." />
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-1">Description (English - HTML supported)</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded p-2 min-h-[100px]" placeholder="<p>Some text...</p>"></textarea>
                </div>

                <div>
                    <label className="block text-gray-700 font-bold mb-1">Image URL</label>
                    <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full border rounded p-2 text-xs" placeholder="https://... (Recommended size 800x600)" />
                    {imageUrl && <img src={imageUrl} className="mt-2 w-full h-20 object-cover rounded border" alt="Preview" />}
                </div>

                <div className="border-t pt-2 border-gray-300">
                    <label className="block text-gray-700 font-bold mb-1">Sync from santaclausvillage.info</label>
                    <div className="flex gap-2">
                        <input type="url" value={linkedWpUrl} onChange={(e) => setLinkedWpUrl(e.target.value)} className="flex-1 border rounded p-2 text-xs" placeholder="https://santaclausvillage.info/..." />
                        <button type="button" onClick={handleWpSync} disabled={isSyncing || !linkedWpUrl} className="bg-amber-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-amber-700 disabled:opacity-50">
                            {isSyncing ? '...' : 'Sync'}
                        </button>
                    </div>
                    {syncStatus && (
                        <div className="mt-2 text-[10px] text-amber-600 font-bold animate-pulse flex items-center">
                            <span className="mr-2">⚡</span> {syncStatus}
                        </div>
                    )}
                </div>



                <div className="space-y-4">
                    <div className="border-t pt-4">
                        <label className="block text-gray-700 font-bold mb-1">Opening Hours (English)</label>
                        <textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} className="w-full border rounded p-2 text-xs h-20" placeholder="Mon-Fri 10-17..."></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-bold mb-1">Phone</label>
                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border rounded p-2 text-xs" />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-1">Email</label>
                            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded p-2 text-xs" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-1">Address (English)</label>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full border rounded p-2 text-xs" />
                    </div>

                    <div>
                        <label className="block text-gray-700 font-bold mb-1">Website URL</label>
                        <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full border rounded p-2 text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-gray-700 font-bold mb-1">Facebook</label>
                            <input type="url" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full border rounded p-2 text-xs" />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-1">Instagram</label>
                            <input type="url" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full border rounded p-2 text-xs" />
                        </div>
                    </div>
                </div>
            </form>

            <div className="p-4 bg-white border-t border-gray-200 flex justify-between">
                {existingPlace && !existingPlace.id.startsWith('user_place_') ? (
                    <button type="button" onClick={handleDelete} disabled={isLoading} className="px-4 py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200">Delete</button>
                ) : <div></div>}

                <div className="flex space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50">Save To DB</button>
                </div>
            </div>
        </div>
    );
};

export default AdminMapSettings;
