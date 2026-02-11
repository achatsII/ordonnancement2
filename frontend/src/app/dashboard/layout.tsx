'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings, Cpu, CalendarClock, MessageSquare, Menu, Bot, Bell, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ProductionStateProvider } from '@/contexts/ProductionStateContext';
import LanguageSelector from '@/components/LanguageSelector';
import { useTranslation } from '@/i18n/useTranslation';

import { Toaster } from 'sonner';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <LanguageProvider>
            <ProductionStateProvider>
                <DashboardContent>{children}</DashboardContent>
                <Toaster position="top-right" richColors />
            </ProductionStateProvider>
        </LanguageProvider>
    );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { t } = useTranslation('common');

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100">
            {/* Sidebar */}
            <aside className="w-72 bg-white/80 backdrop-blur-2xl border-r border-slate-200 hidden md:flex flex-col z-20">
                <div className="p-8 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-blue-600/30 shadow-lg">
                            <Bot size={24} />
                        </div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                            OrdoAI
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 px-6 space-y-1.5">
                    <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-2">Workspace</p>
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={22} />} labelKey="nav.overview" />
                    <NavItem href="/dashboard/schedule" icon={<CalendarClock size={22} />} labelKey="nav.schedule" />
                    <NavItem href="/dashboard/machines" icon={<Cpu size={22} />} labelKey="nav.factory_floor" />
                    <NavItem href="/dashboard/operators" icon={<Bot size={22} />} label="Operators" />
                    <NavItem href="/dashboard/products" icon={<Package size={22} />} label="Products" />
                    <NavItem href="/dashboard/orders" icon={<Package size={22} />} label="Commandes" />

                    <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-8">Intelligence</p>
                    <NavItem href="/dashboard/chat" icon={<MessageSquare size={22} />} labelKey="nav.chat" />
                </nav>

                <div className="p-6 border-t border-slate-100 mx-6 mb-4">
                    <NavItem href="/dashboard/settings" icon={<Settings size={22} />} label="Settings" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none z-0" />

                {/* Top Bar (Mobile / Search) */}
                <header className="h-20 flex items-center justify-between px-8 z-10">
                    <div className="md:hidden">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                            <Menu />
                        </button>
                    </div>

                    <div className="ml-auto flex items-center gap-6">
                        <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <Bell size={22} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <LanguageSelector />

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-md border-2 border-white ring-2 ring-slate-100"></div>
                            <div className="hidden lg:block">
                                <p className="text-sm font-bold text-slate-800">Maxence Drouhin</p>
                                <p className="text-xs text-slate-500">Production Manager</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto z-10 pb-10">
                    {children}
                </div>
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, labelKey }: { href: string, icon: React.ReactNode, label?: string, labelKey?: string }) {
    const pathname = usePathname();
    const isActive = pathname === href;
    const { t } = useTranslation('common');

    const displayLabel = labelKey ? t(labelKey) : label;

    return (
        <Link
            href={href}
            className={cn(
                "group flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium relative overflow-hidden",
                isActive
                    ? "text-blue-600 bg-white shadow-lg shadow-blue-500/5"
                    : "text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-md hover:shadow-slate-200/50"
            )}
        >
            {isActive && (
                <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                />
            )}
            <span className={cn("transition-colors", isActive ? "text-blue-600" : "group-hover:text-blue-600")}>
                {icon}
            </span>
            <span>{displayLabel}</span>
        </Link>
    )
}
