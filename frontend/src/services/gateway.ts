import axios from 'axios';
import { ProductionOrder, ScheduleResult, Conversation, Message } from '@/types/factory';
import { WhatIfScenario } from '@/types/whatif';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://qa.gateway.intelligenceindustrielle.com';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InZUZHJUTTNzQmRRcmtmb0oifQ.eyJpc3MiOiJodHRwczovL3BiY3Vzam5reGJ5aWtyZ293YXRjLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI3NmYxYjY5Yy05YmQyLTRjY2UtOTlhNC1kMGNkOTdjNTk5MzkiLCJhdWQiOiJ2MCIsImlhdCI6MTc2Mjk4MzgxMiwiZXhwIjoyMDc4NTUzMzMyLCJlbWFpbCI6InYwQGV4YW1wbGUuY29tIiwiZ3JhbnRfaWQiOiJhZTFiYTkzMC1jNDQyLTQwNTMtYjhhOC04MzZlZDM0MGEzYzgiLCJvcmdhbml6YXRpb24iOnsiaWQiOiJjMjE3OWJiNC03OGQyLTRmZWMtYjU0Zi01YTE4MDg3MDY0NjUiLCJuYW1lIjoiRMOpdmVsb3BwZXVyIHYwIiwicm9sZSI6InVzZXIifSwiYXBwbGljYXRpb24iOnsiaWQiOiIyNGE1MWQxYi04MzkyLTQzN2UtODE3MS0zZWU3MDJhOTJjNzciLCJuYW1lIjoiUHJvamV0IHYwIiwiaWRlbnRpZmllciI6InYwIn0sInJvbGUiOiJ1c2VyIiwic2NvcGVzIjpbIioiXSwibWV0YWRhdGEiOnt9fQ.V5zrL3u2z6HGhMkzBCjlozc-CEtYQicPwGbBkCEfaFs';

const client = axios.create({
    baseURL: GATEWAY_URL,
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
    },
});

export const gateway = {
    // Auth
    getMe: async () => {
        const res = await client.get('/api/v1/auth/me');
        return res.data;
    },

    // Data (CRUD)
    saveData: async (dataType: string, data: unknown, description?: string) => {
        // API requires app_identifier inside json_data
        const jsonData = typeof data === 'object' && data !== null && !Array.isArray(data)
            ? { ...data as Record<string, unknown>, app_identifier: 'ordonnancement-app' }
            : { data, app_identifier: 'ordonnancement-app' };

        const res = await client.post(`/api/v1/data/${dataType}`, {
            json_data: jsonData,
            description,
        });
        return res.data;
    },

    getAllData: async (dataType: string, projection?: unknown) => {
        const res = await client.get(`/api/v1/data/${dataType}/all`, {
            // data: { projection } // Removing body from GET as it causes issues with some proxies/browsers
        });
        return res.data;
    },

    deleteData: async (dataType: string, id: string) => {
        const res = await client.delete(`/api/v1/data/${dataType}/${id}`);
        return res.data;
    },

    updateData: async (dataType: string, id: string, data: unknown) => {
        const res = await client.put(`/api/v1/data/${dataType}/one/${id}`, {
            json_data: data
        });
        return res.data;
    },

    // Conversations Management
    getConversations: async () => {
        // We'll trust the caller to handle sorting/filtering if needed, or add it later
        // Currently just gets all 'conversations' data type
        return gateway.getAllData('conversations');
    },

    saveConversation: async (conversationId: string | undefined, messages: Message[], title: string = 'New Conversation') => {
        if (conversationId) {
            // Update existing
            return gateway.updateData('conversations', conversationId, {
                messages,
                title,
                updatedAt: new Date().toISOString()
            });
        } else {
            // Create New
            return gateway.saveData('conversations', {
                messages,
                title,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, title);
        }
    },

    deleteConversation: async (conversationId: string) => {
        return gateway.deleteData('conversations', conversationId);
    },

    // AI Assistant
    askAI: async (prompt: string, context?: string, jsonSchema?: unknown, history: Message[] = [], language: string = 'fr') => {
        const systemInstruction = context
            ? `You are an expert scheduler assistant. Context: ${context}. IMPORTANT: Respond in ${language}.`
            : `You are an expert scheduler assistant. IMPORTANT: Respond in ${language}.`; // Default system instructions with language

        const payload: Record<string, unknown> = {
            prompt,
            system_instruction: systemInstruction,
            provider: 'google', // Force Gemini
            level: 'mid', // Use default level
            history,
        };

        if (jsonSchema) {
            payload.json_schema = jsonSchema;
        }

        console.log("askAI REQUEST PAYLOAD:", JSON.stringify(payload, null, 2)); // DEBUG Log

        const res = await client.post('/api/v2/assistant/ask', payload);
        console.log("askAI RAW RES:", res.data); // DEBUG Log

        // Parse response if it's a stringified JSON (happens with json_schema)
        let answer = res.data.results.assistant_response;
        if (jsonSchema && typeof answer === 'string') {
            try {
                answer = JSON.parse(answer);
            } catch (e) {
                console.warn("Failed to parse structured AI response", e);
            }
        }
        return answer;
    },

    // ===== PERSISTENCE =====
    saveOrders: async (orders: ProductionOrder[]) => {
        return gateway.saveData('active_orders', orders, 'Current Production Orders');
    },

    loadOrders: async () => {
        const res = await gateway.getAllData('active_orders');
        if (res.results && res.results.length > 0) {
            // Sort by createdAt desc
            const latest = res.results.sort((a: any, b: any) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )[0];
            const rawData = latest.json_data;
            // Handle both { data: [...] } (new format) and direct array (legacy format)
            if (Array.isArray(rawData)) {
                return rawData as ProductionOrder[];
            }
            if (rawData?.data && Array.isArray(rawData.data)) {
                return rawData.data as ProductionOrder[];
            }
            return [];
        }
        return [];
    },

    saveSchedule: async (schedule: ScheduleResult | null) => {
        return gateway.saveData('active_schedule', schedule, 'Latest Optimization Result');
    },

    loadSchedule: async () => {
        const res = await gateway.getAllData('active_schedule');
        if (res.results && res.results.length > 0) {
            console.log(`[gateway] Found ${res.results.length} active_schedule records`);
            const latest = res.results.sort((a: any, b: any) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )[0];
            console.log("[gateway] Latest schedule created_at:", latest.created_at);
            return latest.json_data as ScheduleResult;
        }
        console.log("[gateway] No active_schedule records found");
        return null;
    },

    simulateWhatIf: async (scenario: WhatIfScenario, currentSolveRequest: unknown, currentTasks: unknown[]) => {
        const localBackend = axios.create({ baseURL: 'http://localhost:8000' });
        const res = await localBackend.post('/whatif/simulate', {
            scenario,
            currentSolveRequest,
            currentTasks
        });
        return res.data;
    },

    solve: async (data: unknown) => {
        const localBackend = axios.create({ baseURL: 'http://localhost:8000' });
        const res = await localBackend.post('/solve', data);
        return res.data;
    }
};
