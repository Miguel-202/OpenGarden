import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en';
import es from './es';

const LANG_KEY = '@open_garden_lang';
const deviceLang = getLocales()?.[0]?.languageCode ?? 'en';

i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources: {
        en: { translation: en },
        es: { translation: es },
    },
    lng: deviceLang === 'es' ? 'es' : 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

AsyncStorage.getItem(LANG_KEY).then(saved => {
    if (saved === 'en' || saved === 'es') {
        i18n.changeLanguage(saved);
    }
}).catch(() => {});

export async function setLanguage(lang: 'en' | 'es') {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
}

export default i18n;
