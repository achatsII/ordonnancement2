'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Clock, Cpu, Package, CalendarClock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { gateway } from '@/services/gateway';
import { FactoryConfig, ProductionOrder } from '@/types/factory';
import Link from 'next/link';

export default function DashboardPage() {
    const [config, setConfig] = useState<FactoryConfig | null>(null);
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastLoadTime, setLastLoadTime] = useState<number>(0);

    useEffect(() => {
        console.log("=== DASHBOARD: MOUNT/RELOAD ===");
        const now = Date.now();
        // Only reload if it's been more than 2 seconds since last load (avoid rapid reloads)
        if (now - lastLoadTime > 2000) {
            console.log("Loading dashboard data...");
            loadData();
            setLastLoadTime(now);
        } else {
            console.log("Skipping reload (too soon)");
            setLoading(false);
        }
    }, []); // Empty deps = only on mount

    const loadData = async () => {
        console.log("=== DASHBOARD: LOAD DATA START ===");
        try {
            // Load config
            console.log("Fetching config...");
            const configResult = await gateway.getAllData('active_factory_config');
            console.log("Config result:", configResult);
            
            if (configResult.results && configResult.results.length > 0) {
                const latest = configResult.results.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                const configData = latest.json_data || latest;
                console.log("Loaded config:", {
                    machines: configData.machines?.length || 0,
                    products: configData.typical_jobs?.length || 0,
                    operators: configData.operators?.length || 0
                });
                setConfig(configData);
            } else {
                console.log("No config found");
            }

            // Load orders
            console.log("Fetching orders...");
            const ordersResult = await gateway.getAllData('production_orders');
            console.log("Orders result:", ordersResult);
            
            if (ordersResult.results && ordersResult.results.length > 0) {
                const latest = ordersResult.results.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                const ordersData = latest.json_data?.orders || [];
                console.log("Loaded orders:", ordersData.length);
                setOrders(ordersData);
            } else {
                console.log("No orders found");
            }
            
            console.log("=== DASHBOARD: LOAD DATA END ===");
        } catch (e) {
            console.error('=== DASHBOARD: LOAD DATA ERROR ===', e);
        } finally {
            setLoading(false);
        }
    };

    const hasMachines = (config?.machines?.length ?? 0) > 0;
    const hasProducts = (config?.typical_jobs?.length ?? 0) > 0;
    const hasOrders = orders.length > 0;
    const isReady = hasMachines && hasProducts && hasOrders;

    // Debug logs
    useEffect(() => {
        console.log("=== DASHBOARD: STATE CHECK ===");
        console.log("Config:", config ? "loaded" : "null");
        console.log("Machines count:", config?.machines?.length || 0);
        console.log("Products count:", config?.typical_jobs?.length || 0);
        console.log("Products data:", config?.typical_jobs);
        console.log("Orders count:", orders.length);
        console.log("hasMachines:", hasMachines);
        console.log("hasProducts:", hasProducts);
        console.log("hasOrders:", hasOrders);
        console.log("isReady:", isReady);
    }, [config, orders, hasMachines, hasProducts, hasOrders, isReady]);

    // Calculate setup progress
    const setupSteps = [
        { done: hasMachines, label: 'Machines', link: '/dashboard/machines' },
        { done: hasProducts, label: 'Products', link: '/dashboard/products' },
        { done: hasOrders, label: 'Orders', link: '/dashboard/schedule' },
    ];
    const completedSteps = setupSteps.filter(s => s.done).length;

    return (
        <div className="p-8 space-y-8">
            {/* Header Section */}
            <div>
                <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                    Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Maxence</span>
                </h2>
                <p className="text-slate-500 mt-2 text-lg">Here's what's happening on the production floor today.</p>
            </div>

            {/* Setup Progress Banner (if not ready) */}
            {!isReady && !loading && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/20"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={24} />
                                <h3 className="text-xl font-bold">Complete Your Setup</h3>
                            </div>
                            <p className="text-indigo-100 mb-4">
                                Configure your factory to start generating optimized production schedules.
                            </p>
                            
                            {/* Progress Steps */}
                            <div className="flex items-center gap-4">
                                {setupSteps.map((step, i) => (
                                    <Link key={step.label} href={step.link} className="flex items-center gap-2 group">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                            step.done 
                                                ? 'bg-green-400 text-green-900' 
                                                : 'bg-white/20 text-white group-hover:bg-white/30'
                                        }`}>
                                            {step.done ? '✓' : i + 1}
                                        </div>
                                        <span className={`font-medium ${step.done ? 'text-green-200' : 'text-white group-hover:underline'}`}>
                                            {step.label}
                                        </span>
                                        {i < setupSteps.length - 1 && (
                                            <ArrowRight size={16} className="text-indigo-300 ml-2" />
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <div className="text-5xl font-extrabold">{completedSteps}/3</div>
                            <p className="text-indigo-200 text-sm">steps completed</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Machines"
                    value={config?.machines?.length?.toString() || '0'}
                    subtitle={hasMachines ? 'Configured' : 'Not configured'}
                    icon={<Cpu className="text-white" size={24} />}
                    gradient={hasMachines ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}
                    href="/dashboard/machines"
                />
                <KpiCard
                    title="Products"
                    value={config?.typical_jobs?.length?.toString() || '0'}
                    subtitle={hasProducts ? 'Product templates' : 'No products defined'}
                    icon={<Package className="text-white" size={24} />}
                    gradient={hasProducts ? "bg-gradient-to-br from-blue-400 to-indigo-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}
                    href="/dashboard/products"
                />
                <KpiCard
                    title="Orders"
                    value={orders.length.toString()}
                    subtitle={hasOrders ? `${orders.filter(o => o.priority === 'urgent').length} Urgent` : 'No production orders'}
                    icon={<CalendarClock className="text-white" size={24} />}
                    gradient={hasOrders ? "bg-gradient-to-br from-purple-400 to-pink-600" : "bg-gradient-to-br from-slate-400 to-slate-500"}
                    href="/dashboard/schedule"
                />
            </div>

            {/* Content based on setup status */}
            {isReady ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-slate-200/50 rounded-3xl p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className="text-blue-600" size={22} />
                            Pending Orders
                        </h3>
                        <div className="space-y-4">
                            {orders.slice(0, 4).map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-transform">
                                    <div>
                                        <p className="font-semibold text-slate-700">
                                            {order.type === 'production' ? order.product_name : order.type.replace('_', ' ')}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {order.type === 'production' ? `Qty: ${order.quantity}` : ''} 
                                            {order.deadline ? ` • Due: ${order.deadline}` : ''}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                        order.priority === 'urgent' ? 'bg-red-50 text-red-600' :
                                        order.priority === 'high' ? 'bg-amber-50 text-amber-600' :
                                        'bg-slate-50 text-slate-600'
                                    }`}>
                                        {order.priority.toUpperCase()}
                                    </span>
                                </div>
                            ))}
                            {orders.length === 0 && (
                                <p className="text-center text-slate-400 py-8">No pending orders</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl shadow-indigo-900/20 rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <h3 className="text-xl font-bold mb-4 relative z-10">Quick Actions</h3>
                        <div className="space-y-3 relative z-10">
                            <Link href="/dashboard/schedule" className="block p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <CalendarClock size={20} />
                                        <span className="font-medium">View Schedule</span>
                                    </div>
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                            <Link href="/dashboard/products" className="block p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package size={20} />
                                        <span className="font-medium">Manage Products</span>
                                    </div>
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                            <Link href="/dashboard/chat" className="block p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={20} />
                                        <span className="font-medium">AI Assistant</span>
                                    </div>
                                    <ArrowRight size={18} />
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SetupCard
                        step={1}
                        title="Configure Machines"
                        description="Add your production machines and their capabilities."
                        icon={<Cpu size={24} />}
                        done={hasMachines}
                        href="/dashboard/machines"
                        current={!hasMachines}
                    />
                    <SetupCard
                        step={2}
                        title="Define Products"
                        description="Create product templates with their manufacturing operations."
                        icon={<Package size={24} />}
                        done={hasProducts}
                        href="/dashboard/products"
                        current={hasMachines && !hasProducts}
                    />
                    <SetupCard
                        step={3}
                        title="Add Orders"
                        description="Create production orders to generate optimized schedules."
                        icon={<CalendarClock size={24} />}
                        done={hasOrders}
                        href="/dashboard/schedule"
                        current={hasMachines && hasProducts && !hasOrders}
                    />
                </div>
            )}
        </div>
    )
}

function KpiCard({ title, value, subtitle, icon, gradient, href }: any) {
    const content = (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl shadow-slate-200/40 p-6 rounded-3xl flex items-center justify-between group cursor-pointer"
        >
            <div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
                <p className="text-4xl font-extrabold text-slate-800 mt-1 mb-1">{value}</p>
                <p className="text-sm font-medium text-slate-500">{subtitle}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${gradient}`}>
                {icon}
            </div>
        </motion.div>
    );
    
    return href ? <Link href={href}>{content}</Link> : content;
}

function SetupCard({ step, title, description, icon, done, href, current }: any) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ y: -5 }}
                className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer ${
                    done 
                        ? 'bg-green-50 border-green-200' 
                        : current 
                            ? 'bg-white border-indigo-300 shadow-xl shadow-indigo-100'
                            : 'bg-white/50 border-slate-200'
                }`}
            >
                {current && (
                    <div className="absolute -top-2 -right-2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                        Next Step
                    </div>
                )}
                
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    done 
                        ? 'bg-green-100 text-green-600' 
                        : current 
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-400'
                }`}>
                    {done ? <CheckCircle2 size={24} /> : icon}
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold ${done ? 'text-green-600' : 'text-slate-400'}`}>
                        STEP {step}
                    </span>
                    {done && <span className="text-xs text-green-600 font-bold">✓ COMPLETED</span>}
                </div>
                
                <h3 className={`text-lg font-bold mb-1 ${done ? 'text-green-700' : 'text-slate-800'}`}>
                    {title}
                </h3>
                <p className={`text-sm ${done ? 'text-green-600' : 'text-slate-500'}`}>
                    {description}
                </p>
                
                {!done && (
                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-indigo-600">
                        {current ? 'Get Started' : 'Configure'}
                        <ArrowRight size={16} />
                    </div>
                )}
            </motion.div>
        </Link>
    );
}
