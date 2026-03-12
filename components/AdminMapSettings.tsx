import React, { useState, useEffect } from 'react';
import { CATEGORIES, getCategoryColor } from '../constants';
import { getLangString } from '../utils/langUtils';
import { LocalizedString, Place, Coordinates } from '../types';

import { supabase } from '../src/lib/supabase';
import { syncPlaceFromWp, savePlaceToDb, translateText } from '../utils/wpSync';

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
            setBookingUrl(existingPlace.bookingUrl || '');
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
        if (!linkedWpUrl) return;
        setIsSyncing(true);
        setError(null);
        setSyncStatus("Initializing global sync...");

        try {
            const results = await syncPlaceFromWp(linkedWpUrl, (status) => setSyncStatus(status));

            // Update State
            setName(results.name.en);
            setDescription(results.description.en);
            setAddress(results.address.en);
            setOpeningHours(results.openingHours.en);
            setImageUrl(results.imageUrl);
            setPhone(results.phone);
            setEmail(results.email);
            setWebsite(results.website);
            setBookingUrl(results.website);
            setFacebookUrl(results.facebookUrl);
            setInstagramUrl(results.instagramUrl);
            setFullTranslations({
                name: results.name,
                description: results.description,
                address: results.address,
                openingHours: results.openingHours
            });

            setSyncStatus("Global Sync Complete!");

            // Automatically save to database after sync
            const categoryLabel = CATEGORIES.find(c => c.key === categoryKey)?.label || categoryKey;

            await saveToDatabase({
                name: results.name,
                category: categoryLabel,
                category_key: categoryKey,
                description: results.description,
                image_url: results.imageUrl || null,
                location_lat: parseFloat(latInput),
                location_lng: parseFloat(lngInput),
                booking_url: results.website.trim() || null,
                linked_wp_url: linkedWpUrl.trim() || null,
                address: results.address,
                phone: results.phone.trim() || null,
                email: results.email.trim() || null,
                website: results.website.trim() || null,
                opening_hours: results.openingHours,
                facebook_url: results.facebookUrl.trim() || null,
                instagram_url: results.instagramUrl.trim() || null,
                sub_category: subCategory.trim() || null
            });

            setTimeout(() => setSyncStatus(null), 3000);
        } catch (err: any) {
            console.error("Sync error:", err);
            setError(`Sync failed: ${err.message}`);
            setSyncStatus(null);
        } finally {
            setIsSyncing(false);
        }
    };

    const saveToDatabase = async (customPlaceData?: any) => {
        setIsLoading(true);
        setError(null);

        try {
            const lat = parseFloat(latInput);
            const lng = parseFloat(lngInput);

            if (isNaN(lat) || isNaN(lng)) {
                throw new Error("Location coordinates are invalid.");
            }

            const categoryLabel = CATEGORIES.find(c => c.key === categoryKey)?.label || categoryKey;

            const placeData = customPlaceData || {
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

            if (existingPlace && existingPlace.id && !existingPlace.id.startsWith('user_place_')) {
                await savePlaceToDb(existingPlace.id, placeData);
            } else {
                await savePlaceToDb(null, { ...placeData, original_id: existingPlace?.id });
            }
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to save to database");
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveToDatabase();
    };

    const handleDelete = async () => {
        if (!existingPlace || !existingPlace.id || existingPlace.id.startsWith('user_place_')) return;

        if (!window.confirm("Are you sure you want to delete this place?")) return;

        setIsLoading(true);
        try {
            const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

            if (isUUID(existingPlace.id)) {
                // For DB records, we delete them. 
                // Note: If this was an override for a KML point, the original KML point will reappear.
                const { error: supabaseError } = await supabase
                    .from('places')
                    .delete()
                    .eq('id', existingPlace.id);
                if (supabaseError) throw supabaseError;
            } else {
                // For KML/Built-in markers, we need to create a record in DB to 'hide' them.
                // This requires an 'is_deleted' column. Let's try to upsert as an override.
                const { error: supabaseError } = await supabase
                    .from('places')
                    .insert([{
                        original_id: existingPlace.id,
                        is_deleted: true,
                        name: { en: name }, // Placeholder to satisfy potential and constraints
                        category_key: categoryKey,
                        location_lat: parseFloat(latInput),
                        location_lng: parseFloat(lngInput)
                    }]);
                if (supabaseError) throw supabaseError;
            }
            onSaveSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to delete");
            setIsLoading(false);
        }
    }

    return (
        <div className="absolute top-0 right-0 h-full w-full sm:w-80 bg-white shadow-xl z-[1200] flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-gray-200">
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
                    <div className="space-y-4 pt-1">
                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-xs uppercase tracking-wider opacity-70">Marker Type</label>
                            <div className="flex gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <label className="flex items-center text-sm cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="markerType"
                                        checked={!subCategory || subCategory.startsWith('parking')}
                                        onChange={() => {
                                            const currentZone = subCategory.includes('-') ? subCategory.split('-')[1] : '';
                                            setSubCategory('parking' + (currentZone ? '-' + currentZone : ''));
                                        }}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-blue-600 font-medium">Parking (P)</span>
                                </label>
                                <label className="flex items-center text-sm cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="markerType"
                                        checked={subCategory.startsWith('bus')}
                                        onChange={() => {
                                            const currentZone = subCategory.includes('-') ? subCategory.split('-')[1] : '';
                                            setSubCategory('bus' + (currentZone ? '-' + currentZone : ''));
                                        }}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-blue-600 font-medium">Bus Stop</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 font-bold mb-2 text-xs uppercase tracking-wider opacity-70">Routing Access Zone</label>
                            <div className="grid grid-cols-1 gap-2 bg-white p-3 rounded-lg border border-gray-200 shadow-sm transition-all">
                                <label className="flex items-center text-sm cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="accessZone"
                                        checked={!subCategory.includes('-')}
                                        onChange={() => {
                                            const type = subCategory.split('-')[0] || 'parking';
                                            setSubCategory(type);
                                        }}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-blue-600 font-medium">None (Global access)</span>
                                </label>
                                <label className="flex items-center text-sm cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="accessZone"
                                        checked={subCategory.endsWith('-south')}
                                        onChange={() => {
                                            const type = subCategory.split('-')[0] || 'parking';
                                            setSubCategory(`${type}-south`);
                                        }}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-blue-600 font-medium text-blue-700">South Zone (via Myllymäentie)</span>
                                </label>
                                <label className="flex items-center text-sm cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="accessZone"
                                        checked={subCategory.endsWith('-north')}
                                        onChange={() => {
                                            const type = subCategory.split('-')[0] || 'parking';
                                            setSubCategory(`${type}-north`);
                                        }}
                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-gray-700 group-hover:text-blue-600 font-medium text-amber-700">North Zone (via Pukinpolku)</span>
                                </label>
                            </div>
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
