import fr_common from './locales/fr/common.json';
import fr_schedule from './locales/fr/schedule.json';
import en_common from './locales/en/common.json';
import en_schedule from './locales/en/schedule.json';
import es_common from './locales/es/common.json';
import es_schedule from './locales/es/schedule.json';

export const translations = {
    fr: {
        common: fr_common,
        schedule: fr_schedule,
    },
    en: {
        common: en_common,
        schedule: en_schedule,
    },
    es: {
        common: es_common,
        schedule: es_schedule,
    },
};

export type Locale = 'fr' | 'en' | 'es';
export type Namespace = 'common' | 'schedule';

export const SUPPORTED_LOCALES: Locale[] = ['fr', 'en', 'es'];
export const DEFAULT_LOCALE: Locale = 'fr';

export const LOCALE_NAMES: Record<Locale, string> = {
    fr: 'Français',
    en: 'English',
    es: 'Español',
};
