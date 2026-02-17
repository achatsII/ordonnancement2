'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, ChevronRight } from 'lucide-react';
import { MOCK_SOLVER_DATA } from '@/lib/mockData';
import { Operator } from '@/types/factory';

export default function OperatorLoginPage() {
    const router = useRouter();
    const [selectedOp, setSelectedOp] = useState<string | null>(null);

    const handleLogin = (opId: string) => {
        // In a real app, we would set a session cookie or context
        // For now, we will just pass the ID via URL or context. 
        // Let's use URL query param for simplicity in this prototype.
        router.push(`/operator/station?op=${opId}`);
    };

    return (
        <div className="max-w-4xl mx-auto pt-12">
            <h1 className="text-4xl font-extrabold text-white mb-2 text-center">Who is logging in?</h1>
            <p className="text-slate-400 text-center mb-12 text-lg">Select your profile to access your tasks.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {MOCK_SOLVER_DATA.operators.map((op: Operator) => (
                    <button
                        key={op.id}
                        onClick={() => handleLogin(op.id)}
                        className="group relative flex flex-col items-center bg-slate-800 border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-700/50 rounded-3xl p-8 transition-all duration-200"
                    >
                        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors shadow-lg">
                            <User size={40} className="text-slate-300 group-hover:text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{op.name}</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {op.skills.map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-900 rounded-md text-xs font-mono text-slate-400 border border-slate-700">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <div className="absolute top-4 right-4 text-slate-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                            <ChevronRight size={24} />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
