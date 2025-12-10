// Centralized translations for the entire application
export type AppLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml';

export interface Translations {
    // Common
    common: {
        save: string;
        cancel: string;
        close: string;
        delete: string;
        edit: string;
        loading: string;
        search: string;
        filter: string;
        sort: string;
        yes: string;
        no: string;
        ok: string;
        back: string;
        next: string;
        prev: string;
        submit: string;
        upload: string;
        download: string;
        share: string;
        copy: string;
        copied: string;
    };

    // Media Viewer
    mediaViewer: {
        like: string;
        pick: string;
        private: string;
        speed: string;
        share: string;
        trim: string;
        save: string;
        cancel: string;
        mute: string;
        unmute: string;
        download: string;
        slideshow: string;
        stopSlideshow: string;
        zoomIn: string;
        zoomOut: string;
        next: string;
        prev: string;
        close: string;
        loading: string;
        info: string;
        details: string;
        unlock: string;
    };

    // Albums
    albums: {
        title: string;
        createNew: string;
        noAlbums: string;
        photos: string;
        videos: string;
        favorite: string;
        shared: string;
        private: string;
    };

    // Clients
    clients: {
        title: string;
        addClient: string;
        noClients: string;
        email: string;
        phone: string;
        address: string;
    };

    // Settings
    settings: {
        title: string;
        profile: string;
        branding: string;
        integrations: string;
        policies: string;
    };
}

export const translations: Record<AppLanguage, Translations> = {
    en: {
        common: {
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            delete: 'Delete',
            edit: 'Edit',
            loading: 'Loading...',
            search: 'Search',
            filter: 'Filter',
            sort: 'Sort',
            yes: 'Yes',
            no: 'No',
            ok: 'OK',
            back: 'Back',
            next: 'Next',
            prev: 'Previous',
            submit: 'Submit',
            upload: 'Upload',
            download: 'Download',
            share: 'Share',
            copy: 'Copy',
            copied: 'Copied!',
        },
        mediaViewer: {
            like: 'Like',
            pick: 'Select',
            private: 'Private',
            speed: 'Speed',
            share: 'Share',
            trim: 'Trim',
            save: 'Save',
            cancel: 'Cancel',
            mute: 'Mute',
            unmute: 'Unmute',
            download: 'Download',
            slideshow: 'Slideshow',
            stopSlideshow: 'Stop Slideshow',
            zoomIn: 'Zoom In',
            zoomOut: 'Zoom Out',
            next: 'Next Item',
            prev: 'Previous Item',
            close: 'Close Viewer',
            loading: 'Loading media...',
            info: 'Info',
            details: 'Details',
            unlock: 'Unlock Content',
        },
        albums: {
            title: 'Albums',
            createNew: 'Create Album',
            noAlbums: 'No albums found',
            photos: 'Photos',
            videos: 'Videos',
            favorite: 'Favorite',
            shared: 'Shared',
            private: 'Private',
        },
        clients: {
            title: 'Clients',
            addClient: 'Add Client',
            noClients: 'No clients found',
            email: 'Email',
            phone: 'Phone',
            address: 'Address',
        },
        settings: {
            title: 'Settings',
            profile: 'Profile',
            branding: 'Branding',
            integrations: 'Integrations',
            policies: 'Policies',
        },
    },
    hi: {
        common: {
            save: 'सहेजें',
            cancel: 'रद्द करें',
            close: 'बंद करें',
            delete: 'हटाएं',
            edit: 'संपादित करें',
            loading: 'लोड हो रहा है...',
            search: 'खोजें',
            filter: 'फ़िल्टर',
            sort: 'क्रमबद्ध करें',
            yes: 'हां',
            no: 'नहीं',
            ok: 'ठीक है',
            back: 'वापस',
            next: 'अगला',
            prev: 'पिछला',
            submit: 'जमा करें',
            upload: 'अपलोड',
            download: 'डाउनलोड',
            share: 'शेयर',
            copy: 'कॉपी',
            copied: 'कॉपी हो गया!',
        },
        mediaViewer: {
            like: 'पसंद करें',
            pick: 'चुनें',
            private: 'निजी',
            speed: 'गति',
            share: 'शेयर',
            trim: 'काटें',
            save: 'सहेजें',
            cancel: 'रद्द करें',
            mute: 'म्यूट',
            unmute: 'अनम्यूट',
            download: 'डाउनलोड',
            slideshow: 'स्लाइडशो',
            stopSlideshow: 'स्लाइडशो रोकें',
            zoomIn: 'ज़ूम इन',
            zoomOut: 'ज़ूम आउट',
            next: 'अगला',
            prev: 'पिछला',
            close: 'बंद करें',
            loading: 'लोड हो रहा है...',
            info: 'जानकारी',
            details: 'विवरण',
            unlock: 'अनलॉक करें',
        },
        albums: {
            title: 'एल्बम',
            createNew: 'एल्बम बनाएं',
            noAlbums: 'कोई एल्बम नहीं मिला',
            photos: 'फ़ोटो',
            videos: 'वीडियो',
            favorite: 'पसंदीदा',
            shared: 'साझा किया गया',
            private: 'निजी',
        },
        clients: {
            title: 'ग्राहक',
            addClient: 'ग्राहक जोड़ें',
            noClients: 'कोई ग्राहक नहीं मिला',
            email: 'ईमेल',
            phone: 'फ़ोन',
            address: 'पता',
        },
        settings: {
            title: 'सेटिंग्स',
            profile: 'प्रोफ़ाइल',
            branding: 'ब्रांडिंग',
            integrations: 'एकीकरण',
            policies: 'नीतियां',
        },
    },
    te: {
        common: {
            save: 'సేవ్',
            cancel: 'రద్దు',
            close: 'మూసివేయి',
            delete: 'తొలగించు',
            edit: 'సవరించు',
            loading: 'లోడ్ అవుతోంది...',
            search: 'వెతకండి',
            filter: 'ఫిల్టర్',
            sort: 'క్రమబద్ధీకరించు',
            yes: 'అవును',
            no: 'కాదు',
            ok: 'సరే',
            back: 'వెనుకకు',
            next: 'తరువాత',
            prev: 'మునుపటి',
            submit: 'సమర్పించు',
            upload: 'అప్‌లోడ్',
            download: 'డౌన్‌లోడ్',
            share: 'భాగస్వామ్యం',
            copy: 'కాపీ',
            copied: 'కాపీ అయింది!',
        },
        mediaViewer: {
            like: 'ఇష్టపడు',
            pick: 'ఎంచుకోండి',
            private: 'ప్రైవేట్',
            speed: 'వేగం',
            share: 'భాగస్వామ్యం',
            trim: 'కత్తిరించు',
            save: 'సేవ్',
            cancel: 'రద్దు',
            mute: 'మ్యూట్',
            unmute: 'అన్‌మ్యూట్',
            download: 'డౌన్‌లోడ్',
            slideshow: 'స్లైడ్‌షో',
            stopSlideshow: 'స్లైడ్‌షో ఆపు',
            zoomIn: 'జూమ్ ఇన్',
            zoomOut: 'జూమ్ అవుట్',
            next: 'తరువాత',
            prev: 'మునుపటి',
            close: 'మూసివేయి',
            loading: 'లోడ్ అవుతోంది...',
            info: 'సమాచారం',
            details: 'వివరాలు',
            unlock: 'అన్‌లాక్',
        },
        albums: {
            title: 'ఆల్బమ్‌లు',
            createNew: 'ఆల్బమ్ సృష్టించు',
            noAlbums: 'ఆల్బమ్‌లు కనుగొనబడలేదు',
            photos: 'ఫోటోలు',
            videos: 'వీడియోలు',
            favorite: 'ఇష్టమైనవి',
            shared: 'భాగస్వామ్యం చేయబడింది',
            private: 'ప్రైవేట్',
        },
        clients: {
            title: 'క్లయింట్లు',
            addClient: 'క్లయింట్ జోడించు',
            noClients: 'క్లయింట్లు కనుగొనబడలేదు',
            email: 'ఇమెయిల్',
            phone: 'ఫోన్',
            address: 'చిరునామా',
        },
        settings: {
            title: 'సెట్టింగ్‌లు',
            profile: 'ప్రొఫైల్',
            branding: 'బ్రాండింగ్',
            integrations: 'ఇంటిగ్రేషన్స్',
            policies: 'విధానాలు',
        },
    },
    ta: {
        common: {
            save: 'சேமி',
            cancel: 'ரத்து',
            close: 'மூடு',
            delete: 'நீக்கு',
            edit: 'திருத்து',
            loading: 'ஏற்றுகிறது...',
            search: 'தேடு',
            filter: 'வடிகட்டு',
            sort: 'வரிசைப்படுத்து',
            yes: 'ஆம்',
            no: 'இல்லை',
            ok: 'சரி',
            back: 'பின்',
            next: 'அடுத்தது',
            prev: 'முந்தைய',
            submit: 'சமர்ப்பி',
            upload: 'பதிவேற்று',
            download: 'பதிவிறக்கு',
            share: 'பகிர்',
            copy: 'நகலெடு',
            copied: 'நகலெடுக்கப்பட்டது!',
        },
        mediaViewer: {
            like: 'விருப்பம்',
            pick: 'தேர்ந்தெடு',
            private: 'தனிப்பட்ட',
            speed: 'வேகம்',
            share: 'பகிர்',
            trim: 'வெட்டு',
            save: 'சேமி',
            cancel: 'ரத்து',
            mute: 'முடக்கு',
            unmute: 'ஒலி',
            download: 'பதிவிறக்கு',
            slideshow: 'ஸ்லைடுஷோ',
            stopSlideshow: 'நிறுத்து',
            zoomIn: 'பெரிதாக்கு',
            zoomOut: 'சிறிதாக்கு',
            next: 'அடுத்தது',
            prev: 'முந்தைய',
            close: 'மூடு',
            loading: 'ஏற்றுகிறது...',
            info: 'தகவல்',
            details: 'விவரங்கள்',
            unlock: 'திற',
        },
        albums: {
            title: 'ஆல்பங்கள்',
            createNew: 'ஆல்பம் உருவாக்கு',
            noAlbums: 'ஆல்பங்கள் இல்லை',
            photos: 'புகைப்படங்கள்',
            videos: 'வீடியோக்கள்',
            favorite: 'விருப்பமானவை',
            shared: 'பகிரப்பட்டது',
            private: 'தனிப்பட்ட',
        },
        clients: {
            title: 'வாடிக்கையாளர்கள்',
            addClient: 'வாடிக்கையாளர் சேர்',
            noClients: 'வாடிக்கையாளர்கள் இல்லை',
            email: 'மின்னஞ்சல்',
            phone: 'தொலைபேசி',
            address: 'முகவரி',
        },
        settings: {
            title: 'அமைப்புகள்',
            profile: 'சுயவிவரம்',
            branding: 'பிராண்டிங்',
            integrations: 'ஒருங்கிணைப்புகள்',
            policies: 'கொள்கைகள்',
        },
    },
    kn: {
        common: {
            save: 'ಉಳಿಸಿ',
            cancel: 'ರದ್ದು',
            close: 'ಮುಚ್ಚಿ',
            delete: 'ಅಳಿಸಿ',
            edit: 'ಸಂಪಾದಿಸಿ',
            loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
            search: 'ಹುಡುಕಿ',
            filter: 'ಫಿಲ್ಟರ್',
            sort: 'ವಿಂಗಡಿಸಿ',
            yes: 'ಹೌದು',
            no: 'ಇಲ್ಲ',
            ok: 'ಸರಿ',
            back: 'ಹಿಂದೆ',
            next: 'ಮುಂದಿನ',
            prev: 'ಹಿಂದಿನ',
            submit: 'ಸಲ್ಲಿಸಿ',
            upload: 'ಅಪ್‌ಲೋಡ್',
            download: 'ಡೌನ್‌ಲೋಡ್',
            share: 'ಹಂಚಿಕೊಳ್ಳಿ',
            copy: 'ನಕಲಿಸಿ',
            copied: 'ನಕಲಿಸಲಾಗಿದೆ!',
        },
        mediaViewer: {
            like: 'ಇಷ್ಟ',
            pick: 'ಆರಿಸಿ',
            private: 'ಖಾಸಗಿ',
            speed: 'ವೇಗ',
            share: 'ಹಂಚಿಕೊಳ್ಳಿ',
            trim: 'ಕತ್ತರಿಸಿ',
            save: 'ಉಳಿಸಿ',
            cancel: 'ರದ್ದು',
            mute: 'ಮ್ಯೂಟ್',
            unmute: 'ಅನ್‌ಮ್ಯೂಟ್',
            download: 'ಡೌನ್‌ಲೋಡ್',
            slideshow: 'ಸ್ಲೈಡ್‌ಶೋ',
            stopSlideshow: 'ನಿಲ್ಲಿಸು',
            zoomIn: 'ಹಿಗ್ಗಿಸು',
            zoomOut: 'ಕುಗ್ಗಿಸು',
            next: 'ಮುಂದಿನ',
            prev: 'ಹಿಂದಿನ',
            close: 'ಮುಚ್ಚಿ',
            loading: 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
            info: 'ಮಾಹಿತಿ',
            details: 'ವಿವರಗಳು',
            unlock: 'ಅನ್‌ಲಾಕ್',
        },
        albums: {
            title: 'ಆಲ್ಬಮ್‌ಗಳು',
            createNew: 'ಆಲ್ಬಮ್ ರಚಿಸಿ',
            noAlbums: 'ಆಲ್ಬಮ್‌ಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
            photos: 'ಫೋಟೋಗಳು',
            videos: 'ವೀಡಿಯೊಗಳು',
            favorite: 'ಮೆಚ್ಚಿನವು',
            shared: 'ಹಂಚಿಕೊಂಡಿದೆ',
            private: 'ಖಾಸಗಿ',
        },
        clients: {
            title: 'ಗ್ರಾಹಕರು',
            addClient: 'ಗ್ರಾಹಕ ಸೇರಿಸಿ',
            noClients: 'ಗ್ರಾಹಕರು ಕಂಡುಬಂದಿಲ್ಲ',
            email: 'ಇಮೇಲ್',
            phone: 'ಫೋನ್',
            address: 'ವಿಳಾಸ',
        },
        settings: {
            title: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
            profile: 'ಪ್ರೊಫೈಲ್',
            branding: 'ಬ್ರಾಂಡಿಂಗ್',
            integrations: 'ಏಕೀಕರಣಗಳು',
            policies: 'ನೀತಿಗಳು',
        },
    },
    ml: {
        common: {
            save: 'സേവ്',
            cancel: 'റദ്ദാക്കുക',
            close: 'അടയ്ക്കുക',
            delete: 'ഇല്ലാതാക്കുക',
            edit: 'എഡിറ്റ്',
            loading: 'ലോഡുചെയ്യുന്നു...',
            search: 'തിരയുക',
            filter: 'ഫിൽട്ടർ',
            sort: 'അടുക്കുക',
            yes: 'അതെ',
            no: 'ഇല്ല',
            ok: 'ശരി',
            back: 'തിരികെ',
            next: 'അടുത്തത്',
            prev: 'മുമ്പുള്ള',
            submit: 'സമർപ്പിക്കുക',
            upload: 'അപ്‌ലോഡ്',
            download: 'ഡൗൺലോഡ്',
            share: 'പങ്കിടുക',
            copy: 'പകർത്തുക',
            copied: 'പകർത്തി!',
        },
        mediaViewer: {
            like: 'ഇഷ്ടം',
            pick: 'തിരഞ്ഞെടുക്കുക',
            private: 'സ്വകാര്യം',
            speed: 'വേഗത',
            share: 'പങ്കിടുക',
            trim: 'ട്രിം',
            save: 'സേവ്',
            cancel: 'റദ്ദാക്കുക',
            mute: 'നിശബ്ദമാക്കുക',
            unmute: 'ശബ്ദം',
            download: 'ഡൗൺലോഡ്',
            slideshow: 'സ്ലൈഡ്ഷോ',
            stopSlideshow: 'നിർത്തുക',
            zoomIn: 'വലുതാക്കുക',
            zoomOut: 'ചെറുതാക്കുക',
            next: 'അടുത്തത്',
            prev: 'മുമ്പുള്ള',
            close: 'അടയ്ക്കുക',
            loading: 'ലോഡുചെയ്യുന്നു...',
            info: 'വിവരം',
            details: 'വിശദാംശങ്ങൾ',
            unlock: 'തുറക്കുക',
        },
        albums: {
            title: 'ആൽബങ്ങൾ',
            createNew: 'ആൽബം സൃഷ്ടിക്കുക',
            noAlbums: 'ആൽബങ്ങൾ കണ്ടെത്തിയില്ല',
            photos: 'ഫോട്ടോകൾ',
            videos: 'വീഡിയോകൾ',
            favorite: 'പ്രിയപ്പെട്ടവ',
            shared: 'പങ്കിട്ടു',
            private: 'സ്വകാര്യം',
        },
        clients: {
            title: 'ക്ലയന്റുകൾ',
            addClient: 'ക്ലയന്റ് ചേർക്കുക',
            noClients: 'ക്ലയന്റുകൾ കണ്ടെത്തിയില്ല',
            email: 'ഇമെയിൽ',
            phone: 'ഫോൺ',
            address: 'വിലാസം',
        },
        settings: {
            title: 'ക്രമീകരണങ്ങൾ',
            profile: 'പ്രൊഫൈൽ',
            branding: 'ബ്രാൻഡിംഗ്',
            integrations: 'സംയോജനങ്ങൾ',
            policies: 'നയങ്ങൾ',
        },
    },
};

// Hook to use translations
export function useTranslations(language: AppLanguage) {
    return translations[language];
}

// Helper to get specific section translations with proper typing
export function getTranslations<K extends keyof Translations>(
    language: AppLanguage,
    section: K
): Translations[K] {
    return translations[language][section];
}
