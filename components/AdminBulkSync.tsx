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
                    setStatus(`Syncing from website...`);
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
                    // If it's already a UUID, we update by ID.
                    // If it's a KML ID, we check if original_id matches.
                    const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

                    let targetId = place.id;
                    if (!isUUID(place.id)) {
                        const { data: existing } = await supabase
                            .from('places')
                            .select('id')
                            .eq('original_id', place.id)
                            .single();

                        if (existing) {
                            targetId = existing.id;
                        }
                    }

                    await savePlaceToDb(targetId, placeData);

                } catch (err) {
                    console.error(`Failed to sync place ${place.id}:`, err);
                    // Continue to next place even if one fails
                }
            }

            setStatus("Bulk Sync Complete!");
            setTimeout(() => {
                setIsProcessing(false);
                setProgress(0);
                setTotal(0);
                setStatus("");
                window.location.reload(); // Refresh to show new data
            }, 3000);

        } catch (err: any) {
            console.error("Bulk sync error:", err);
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
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 px-4 py-2 border rounded font-bold hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleStartBulkSync}
                            className="flex-1 px-4 py-2 bg-amber-600 text-white rounded font-bold hover:bg-amber-700"
                        >
                            Start Sync
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
