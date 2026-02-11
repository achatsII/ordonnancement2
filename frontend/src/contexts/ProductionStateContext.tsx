'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FactoryConfig, ProductionOrder, ScheduleResult } from '@/types/factory';
import { WhatIfScenario } from '@/types/whatif';
import { gateway } from '@/services/gateway';

interface ProductionState {
    activeConfig: FactoryConfig | null;
    activeSchedule: ScheduleResult | null;
    activeOrders: ProductionOrder[];
    whatifScenarios: WhatIfScenario[];
    isLoading: boolean;
}

interface ProductionStateContextType {
    state: ProductionState;
    updateConfig: (config: FactoryConfig, description?: string) => Promise<void>;
    updateSchedule: (schedule: ScheduleResult) => Promise<void>;
    updateOrders: (orders: ProductionOrder[]) => Promise<void>;
    addWhatIfScenario: (scenario: WhatIfScenario) => void;
    promoteWhatIfToProduction: (scenarioId: string) => Promise<void>;
    reload: () => Promise<void>;
}

const ProductionStateContext = createContext<ProductionStateContextType | undefined>(undefined);

export function ProductionStateProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProductionState>({
        activeConfig: null,
        activeSchedule: null,
        activeOrders: [],
        whatifScenarios: [],
        isLoading: true,
    });

    const loadData = async () => {
        console.log("=== PRODUCTION STATE: LOAD DATA START ===");
        setState(prev => ({ ...prev, isLoading: true }));

        try {
            // Load active config
            console.log("Loading active_factory_config...");
            const configRes = await gateway.getAllData('active_factory_config');
            console.log("Config response:", configRes);

            let config: FactoryConfig | null = null;
            if (configRes.results && configRes.results.length > 0) {
                // Sort by creation date and get the latest
                const latest = configRes.results.sort((a: any, b: any) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                )[0];
                config = latest.json_data;
                console.log("Loaded config:", {
                    machines: config?.machines?.length || 0,
                    operators: config?.operators?.length || 0,
                    typical_jobs: config?.typical_jobs?.length || 0
                });
            } else {
                console.log("No config found");
            }

            // Load active schedule
            console.log("Loading schedule...");
            const scheduleData = await gateway.loadSchedule();
            console.log("Schedule loaded:", {
                makespan: scheduleData?.makespan,
                tasks: scheduleData?.tasks?.length || 0
            });

            // Load orders
            console.log("Loading orders...");
            const ordersRes = await gateway.getAllData('production_orders');
            console.log("Orders response:", ordersRes);

            let orders: ProductionOrder[] = [];
            if (ordersRes.results && ordersRes.results.length > 0) {
                const latest = ordersRes.results.sort((a: any, b: any) =>
                    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                )[0];
                orders = latest.json_data?.orders || [];
                console.log("Loaded orders:", orders.length);
            } else {
                console.log("No orders found");
            }

            setState({
                activeConfig: config,
                activeSchedule: scheduleData,
                activeOrders: orders,
                whatifScenarios: [], // TODO: Load from backend if persisted
                isLoading: false,
            });

            console.log("=== PRODUCTION STATE: LOAD DATA SUCCESS ===");
        } catch (error) {
            console.error('=== PRODUCTION STATE: LOAD DATA ERROR ===', error);
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateConfig = async (config: FactoryConfig, description?: string) => {
        await gateway.saveData('active_factory_config', config, description || 'Configuration updated');

        // AUTO-SYNC: If configuration is emptied (no machines), clear the schedule
        if (!config.machines || config.machines.length === 0) {
            console.log("Config emptied, clearing schedule...");
            await gateway.saveSchedule(null);
            setState(prev => ({ ...prev, activeConfig: config, activeSchedule: null }));
        } else {
            setState(prev => ({ ...prev, activeConfig: config }));
        }
    };

    const updateSchedule = async (schedule: ScheduleResult) => {
        await gateway.saveSchedule(schedule);
        setState(prev => ({ ...prev, activeSchedule: schedule }));
    };

    const updateOrders = async (orders: ProductionOrder[]) => {
        await gateway.saveOrders(orders);

        // AUTO-SYNC: If orders are emptied, clear the schedule
        if (!orders || orders.length === 0) {
            console.log("Orders emptied, clearing schedule...");
            await gateway.saveSchedule(null);
            setState(prev => ({ ...prev, activeOrders: orders, activeSchedule: null }));
        } else {
            setState(prev => ({ ...prev, activeOrders: orders }));
        }
    };

    const addWhatIfScenario = (scenario: WhatIfScenario) => {
        setState(prev => ({
            ...prev,
            whatifScenarios: [...prev.whatifScenarios, scenario],
        }));
    };

    const promoteWhatIfToProduction = async (scenarioId: string) => {
        const scenario = state.whatifScenarios.find(s => s.id === scenarioId);
        if (!scenario || !scenario.simulatedSchedule) {
            throw new Error('Scenario not found or not simulated');
        }

        // Save simulated schedule as new production schedule
        await updateSchedule(scenario.simulatedSchedule);

        // Update scenario status
        setState(prev => ({
            ...prev,
            whatifScenarios: prev.whatifScenarios.map(s =>
                s.id === scenarioId ? { ...s, status: 'approved' as const } : s
            ),
        }));
    };

    const reload = async () => {
        await loadData();
    };

    return (
        <ProductionStateContext.Provider
            value={{
                state,
                updateConfig,
                updateSchedule,
                updateOrders,
                addWhatIfScenario,
                promoteWhatIfToProduction,
                reload,
            }}
        >
            {children}
        </ProductionStateContext.Provider>
    );
}

export function useProductionState() {
    const context = useContext(ProductionStateContext);
    if (!context) {
        throw new Error('useProductionState must be used within ProductionStateProvider');
    }
    return context;
}
