import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { syncPlaceFromWp, savePlaceToDb } from '../utils/wpSync';
import { CATEGORIES } from '../constants';
import { Place } from '../types';

interface AdminBulkSyncProps {
    allPlaces: Place[];
}

const AdminBulkSync: React.FC<AdminBulkSyncProps> = ({ allPlaces }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [currentName, setCurrentName] = useState('');
    const [status, setStatus] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleStartBulkSync = async () => {
        setShowConfirm(false);
        setIsProcessing(true);
        setStatus("Filtering places with WordPress links...");

        try {
            // 1. Filter all places (KML + DB) that have a linkedWpUrl
            const placesToSync = allPlaces.filter(p => p.linkedWpUrl && p.linkedWpUrl.trim() !== "");

            if (placesToSync.length === 0) {
                setStatus("No places found with WordPress links.");
                setTimeout(() => setIsProcessing(false), 3000);
                return;
            }

            setTotal(placesToSync.length);
            setProgress(0);

            // 2. Process each place one by one
            for (let i = 0; i < placesToSync.length; i++) {
                const place = placesToSync[i];
                const displayName = typeof place.name === 'string' ? place.name : (place.name?.fi || place.name?.en || "Unnamed Place");
                setCurrentName(displayName);
                setProgress(i + 1);

                try {
                    setStatus(`Syncing ${displayName} from website...`);
                    // Sync from WP
                    const results = await syncPlaceFromWp(place.linkedWpUrl!, (s) => setStatus(s));

                    // Format for DB
                    const categoryLabel = CATEGORIES.find(c => c.key === place.categoryKey)?.label || place.categoryKey;

                    const placeData = {
                        name: results.name,
                        category: categoryLabel,
                        category_key: place.categoryKey,
                        description: results.description,
                        image_url: results.imageUrl || null,
                        location_lat: place.location.lat,
                        location_lng: place.location.lng,
                        booking_url: results.website || null,
                        linked_wp_url: place.linkedWpUrl,
                        address: results.address,
                        phone: results.phone || null,
                        email: results.email || null,
                        website: results.website || null,
                        opening_hours: results.openingHours,
                        facebook_url: results.facebookUrl || null,
                        instagram_url: results.instagramUrl || null,
                        sub_category: place.subCategory || null
                    };

                    setStatus("Saving to database...");

                    // Check if this KML place already exists in DB to avoid duplicates
                    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                    let targetId = place.id;
                    if (!isUUID(place.id)) {
                        const { data: existing } = await supabase
                            .from('places')
                            .select('id')
                            .eq('original_id', place.id)
                            .maybeSingle(); // maybeSingle instead of single() to avoid error if 0

                        if (existing) {
                            targetId = existing.id;
                        }
                    }

                    await savePlaceToDb(targetId, placeData);

                } catch (err) {
                    console.error(`Failed to sync place ${place.id}:`, err);
                }
            }

            setStatus("Bulk Sync Complete!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setTotal(0);
                setStatus("");
                window.location.reload();
            }, 3000);

        } catch (err: any) {
            console.error("Bulk sync error:", err);
            setStatus(`Error: ${err.message}`);
            setTimeout(() => setIsProcessing(false), 5000);
        }
    };

    const handleMigrateKmlToDb = async () => {
        setShowConfirm(false);
        setIsProcessing(true);
        setStatus("Preparing KML migration...");

        try {
            // Filter only non-UUID places (those from KML)
            const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const kmlPlaces = allPlaces.filter(p => !isUUID(p.id) && !p.id.startsWith('user_place_'));

            if (kmlPlaces.length === 0) {
                setStatus("No KML markers found to migrate.");
                setTimeout(() => setIsProcessing(false), 3000);
                return;
            }

            setTotal(kmlPlaces.length);
            setProgress(0);

            for (let i = 0; i < kmlPlaces.length; i++) {
                const place = kmlPlaces[i];
                const displayName = typeof place.name === 'string' ? place.name : (place.name?.en || place.name?.fi || "Unnamed");
                setCurrentName(displayName);
                setProgress(i + 1);

                try {
                    // Check if already in DB
                    const { data: existing } = await supabase
                        .from('places')
                        .select('id')
                        .eq('original_id', place.id)
                        .maybeSingle();

                    if (!existing) {
                        setStatus(`Importing ${displayName} to DB...`);
                        const categoryLabel = CATEGORIES.find(c => c.key === place.categoryKey)?.label || place.categoryKey;

                        const placeData = {
                            name: place.name,
                            category: categoryLabel,
                            category_key: place.categoryKey,
                            description: place.description,
                            image_url: place.imageUrl || null,
                            location_lat: place.location.lat,
                            location_lng: place.location.lng,
                            booking_url: place.bookingUrl || null,
                            linked_wp_url: place.linkedWpUrl || null,
                            address: place.address || {},
                            phone: place.phone || null,
                            email: place.email || null,
                            website: place.website || null,
                            opening_hours: place.openingHours || {},
                            facebook_url: place.facebookUrl || null,
                            instagram_url: place.instagramUrl || null,
                            sub_category: place.subCategory || null,
                            original_id: place.id,
                            original_category_key: place.categoryKey
                        };

                        const { error: insertError } = await supabase.from('places').insert([placeData]);
                        if (insertError) throw insertError;
                    }
                } catch (err) {
                    console.error(`Failed to migrate ${place.id}:`, err);
                }
            }

            setStatus("KML Migration Complete!");
            setTimeout(() => {
                setIsProcessing(false);
                window.location.reload();
            }, 3000);

        } catch (err: any) {
            console.error("Migration error:", err);
            setStatus(`Error: ${err.message}`);
            setTimeout(() => setIsProcessing(false), 5000);
        }
    };

    if (!isProcessing && !showConfirm) {
        return (
            <div className="fixed bottom-20 left-4 z-[1000]">
                <button
                    onClick={() => setShowConfirm(true)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg font-bold hover:bg-amber-700 transition-all flex items-center space-x-2 border-2 border-white"
                >
                    <span className="text-xl">🔄</span>
                    <span>Bulk Sync All</span>
                </button>
            </div>
        );
    }

    if (showConfirm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[3000] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                    <h3 className="text-xl font-bold mb-2">Sync All Data?</h3>
                    <p className="text-gray-600 mb-6 text-sm">
                        This will go through every place on the map and update its info from the website.
                        It might take several minutes.
                    </p>
                    <div className="flex flex-col space-y-3">
                        <button
                            onClick={handleStartBulkSync}
                            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 shadow-md"
                        >
                            Sync WP Data (Updates existing)
                        </button>
                        <button
                            onClick={handleMigrateKmlToDb}
                            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md"
                        >
                            Migrate KML to DB (First time setup)
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-20 left-4 z-[1000] bg-white rounded-lg shadow-2xl border-2 border-amber-500 overflow-hidden w-64">
            <div className="bg-amber-500 p-2 text-white font-bold text-xs flex justify-between items-center">
                <span>🔄 GLOBAL SYNC IN PROGRESS</span>
                <span>{progress}/{total}</span>
            </div>
            <div className="p-3">
                <div className="font-bold text-gray-800 truncate mb-1 text-sm">{currentName}</div>
                <div className="text-[10px] text-gray-500 italic mb-2 h-4 truncate">
                    {status}
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-amber-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${(progress / total) * 100}%` }}
                    ></div>
                </div>

                <div className="mt-3 text-[9px] text-gray-400 text-center">
                    Please keep this window open until finished.
                </div>
            </div>
        </div>
    );
};

export default AdminBulkSync;
