// ===== CONSTRAINTS =====

export interface SetupTime {
    id: string;
    from_product?: string;
    to_product?: string;
    machine: string;
    duration_minutes: number;
    description?: string;
}

export interface TemporalConstraint {
    id: string;
    type: 'min_lag' | 'max_lag' | 'overlap';
    from_operation: string;
    to_operation: string;
    duration_minutes: number;
    description?: string;
}

export interface AuxiliaryResource {
    id: string;
    name: string;
    quantity: number;
    description?: string;
}

export interface MultiOperatorConstraint {
    id: string;
    machine: string;
    required_operators: number;
    description?: string;
}

export interface BatchConstraint {
    id: string;
    machine: string;
    min_size: number;
    max_size: number;
    description?: string;
}

export interface MaintenanceConstraint {
    id: string;
    machine: string;
    frequency_hours?: number;
    duration_minutes: number;
    description?: string;
}

export interface Constraints {
    setup_times: SetupTime[];
    temporal: TemporalConstraint[];
    auxiliary_resources: AuxiliaryResource[];
    multi_operator: MultiOperatorConstraint[];
    batching: BatchConstraint[];
    maintenance: MaintenanceConstraint[];
}

export interface FactoryConfig {
    machines: Machine[];
    operators: Operator[];
    constraints: Constraints;
    typical_jobs: Job[];
}

export type OrderType =
    | 'production'             // Production normale
    | 'color_change'           // Changement de couleur
    | 'cleaning'               // Nettoyage machine
    | 'preventive_maintenance' // Maintenance préventive
    | 'tool_change'            // Changement outillage
    | 'quality_control';       // Contrôle qualité

export interface ProductionOrder {
    id: string;
    type: OrderType;
    client?: string;

    // Optional for non-production orders
    product_id?: string; // References a Job.id or Job.name in typical_jobs
    product_name?: string; // Snapshot of name
    quantity?: number;

    deadline?: string; // ISO string
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'draft' | 'pending' | 'scheduled' | 'in_progress' | 'completed';
    color?: string;

    // Type-specific details
    color_change_details?: {
        from_color: string;
        to_color: string;
        machine_id: string;
    };
    cleaning_details?: {
        machine_id: string;
        estimated_duration: number; // minutes
    };
    maintenance_details?: {
        machine_id: string;
        maintenance_type: string;
        estimated_duration: number; // minutes
    };
    tool_change_details?: {
        machine_id: string;
        from_tool?: string;
        to_tool: string;
        estimated_duration?: number;
    };
    quality_control_details?: {
        product_id: string;
        sample_size?: number;
        estimated_duration?: number;
    };
}


export interface ScheduleResult {
    tasks: any[];
    makespan: number;
    logs: string[];
    updatedAt: string;
}

export interface Machine {
    id: string;
    name: string;
    description?: string;
    capabilities: string[];
}

export interface Operator {
    id: string;
    name: string;
    skills: string[];
    processing_times?: { [skill: string]: number }; // Optional: time in minutes for each skill
}

export interface Operation {
    id: string;
    name: string;
    machine_capability_required: string;
    duration_minutes: number;
}

export interface Job {
    id: string;
    name: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    operations: Operation[];
    deadline?: string;
}

// ===== CHAT & CONVERSATION EXTENSIONS =====

export type ConversationMode = 'config' | 'whatif' | 'orders' | 'general';

export interface MessagePart {
    text: string;
}

export interface Message {
    role: 'user' | 'model';
    parts: MessagePart[];
}

export interface Conversation {
    _id?: string;
    title: string;
    messages: Message[];
    mode?: ConversationMode;
    factoryConfig?: FactoryConfig;
    pendingOrders?: ProductionOrder[];
    pendingProducts?: Job[];
    createdAt?: string;
    updatedAt?: string;
}

export const EmptyFactoryConfig: FactoryConfig = {
    machines: [],
    operators: [],
    constraints: {
        setup_times: [],
        temporal: [],
        auxiliary_resources: [],
        multi_operator: [],
        batching: [],
        maintenance: []
    },
    typical_jobs: []
};
