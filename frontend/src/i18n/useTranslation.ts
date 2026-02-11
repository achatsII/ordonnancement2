import { useLanguage } from '@/contexts/LanguageContext';
import { translations, Locale, Namespace } from './config';

export function useTranslation(namespace: Namespace = 'common') {
    const { language } = useLanguage();

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language as Locale]?.[namespace];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return { t, language };
}
