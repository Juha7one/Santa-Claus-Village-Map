# 🎅 Santa Claus Village Interactive Map

An ultra-premium, mobile-first interactive map designed for visitors of the Santa Claus Village in Rovaniemi, Finland. This application provides a seamless navigation experience, real-time routing, and a comprehensive directory of services within the Arctic Circle.

🚀 **Live App**: [Santa Claus Village Map](https://merry-pastelito-8b7918.netlify.app/?admin=true)

---

## 💡 The Vision
The app was built to solve the "Arctic navigational challenge." Local KML data and business locations are merged into a unified, high-performance interface. The core philosophy centers on **simplicity**, **aesthetics**, and **localized utility**.

### Key Ideas:
- **Mobile First**: Designed to feel like a native app on iOS and Android.
- **Smart Routing**: Combines road data with walking paths to give users the most accurate "Go There" experience.
- **Category Focus**: Instantly filter for Food, Shopping, Accommodation, Activities, and more.
- **Village vs. All View**: A unique toggle to focus strictly on the village heart or see the broader Arctic Circle surroundings.

---

## 🎨 User Interface (UI)
The UI features a **"Santa Red" & Amber** theme, reflecting the warmth of Finnish Christmas.

- **Dynamic Markers**: Custom icons for different business categories.
- **Status Indicators**: Real-time "Open/Closed" tags on pins and in popups.
- **Rich Popups**: Detailed views including images, descriptions, phone numbers, and direct booking links.
- **Glassmorphism**: Modern, slightly transparent UI elements for a premium feel.
- **Search System**: A lightning-fast, localized search bar with live result zooming.

---

## 🌍 Multilingual Support (i18n)
The app is fully internationalized to cater to global visitors:
- **Languages**: English, Finnish, French, German, Spanish, Chinese, and Japanese.
- **Auto-Detection**: Automatically detects browser language for an "instant-in" experience.
- **Localized Data**: Business names, descriptions, and opening hours are stored as JSONB to support per-language precision.

---

## 🛠 Tech Stack
Built with modern web technologies for speed and reliability:

- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Map Engine**: [Leaflet](https://leafletjs.com/) with [React-Leaflet](https://react-leaflet.js.org/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL with JSONB support)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Translations**: [i18next](https://www.i18next.com/)
- **Deployment**: [Netlify](https://www.netlify.com/)

---

## 🔐 Admin & Data Management
The app includes a sophisticated hidden admin interface for real-time updates:

- **Direct Map Management**: Right-click (or long-press) anywhere on the map to add or edit pins.
- **Database Sync**: Changes are instantly saved to Supabase and visible to all users.
- **Status Control**: Admins can toggle "Open/Closed" status for businesses individually.
- **KML Integration**: Synchronizes static geographic data from KML files with the dynamic SQL database.

---

## 🗺️ Specialized Map Logic
- **Arctic Circle Alignment**: The map correctly renders the Arctic Circle line with precise 339° tilting and beautiful edge-transparency gradients.
- **Focus Bounds**: The "Eye" toggle uses geographic algorithms to perfectly fit the village pins into the viewport, removing excess dead space from the KML roads.

---

## 🛠️ Development

### Local Setup
1. Clone the repository.
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

### Environment Variables
Configure your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

*Hand-crafted for the magic of the Arctic Circle.* ❄️✨
