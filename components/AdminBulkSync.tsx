import React, { useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { syncPlaceFromWp, savePlaceToDb } from '../utils/wpSync';
import { CATEGORIES } from '../constants';

const AdminBulkSync: React.FC = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const [currentName, setCurrentName] = useState('');
    const [status, setStatus] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    const handleStartBulkSync = async () => {
        setShowConfirm(false);
        setIsProcessing(true);
        setStatus("Fetching all places with WP links...");

        try {
            // 1. Fetch all places from database that have a linked_wp_url
            const { data: places, error } = await supabase
                .from('places')
                .select('*')
                .not('linked_wp_url', 'is', null);

            if (error) throw error;
            if (!places || places.length === 0) {
                setStatus("No places found with WordPress links.");
                setIsProcessing(false);
                return;
            }

            setTotal(places.length);
            setProgress(0);

            // 2. Process each place one by one
            for (let i = 0; i < places.length; i++) {
                const place = places[i];
                setCurrentName(place.name?.en || place.name || "Unnamed Place");
                setProgress(i + 1);

                if (!place.linked_wp_url) continue;

                try {
                    setStatus(`Syncing from website...`);
                    // Sync from WP
                    const results = await syncPlaceFromWp(place.linked_wp_url, (s) => setStatus(s));

                    // Format for DB
                    const categoryLabel = CATEGORIES.find(c => c.key === place.category_key)?.label || place.category_key;

                    const placeData = {
                        name: results.name,
                        category: categoryLabel,
                        category_key: place.category_key,
                        description: results.description,
                        image_url: results.imageUrl || null,
                        location_lat: place.location_lat,
                        location_lng: place.location_lng,
                        booking_url: results.website || null,
                        linked_wp_url: place.linked_wp_url,
                        address: results.address,
                        phone: results.phone || null,
                        email: results.email || null,
                        website: results.website || null,
                        opening_hours: results.openingHours,
                        facebook_url: results.facebookUrl || null,
                        instagram_url: results.instagramUrl || null,
                        sub_category: place.sub_category || null
                    };

                    setStatus("Saving to database...");
                    await savePlaceToDb(place.id, placeData);

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
            }, 5000);

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
