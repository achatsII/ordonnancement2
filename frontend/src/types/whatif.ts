import { FactoryConfig, ScheduleResult } from './factory';

// ===== WHAT-IF SYSTEM TYPES =====

export type ChatMode = 'config' | 'whatif' | 'orders' | 'general';

export interface WhatIfModification {
    type: 'delay_order' | 'machine_down' | 'operator_unavailable' | 'task_move' | 'custom';
    description: string;
    parameters: {
        taskId?: string;
        orderId?: string;
        machineId?: string;
        operatorId?: string;
        delayHours?: number;
        newStartTime?: string;
        duration?: number;
        [key: string]: any;
    };
}

export interface WhatIfScenario {
    id: string;
    name: string;
    description: string;
    baseScheduleId: string;
    modifications: WhatIfModification[];
    simulatedSchedule?: ScheduleResult;
    impactAnalysis?: ImpactAnalysis;
    createdAt: string;
    status: 'draft' | 'simulated' | 'approved' | 'rejected';
}

export interface ImpactAnalysis {
    jobImpacts: JobImpact[];
    globalMetrics: {
        makespanBefore: number;
        makespanAfter: number;
        makespanDelta: number;
        utilizationBefore: number;
        utilizationAfter: number;
        deadlinesMetBefore: number;
        deadlinesMetAfter: number;
    };
}

export interface JobImpact {
    jobId: string;
    jobName: string;
    endTimeBefore: string;
    endTimeAfter: string;
    deltaHours: number; // Positive = plus tard, Negative = plus tôt
    status: 'improved' | 'degraded' | 'neutral';
}

export interface Message {
    role: 'user' | 'model';
    parts: { text: string }[];
    whatifAction?: {
        canSimulate: boolean;
        scenarioId?: string;
    };
}
