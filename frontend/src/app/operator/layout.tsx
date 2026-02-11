export default function OperatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
            {/* Simple Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="font-bold text-lg tracking-wider text-slate-400 uppercase">OrdoAI <span className="text-blue-500">Operator</span></div>
                <div className="text-sm font-medium text-slate-500">Kiosk Mode</div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-auto p-6">
                {children}
            </main>
        </div>
    );
}
