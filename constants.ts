

export const getCategoryColor = (categoryKey: string): string => {
    // Palette chosen for high contrast and distinction to aid color blindness (CVD)
    // avoiding reliance solely on hue, using deep values for visibility against light maps.
    switch (categoryKey) {
        // KML categories
        case 'Attractions': return '#D50000';     // Vivid Red (High importance)
        case 'Accommodation': return '#2E7D32';   // Green (Natural, distinct)
        case 'Food-And-Drink': return '#E65100';  // Dark Orange (Warm, distinct from Red)
        case 'Shopping': return '#0091EA';        // Vivid Light Blue (Distinct from Purple/Teal)
        case 'Transportation': return '#0D47A1';  // Darkish Blue
        case 'Facilities': return '#4E342E';      // Dark Brown (Earth tone, distinct from Orange)
        case 'Paths': return '#5D4037';           // Matching brown for paths
        
        // User place categories
        case 'My Stay': return '#2E7D32';         // Green (Matching Accommodation)
        case 'My Car': return '#0D47A1';          // Darkish Blue (matching Transportation)
        case 'Love this': return '#FF4081';       // Lighter Vivid Pink (Distinct from Red)
        
        default: return '#616161';                // Generic Grey
    }
};
