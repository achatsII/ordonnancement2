import axios from 'axios';

const SOLVER_URL = process.env.NEXT_PUBLIC_SOLVER_URL || 'http://localhost:8000';

const client = axios.create({
    baseURL: SOLVER_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface Task {
    id: string;
    name: string;
    eligibleLines: string[];
    duration: number;
    skill: string;
    order?: number;
    manualStart?: number | null;
}

export interface Job {
    id: string;
    name: string;
    tasks: Task[];
    color: string;
    priority: number;
    dueDate: number;
}

export interface Operator {
    id: string;
    name: string;
    skills: string[];
}

export interface Line {
    id: string;
    name: string;
}

export interface SolveRequest {
    jobs: Job[];
    lines: Line[];
    operators: Operator[];
}

export interface SolvedTaskResult {
    id: string;
    jobId: string;
    jobName: string;
    name: string;
    line: string;
    start: number;
    end: number;
    duration: number;
    color: string;
    operatorName: string;
    priority: number;
    dueDate: number;
    manualStart?: number | null;
}

export interface SolverResponse {
    status: string;
    makespan?: number;
    tardiness?: number;
    stats?: any;
    tasks?: SolvedTaskResult[];
    logs?: string[];
}

export const solver = {
    solve: async (data: SolveRequest) => {
        const res = await client.post<SolverResponse>('/solve', data);
        return res.data;
    }
};
