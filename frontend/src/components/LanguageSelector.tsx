'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALE_NAMES, Locale } from '@/i18n/config';
import { Globe, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
            >
                <Globe size={18} />
                <span className="text-sm font-medium hidden sm:inline">{LOCALE_NAMES[language as Locale]}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                        >
                            {(['fr', 'en', 'es'] as Locale[]).map((locale) => (
                                <button
                                    key={locale}
                                    onClick={() => {
                                        setLanguage(locale);
                                        setIsOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between transition-colors"
                                >
                                    <span className="text-sm font-medium text-slate-700">{LOCALE_NAMES[locale]}</span>
                                    {language === locale && (
                                        <Check size={16} className="text-blue-600" />
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
