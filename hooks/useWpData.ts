
import { useState, useEffect } from 'react';

export interface WpData {
    title: string;
    content: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    openingHours: string;
    featuredImage: string | null;
    gallery: string[];
    social: {
        facebook?: string;
        instagram?: string;
        tripadvisor?: string;
        youtube?: string;
        tiktok?: string;
        linkedin?: string;
    };
}

export function useWpData(url: string | undefined, lang: string) {
    const [data, setData] = useState<WpData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setData(null);
            return;
        }

        async function fetchWpData() {
            setIsLoading(true);
            setError(null);
            try {
                // Parse URL
                // Example: https://santaclausvillage.info/restaurants/elf-cafe-restaurant/
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/').filter(Boolean);

                if (pathParts.length < 1) {
                    throw new Error("Invalid WordPress URL structure");
                }

                // Skip language prefix if present (e.g., 'fi')
                let typeIndex = 0;
                if (['fi', 'en'].includes(pathParts[0])) {
                    typeIndex = 1;
                }

                if (pathParts.length <= typeIndex + 1) {
                    // It might be a page directly under root or language root
                    // e.g. /info/ or /fi/info/
                }

                const type = pathParts[typeIndex];
                const slug = pathParts[typeIndex + 1] || type; // fallback for pages

                // Map URL types (English and Finnish) to REST API types
                const typeMap: Record<string, string> = {
                    'restaurants': 'restaurants',
                    'ravintolat': 'restaurants',
                    'accommodation': 'accommodation',
                    'majoitus': 'accommodation',
                    'shops': 'shops',
                    'ostokset': 'shops',
                    'activities': 'activities',
                    'aktiviteetit': 'activities',
                    'services': 'services',
                    'palvelut': 'services',
                    'news': 'posts',
                    'uutiset': 'posts'
                };

                const wpType = typeMap[type] || 'pages';
                // Remove &lang filter to be more robust with slugs across translations
                const baseApiUrl = `https://santaclausvillage.info/wp-json/wp/v2/${wpType}?slug=${slug}&_embed`;

                // Add a check for the baseApiUrl before using the proxy
                if (!baseApiUrl) {
                    throw new Error("Failed to construct base API URL.");
                }

                // Use a CORS proxy to avoid browser blocking
                const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseApiUrl)}`;

                console.log(`Fetching WP data for ${slug} (${wpType}) via proxy at: ${apiUrl}`);

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.status}`);
                }

                const results = await response.json();
                console.log(`WP API Response for ${slug}:`, results);

                if (results && results.length > 0) {
                    const post = results[0];
                    const acf = post.acf || {};

                    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null;

                    // Website link from links array or fallback
                    const website = acf.links?.[0]?.url || "";

                    const wpData: WpData = {
                        title: post.title?.rendered || "",
                        content: post.content?.rendered || "",
                        description: acf.description || "",
                        address: acf.address || "",
                        phone: acf.phone || "",
                        email: acf.email || "",
                        website: website,
                        openingHours: acf.opening_hours || "",
                        featuredImage: featuredImage,
                        gallery: (acf.images || []).map((img: any) => img.image_url || img.url).filter(Boolean),
                        social: {
                            facebook: acf.facebook,
                            instagram: acf.instagram,
                            tripadvisor: acf.tripadvisor,
                            youtube: acf.youtube,
                            tiktok: acf.tiktok,
                            linkedin: acf.linkedin
                        }
                    };
                    setData(wpData);
                } else {
                    console.warn(`No WP post found for slug: ${slug} in category: ${wpType}`);
                    setError("No post found for this slug");
                }
            } catch (err: any) {
                console.error("Error fetching WP data:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        fetchWpData();
    }, [url, lang]);

    return { data, isLoading, error };
}
