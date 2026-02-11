'use client';

import { useState, useEffect, useRef } from 'react';
import { gateway } from '@/services/gateway';
import { Send, Bot, User, Trash2, Plus, MessageSquare, Menu, Settings2, BarChart2, MessageCircle, MoreHorizontal, X, Save, AlertTriangle, Package, CalendarClock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Conversation,
    ConversationMode,
    FactoryConfig,
    EmptyFactoryConfig,
    Message,
    ProductionOrder,
    Job,
    Operation
} from '@/types/factory';
import { ChatMode } from '@/types/whatif';
import FactoryAssetList from '@/components/FactoryAssetList';
import ConstraintsList from '@/components/ConstraintsList';
import ExtractedOrdersList from '@/components/ExtractedOrdersList';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FactoryChat() {
    const { language } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isContextPanelOpen, setIsContextPanelOpen] = useState(true);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showWhatIfModal, setShowWhatIfModal] = useState(false);
    const [useActiveConfig, setUseActiveConfig] = useState(false); // Checkbox state
    const [chatMode, setChatMode] = useState<ChatMode>('config'); // Config, What-If, or General

    // Editing State
    const [editingItem, setEditingItem] = useState<{ type: string, data: any } | null>(null);

    // Orders State (for orders mode) - synced with conversation
    const [pendingOrders, setPendingOrders] = useState<ProductionOrder[]>([]);
    const [pendingProducts, setPendingProducts] = useState<Job[]>([]);
    const [isSavingOrders, setIsSavingOrders] = useState(false);

    // Sync pending items when conversation changes
    useEffect(() => {
        console.log("=== SYNC PENDING ITEMS ===");
        console.log("currentId:", currentId);
        console.log("conversations count:", conversations.length);

        if (currentId) {
            const conv = conversations.find(c => c._id === currentId);
            console.log("Found conversation:", conv?._id);
            console.log("Conversation mode:", conv?.mode);
            console.log("Pending orders in conversation:", conv?.pendingOrders?.length || 0);
            console.log("Pending products in conversation:", conv?.pendingProducts?.length || 0);

            if (conv && conv.mode === 'orders') {
                setPendingOrders(conv.pendingOrders || []);
                setPendingProducts(conv.pendingProducts || []);
                console.log("Synced pending items from conversation");
            } else {
                setPendingOrders([]);
                setPendingProducts([]);
            }
        }
    }, [currentId, conversations]);

    // Helper to persist pending items to conversation
    const persistPendingItems = async (orders: ProductionOrder[], products: Job[]) => {
        console.log("=== PERSIST PENDING ITEMS ===");
        console.log("currentId:", currentId);
        console.log("Orders to persist:", orders.length);
        console.log("Products to persist:", products.length);

        if (!currentId) {
            console.log("No currentId, aborting");
            return;
        }

        const conv = conversations.find(c => c._id === currentId);
        if (!conv) {
            console.log("Conversation not found, aborting");
            return;
        }

        const updatedConv = {
            ...conv,
            pendingOrders: orders,
            pendingProducts: products,
            updatedAt: new Date().toISOString()
        };

        console.log("Updated conversation:", {
            _id: updatedConv._id,
            pendingOrders: updatedConv.pendingOrders?.length || 0,
            pendingProducts: updatedConv.pendingProducts?.length || 0
        });

        // Update local state FIRST
        setConversations(prev => {
            const updated = prev.map(c => c._id === currentId ? updatedConv : c);
            console.log("Local state updated");
            return updated;
        });

        // Then persist to DB
        try {
            await gateway.updateData('conversations', currentId, updatedConv);
            console.log("Persisted to DB");
        } catch (e) {
            console.error("Failed to persist to DB:", e);
        }
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        loadConversations();
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentId, conversations]);

    const loadConversations = async () => {
        console.log("=== LOAD CONVERSATIONS START ===");
        try {
            const res = await gateway.getConversations();
            const list = res.results || [];
            list.sort((a: any, b: any) => new Date(b.json_data?.updatedAt || 0).getTime() - new Date(a.json_data?.updatedAt || 0).getTime());

            const formatted: Conversation[] = list.map((item: any) => {
                const conv = {
                    _id: item._id,
                    ...item.json_data
                };

                // Log pending items for orders conversations
                if (conv.mode === 'orders') {
                    console.log(`Conversation ${conv._id} (orders):`, {
                        pendingOrders: conv.pendingOrders?.length || 0,
                        pendingProducts: conv.pendingProducts?.length || 0
                    });
                }

                return conv;
            });

            console.log("Loaded conversations:", formatted.length);
            setConversations(formatted);

            if (formatted.length > 0 && !currentId) {
                setCurrentId(formatted[0]._id!);
            } else if (formatted.length === 0) {
                setShowNewChatModal(true);
            }

            console.log("=== LOAD CONVERSATIONS END ===");
        } catch (e) {
            console.error("=== LOAD CONVERSATIONS ERROR ===", e);
        }
    };

    const startNewConversation = async (mode: ConversationMode) => {
        setShowNewChatModal(false);
        const titleMap: Record<ConversationMode, string> = {
            config: 'New Configuration',
            whatif: 'What-If Scenario',
            orders: 'Production Orders',
            general: 'General Chat'
        };

        const initialMessages: Message[] = [];
        let initialConfig = undefined;

        if (mode === 'config') {
            initialMessages.push({
                role: 'model',
                parts: [{ text: "I'm ready to help you configure your factory. Tell me about your machines, operators, and constraints." }]
            });
            initialConfig = { ...EmptyFactoryConfig };
        } else if (mode === 'whatif') {
            initialMessages.push({
                role: 'model',
                parts: [{ text: "Describe the scenario you want to test (e.g., 'What if Machine A breaks down for 4 hours?')." }]
            });
            initialConfig = { ...EmptyFactoryConfig };
        } else if (mode === 'orders') {
            const greeting = language === 'fr'
                ? `👋 **Assistant Commandes Production**

Je suis là pour vous aider à créer des commandes de production. Décrivez-moi simplement ce que vous devez produire !

**Exemples :**
- "100 déodorants stick pour jeudi"
- "500 roll-on urgents pour demain matin"
- "Changement de couleur blanc vers noir sur la ligne A"
- "Maintenance préventive sur CNC_Alpha vendredi"

Je vais extraire automatiquement :
- Le **produit** (et le créer s'il n'existe pas)
- La **quantité**
- La **deadline**
- La **priorité**

Parlez-moi de vos commandes !`
                : `👋 **Production Orders Assistant**

I'm here to help you create production orders. Just describe what you need to produce!

**Examples:**
- "100 deodorant sticks for Thursday"
- "500 urgent roll-ons for tomorrow morning"
- "Color change from white to black on line A"
- "Preventive maintenance on CNC_Alpha Friday"

I'll automatically extract:
- The **product** (creating it if needed)
- The **quantity**
- The **deadline**  
- The **priority**

Tell me about your orders!`;
            initialMessages.push({
                role: 'model',
                parts: [{ text: greeting }]
            });
            // Initialize with empty pending items (will be set after conversation is created)
        } else {
            initialMessages.push({
                role: 'model',
                parts: [{ text: language === 'fr' ? "Bonjour! Comment puis-je vous aider aujourd'hui?" : "Hello! How can I help you today?" }]
            });
        }

        // --- FETCH ACTIVE CONFIG IF REQUESTED ---
        if (useActiveConfig) {
            try {
                const res = await gateway.getAllData('active_factory_config');
                if (res.results && res.results.length > 0) {
                    const latest = res.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    initialConfig = latest.json_data || latest;
                    // Add system note
                    initialMessages.push({
                        role: 'model',
                        parts: [{ text: "🔍 *System*: Initialized with **Active Factory Configuration**." }]
                    });
                }
            } catch (e) {
                console.error("Failed to load active config for new chat", e);
            }
        }

        const newConv: Conversation = {
            title: titleMap[mode],
            messages: initialMessages,
            mode: mode,
            factoryConfig: initialConfig,
            pendingOrders: mode === 'orders' ? [] : undefined,
            pendingProducts: mode === 'orders' ? [] : undefined
        };

        try {
            const res = await gateway.saveData('conversations', {
                ...newConv,
                createdAt: new Date(),
                updatedAt: new Date()
            }, newConv.title);

            if (res.results && res.results[0]?.inserted_id) {
                const savedId = res.results[0].inserted_id;
                newConv._id = savedId;
                setConversations([newConv, ...conversations]);
                setCurrentId(savedId);
            }
        } catch (e) {
            console.error("Failed to create conversation", e);
        }
    };

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this conversation?')) return;
        try {
            await gateway.deleteConversation(id);
            setConversations(prev => prev.filter(c => c._id !== id));
            if (currentId === id) setCurrentId(null);
        } catch (e) { console.error("Failed to delete", e); }
    };

    const handleSend = async () => {
        if (!input.trim() || !currentId) return;
        const userText = input.trim();
        setInput('');
        setLoading(true);

        const currentConv = conversations.find(c => c._id === currentId);
        if (!currentConv) return;

        const newMessages: Message[] = [...currentConv.messages, { role: 'user', parts: [{ text: userText }] }];

        // Update local state immediately
        const updatedConversation = { ...currentConv, messages: newMessages, updatedAt: new Date().toISOString() };
        setConversations(prev => prev.map(c => c._id === currentId ? updatedConversation : c));

        // IMPORTANT: Save user message immediately so it persists even if user navigates away
        try {
            await gateway.updateData('conversations', currentId, updatedConversation);
        } catch (e) {
            console.error("Failed to save user message", e);
        }

        try {
            let jsonSchema = undefined;
            if (currentConv.mode === 'config') {
                jsonSchema = {
                    type: "object",
                    properties: {
                        assistant_response: { type: "string" },
                        extracted_config: {
                            type: "object",
                            description: "Extracted factory entities and constraints",
                            properties: {
                                machines: { type: "array", items: { type: "object", properties: { name: { type: "string" }, capabilities: { type: "array", items: { type: "string" } } } } },
                                operators: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            skills: { type: "array", items: { type: "string" } },
                                            processing_times: { type: "object", additionalProperties: { type: "number" }, description: "Maps skill name to duration in minutes" }
                                        }
                                    }
                                },
                                constraints_setup_times: { type: "array", items: { type: "object", properties: { machine: { type: "string" }, duration_minutes: { type: "number" }, from_product: { type: "string" }, to_product: { type: "string" } } } },
                                constraints_temporal: { type: "array", items: { type: "object", properties: { type: { type: "string" }, from_operation: { type: "string" }, to_operation: { type: "string" }, duration_minutes: { type: "number" } } } },
                                constraints_batching: { type: "array", items: { type: "object", properties: { machine: { type: "string" }, min_size: { type: "number" }, max_size: { type: "number" } } } },
                                constraints_maintenance: { type: "array", items: { type: "object", properties: { machine: { type: "string" }, duration_minutes: { type: "number" }, frequency_hours: { type: "number" } } } }
                            }
                        }
                    },
                    required: ["assistant_response"]
                };
            } else if (currentConv.mode === 'orders') {
                jsonSchema = {
                    type: "object",
                    properties: {
                        assistant_response: { type: "string", description: "Human-friendly response acknowledging the orders" },
                        extracted_orders: {
                            type: "array",
                            description: "Production orders extracted from user message",
                            items: {
                                type: "object",
                                properties: {
                                    type: { type: "string", enum: ["production", "color_change", "cleaning", "preventive_maintenance", "tool_change", "quality_control"] },
                                    product_name: { type: "string", description: "Name of the product (for production orders)" },
                                    quantity: { type: "number", description: "Quantity to produce" },
                                    deadline: { type: "string", description: "ISO date string for deadline (YYYY-MM-DD)" },
                                    priority: { type: "string", enum: ["low", "normal", "high", "urgent"] },
                                    client: { type: "string", description: "Client name if mentioned" },
                                    notes: { type: "string", description: "Any special notes or requirements" },
                                    color_from: { type: "string", description: "For color_change: starting color" },
                                    color_to: { type: "string", description: "For color_change: target color" },
                                    machine_id: { type: "string", description: "For maintenance/cleaning: machine name" }
                                },
                                required: ["type"]
                            }
                        },
                        extracted_products: {
                            type: "array",
                            description: "New products that need to be created (if mentioned products don't exist)",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    default_operations: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                name: { type: "string" },
                                                capability_required: { type: "string" },
                                                duration_minutes: { type: "number" }
                                            }
                                        }
                                    }
                                },
                                required: ["name"]
                            }
                        }
                    },
                    required: ["assistant_response"]
                };
            }

            // --- AI MEMORY INJECTION ---
            let contextString = undefined;
            if (currentConv.factoryConfig) {
                contextString = `Current Factory Config: ${JSON.stringify(currentConv.factoryConfig)}`;
            }
            const historyForApi = currentConv.messages;

            // Pass language to AskAI
            const answer = await gateway.askAI(userText, contextString, jsonSchema, historyForApi, language);
            console.log("askAI PARSED ANSWER:", answer); // DEBUG Log

            // If we got a JSON response (extraction), we might want to ensure the description/text is also in the target language
            // (The AI prompt injection handles this for the main text part)

            let assistantText = "";
            let newConfig = currentConv.factoryConfig;
            let updatedPendingOrders = pendingOrders;
            let updatedPendingProducts = pendingProducts;

            if (typeof answer === 'object' && answer.extracted_config) {
                console.log("=== CONFIG EXTRACTION FROM AI ===");
                console.log("Raw extracted_config:", JSON.stringify(answer.extracted_config, null, 2));

                assistantText = answer.assistant_response;
                if (newConfig) {
                    console.log("Current config before merge:", JSON.stringify(newConfig, null, 2));

                    if (answer.extracted_config.machines) {
                        const newMachines = [...newConfig.machines];
                        answer.extracted_config.machines.forEach((extractedM: any) => {
                            const existingIdx = newMachines.findIndex(m => m.name.toLowerCase() === extractedM.name.toLowerCase());
                            if (existingIdx !== -1) {
                                // Update existing: merge capabilities
                                const existingCap = new Set(newMachines[existingIdx].capabilities.map(c => c.toLowerCase()));
                                (extractedM.capabilities || []).forEach((c: string) => existingCap.add(c.toLowerCase()));
                                newMachines[existingIdx] = {
                                    ...newMachines[existingIdx],
                                    capabilities: Array.from(existingCap)
                                };
                            } else {
                                // Add new
                                newMachines.push({
                                    ...extractedM,
                                    id: extractedM.id || `machine-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                    capabilities: extractedM.capabilities || []
                                });
                            }
                        });
                        newConfig = { ...newConfig, machines: newMachines };
                    }
                    if (answer.extracted_config.operators) {
                        const newOperators = [...newConfig.operators];
                        answer.extracted_config.operators.forEach((extractedO: any) => {
                            const existingIdx = newOperators.findIndex(o => o.name.toLowerCase() === extractedO.name.toLowerCase());
                            if (existingIdx !== -1) {
                                // Update existing: merge skills and processing_times
                                const existingSkills = new Set(newOperators[existingIdx].skills.map(s => s.toLowerCase()));
                                (extractedO.skills || []).forEach((s: string) => existingSkills.add(s.toLowerCase()));

                                newOperators[existingIdx] = {
                                    ...newOperators[existingIdx],
                                    skills: Array.from(existingSkills),
                                    processing_times: {
                                        ...(newOperators[existingIdx].processing_times || {}),
                                        ...(extractedO.processing_times || {})
                                    }
                                };
                            } else {
                                // Add new
                                newOperators.push({
                                    ...extractedO,
                                    id: extractedO.id || `operator-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                    skills: extractedO.skills || [],
                                    processing_times: extractedO.processing_times || {}
                                });
                            }
                        });
                        newConfig = { ...newConfig, operators: newOperators };
                    }

                    // Merge flattened constraints (add IDs to constraints too)
                    if (answer.extracted_config.constraints_setup_times) {
                        const withIds = answer.extracted_config.constraints_setup_times.map((c: any, idx: number) => ({
                            ...c,
                            id: c.id || `setup-${Date.now()}-${idx}`
                        }));
                        console.log("Setup times extracted:", withIds);
                        newConfig.constraints.setup_times.push(...withIds);
                    }
                    if (answer.extracted_config.constraints_temporal) {
                        const withIds = answer.extracted_config.constraints_temporal.map((c: any, idx: number) => ({
                            ...c,
                            id: c.id || `temporal-${Date.now()}-${idx}`
                        }));
                        console.log("Temporal constraints extracted:", withIds);
                        newConfig.constraints.temporal.push(...withIds);
                    }
                    if (answer.extracted_config.constraints_batching) {
                        const withIds = answer.extracted_config.constraints_batching.map((c: any, idx: number) => ({
                            ...c,
                            id: c.id || `batching-${Date.now()}-${idx}`
                        }));
                        console.log("Batching constraints extracted:", withIds);
                        newConfig.constraints.batching.push(...withIds);
                    }
                    if (answer.extracted_config.constraints_maintenance) {
                        const withIds = answer.extracted_config.constraints_maintenance.map((c: any, idx: number) => ({
                            ...c,
                            id: c.id || `maintenance-${Date.now()}-${idx}`
                        }));
                        console.log("Maintenance constraints extracted:", withIds);
                        newConfig.constraints.maintenance.push(...withIds);
                    }

                    console.log("Config after merge:", JSON.stringify(newConfig, null, 2));
                }
            } else if (typeof answer === 'object' && (answer.extracted_orders || answer.extracted_products)) {
                // ORDERS MODE - Handle extracted orders and products
                console.log("=== ORDERS EXTRACTION ===");
                console.log("Raw AI answer:", JSON.stringify(answer, null, 2));

                assistantText = answer.assistant_response || "J'ai compris vos commandes.";

                let newProductsList: Job[] = [];
                let newOrdersList: ProductionOrder[] = [];

                // Process extracted products
                console.log("extracted_products from AI:", answer.extracted_products);
                console.log("extracted_orders from AI:", answer.extracted_orders);

                if (answer.extracted_products && answer.extracted_products.length > 0) {
                    newProductsList = answer.extracted_products.map((p: any) => ({
                        id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: p.name,
                        priority: 'normal' as const,
                        operations: (p.default_operations || []).map((op: any, idx: number) => ({
                            id: `op-${Date.now()}-${idx}`,
                            name: op.name || `Operation ${idx + 1}`,
                            machine_capability_required: op.capability_required || 'general',
                            duration_minutes: op.duration_minutes || 15
                        }))
                    }));
                }

                // Process extracted orders
                if (answer.extracted_orders && answer.extracted_orders.length > 0) {
                    newOrdersList = answer.extracted_orders.map((o: any) => {
                        const baseOrder: ProductionOrder = {
                            id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            type: o.type || 'production',
                            priority: o.priority || 'normal',
                            status: 'pending',
                            client: o.client,
                            deadline: o.deadline,
                            color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
                        };

                        if (o.type === 'production') {
                            baseOrder.product_name = o.product_name;
                            baseOrder.quantity = o.quantity || 1;
                        } else if (o.type === 'color_change') {
                            baseOrder.color_change_details = {
                                from_color: o.color_from || '',
                                to_color: o.color_to || '',
                                machine_id: o.machine_id || ''
                            };
                        } else if (o.type === 'cleaning' || o.type === 'preventive_maintenance') {
                            baseOrder.cleaning_details = {
                                machine_id: o.machine_id || '',
                                estimated_duration: 30
                            };
                        }

                        return baseOrder;
                    });
                }

                // Update local state and store for later persistence
                updatedPendingProducts = [...pendingProducts, ...newProductsList];
                updatedPendingOrders = [...pendingOrders, ...newOrdersList];

                console.log("New products extracted:", newProductsList);
                console.log("New orders extracted:", newOrdersList);
                console.log("Total pending products:", updatedPendingProducts);
                console.log("Total pending orders:", updatedPendingOrders);

                setPendingProducts(updatedPendingProducts);
                setPendingOrders(updatedPendingOrders);
            } else if (typeof answer === 'string') {
                assistantText = answer;
            } else if (typeof answer === 'object' && answer.assistant_response) {
                assistantText = answer.assistant_response;
            } else {
                assistantText = JSON.stringify(answer);
            }

            // Fallback if AI returns empty text but valid JSON
            if (!assistantText && typeof answer === 'object' && answer.extracted_config) {
                assistantText = "Configuration updated based on your request.";
            } else if (!assistantText) {
                assistantText = "I processed your request but have no specific test to show.";
            }

            const finalMessages: Message[] = [...newMessages, { role: 'model', parts: [{ text: assistantText }] }];

            let newTitle = currentConv.title;
            if (currentConv.messages.length <= 1) {
                newTitle = userText.slice(0, 30) + (userText.length > 30 ? '...' : '');
            }

            // Include pending orders/products for orders mode
            const finalConvObj: Conversation = {
                ...currentConv,
                messages: finalMessages,
                title: newTitle,
                factoryConfig: newConfig,
                pendingOrders: currentConv.mode === 'orders' ? updatedPendingOrders : undefined,
                pendingProducts: currentConv.mode === 'orders' ? updatedPendingProducts : undefined,
                updatedAt: new Date().toISOString()
            };

            console.log("=== SAVING CONVERSATION ===");
            console.log("Conversation ID:", currentId);
            console.log("Mode:", currentConv.mode);
            console.log("Factory config in conversation:", JSON.stringify(finalConvObj.factoryConfig, null, 2));
            if (currentConv.mode === 'orders') {
                console.log("Pending orders:", updatedPendingOrders.length);
                console.log("Pending products:", updatedPendingProducts.length);
            }

            // Save AI response to database FIRST (important if user navigates away)
            try {
                const saveResult = await gateway.updateData('conversations', currentId, finalConvObj);
                console.log("Conversation save result:", saveResult);
                console.log("=== CONVERSATION SAVED ===");
            } catch (saveError) {
                console.error("=== CONVERSATION SAVE ERROR ===", saveError);
            }

            // Then update local state (won't work if component unmounted, but that's ok)
            setConversations(prev => prev.map(c => c._id === currentId ? finalConvObj : c));

        } catch (e) {
            console.error(e);
            setError("Sorry, I encountered an error processing your request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // --- ITEM EDITING LOGIC ---

    const handleEditSave = async (newData: any) => {
        if (!currentId || !editingItem) return;

        const currentConv = conversations.find(c => c._id === currentId);
        if (!currentConv || !currentConv.factoryConfig) return;

        let updatedConfig = JSON.parse(JSON.stringify(currentConv.factoryConfig)); // Deep clone

        const targetName = editingItem.data.name;

        // --- MACHINES & OPERATORS ---
        if (editingItem.type === 'machine') {
            updatedConfig.machines = updatedConfig.machines.map((m: any) => m.name === targetName ? { ...m, ...newData } : m);
        }
        else if (editingItem.type === 'operator') {
            updatedConfig.operators = updatedConfig.operators.map((o: any) => o.name === targetName ? { ...o, ...newData } : o);
        }

        // --- CONSTRAINTS ---
        // Identifying constraints is harder without explicit IDs. 
        // We will perform a best-effort match based on fields.

        // SETUP TIMES
        else if (editingItem.type === 'setup_times') {
            updatedConfig.constraints.setup_times = updatedConfig.constraints.setup_times.map((st: any) => {
                // Match criteria: machine + from + to (original values)
                if (st.machine === editingItem.data.machine &&
                    st.from_product === editingItem.data.from_product &&
                    st.to_product === editingItem.data.to_product) {
                    return { ...st, ...newData };
                }
                return st;
            });
        }
        // TEMPORAL
        else if (editingItem.type === 'temporal') {
            updatedConfig.constraints.temporal = updatedConfig.constraints.temporal.map((tc: any) => {
                if (tc.from_operation === editingItem.data.from_operation &&
                    tc.to_operation === editingItem.data.to_operation) {
                    return { ...tc, ...newData };
                }
                return tc;
            });
        }
        // BATCHING
        else if (editingItem.type === 'batching') {
            updatedConfig.constraints.batching = updatedConfig.constraints.batching.map((b: any) =>
                b.machine === editingItem.data.machine ? { ...b, ...newData } : b
            );
        }
        // MAINTENANCE
        else if (editingItem.type === 'maintenance') {
            updatedConfig.constraints.maintenance = updatedConfig.constraints.maintenance.map((m: any) =>
                m.machine === editingItem.data.machine ? { ...m, ...newData } : m
            );
        }

        const finalConvObj = {
            ...currentConv,
            factoryConfig: updatedConfig,
            updatedAt: new Date().toISOString()
        };

        // Optimistic Ui
        setConversations(prev => prev.map(c => c._id === currentId ? finalConvObj : c));
        setEditingItem(null);
        await gateway.updateData('conversations', currentId, finalConvObj);
    };

    const handlePublishConfig = async () => {
        console.log("=== PUBLISH CONFIG START ===");
        console.log("Active conversation:", activeConversation?._id);
        console.log("Factory config to publish:", JSON.stringify(activeConversation?.factoryConfig, null, 2));

        if (!activeConversation?.factoryConfig) {
            console.log("No factory config in conversation, aborting");
            return;
        }

        if (confirm("This will overwrite the current Active Factory Configuration used for the dashboard. Continue?")) {
            try {
                // First, check if there's an existing config to update
                console.log("Fetching existing config...");
                const existingRes = await gateway.getAllData('active_factory_config');
                console.log("Existing configs:", existingRes);

                let result;
                if (existingRes.results && existingRes.results.length > 0) {
                    // Update existing
                    const latest = existingRes.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    console.log("Found existing config, ID:", latest._id);
                    console.log("Existing config data:", latest.json_data);

                    // Merge: keep existing typical_jobs if the new config doesn't have them
                    const configToSave = {
                        ...activeConversation.factoryConfig,
                        typical_jobs: activeConversation.factoryConfig.typical_jobs?.length > 0
                            ? activeConversation.factoryConfig.typical_jobs
                            : (latest.json_data?.typical_jobs || [])
                    };
                    console.log("Config to save (merged):", JSON.stringify(configToSave, null, 2));

                    result = await gateway.updateData('active_factory_config', latest._id, configToSave);
                    console.log("Update result:", result);
                } else {
                    // Create new
                    console.log("No existing config, creating new");
                    result = await gateway.saveData('active_factory_config', activeConversation.factoryConfig, "Active Factory Configuration");
                    console.log("Save result:", result);
                }

                console.log("=== PUBLISH CONFIG SUCCESS ===");
                alert("Configuration published successfully! You can now use it in the Scheduler.");
            } catch (e) {
                console.error("=== PUBLISH CONFIG ERROR ===", e);
                alert("Failed to publish configuration.");
            }
        }
    };

    const handleSaveOrders = async () => {
        console.log("=== handleSaveOrders START ===");
        console.log("pendingProducts:", JSON.stringify(pendingProducts, null, 2));
        console.log("pendingOrders:", JSON.stringify(pendingOrders, null, 2));

        if (pendingOrders.length === 0 && pendingProducts.length === 0) {
            console.log("No pending items to save, returning early");
            return;
        }

        setIsSavingOrders(true);
        try {
            // 1. Save new products to the active config
            if (pendingProducts.length > 0) {
                console.log("--- Saving Products ---");
                const configRes = await gateway.getAllData('active_factory_config');
                console.log("Fetched active_factory_config:", configRes);

                let currentConfig: FactoryConfig = { ...EmptyFactoryConfig };
                let existingConfigId: string | null = null;

                if (configRes.results && configRes.results.length > 0) {
                    const latest = configRes.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    currentConfig = latest.json_data || latest;
                    existingConfigId = latest._id;
                    console.log("Current config loaded, ID:", existingConfigId);
                    console.log("Current config data:", currentConfig);
                } else {
                    console.log("No existing config found, will create new");
                }

                // Add new products (avoid duplicates by name)
                const existingNames = currentConfig.typical_jobs?.map(j => j.name.toLowerCase()) || [];
                console.log("Existing product names:", existingNames);

                const newProducts = pendingProducts.filter(p => !existingNames.includes(p.name.toLowerCase()));
                console.log("New products to add (after dedup):", newProducts);

                if (newProducts.length > 0) {
                    currentConfig.typical_jobs = [...(currentConfig.typical_jobs || []), ...newProducts];
                    console.log("Updated config with new products:", currentConfig);

                    // UPDATE existing document instead of creating new!
                    let saveResult;
                    if (existingConfigId) {
                        console.log("Updating existing config document:", existingConfigId);
                        saveResult = await gateway.updateData('active_factory_config', existingConfigId, currentConfig);
                    } else {
                        console.log("Creating new config document");
                        saveResult = await gateway.saveData('active_factory_config', currentConfig, 'Factory Configuration');
                    }
                    console.log("Products save result:", saveResult);
                } else {
                    console.log("No new products to add (all duplicates)");
                }
            }

            // 2. Save orders
            if (pendingOrders.length > 0) {
                console.log("--- Saving Orders ---");
                const ordersRes = await gateway.getAllData('production_orders');
                console.log("Fetched production_orders:", ordersRes);

                let existingOrders: ProductionOrder[] = [];
                let existingOrdersId: string | null = null;

                if (ordersRes.results && ordersRes.results.length > 0) {
                    const latest = ordersRes.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    existingOrders = latest.json_data?.orders || [];
                    existingOrdersId = latest._id;
                    console.log("Existing orders ID:", existingOrdersId);
                    console.log("Existing orders:", existingOrders);
                } else {
                    console.log("No existing orders found");
                }

                // Link orders to product IDs if possible
                const configRes = await gateway.getAllData('active_factory_config');
                let config: FactoryConfig | null = null;
                if (configRes.results && configRes.results.length > 0) {
                    const latest = configRes.results.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )[0];
                    config = latest.json_data || latest;
                }
                console.log("Config for product ID linking:", config?.typical_jobs);

                const ordersWithProductIds = pendingOrders.map(order => {
                    if (order.type === 'production' && order.product_name && config) {
                        const matchingProduct = config.typical_jobs?.find(
                            j => j.name.toLowerCase() === order.product_name?.toLowerCase()
                        );
                        if (matchingProduct) {
                            console.log(`Linked order "${order.product_name}" to product ID: ${matchingProduct.id}`);
                            return { ...order, product_id: matchingProduct.id };
                        }
                    }
                    return order;
                });

                const allOrders = [...existingOrders, ...ordersWithProductIds];
                console.log("All orders to save:", allOrders);

                // UPDATE existing document instead of creating new!
                let saveResult;
                if (existingOrdersId) {
                    console.log("Updating existing orders document:", existingOrdersId);
                    saveResult = await gateway.updateData('production_orders', existingOrdersId, { orders: allOrders });
                } else {
                    console.log("Creating new orders document");
                    saveResult = await gateway.saveData('production_orders', { orders: allOrders }, 'Production Orders');
                }
                console.log("Orders save result:", saveResult);
            }

            // Store counts before clearing
            const savedProductsCount = pendingProducts.length;
            const savedOrdersCount = pendingOrders.length;

            console.log("--- Clearing pending items ---");
            // Clear pending items in conversation FIRST (persist to DB)
            await persistPendingItems([], []);
            console.log("Pending items persisted as empty");

            // Then clear local state AFTER persistence is confirmed
            setPendingOrders([]);
            setPendingProducts([]);
            console.log("Pending items cleared from local state");

            console.log("=== handleSaveOrders SUCCESS ===");
            alert(language === 'fr'
                ? `✅ Sauvegardé ! ${savedProductsCount} produit(s) et ${savedOrdersCount} commande(s) ajoutés.`
                : `✅ Saved! ${savedProductsCount} product(s) and ${savedOrdersCount} order(s) added.`
            );
        } catch (e) {
            console.error("=== handleSaveOrders ERROR ===", e);
            alert(language === 'fr' ? "Erreur lors de la sauvegarde" : "Failed to save");
        } finally {
            setIsSavingOrders(false);
        }
    };

    const handleRemovePendingOrder = async (orderId: string) => {
        const newOrders = pendingOrders.filter(o => o.id !== orderId);
        setPendingOrders(newOrders);
        await persistPendingItems(newOrders, pendingProducts);
    };

    const handleRemovePendingProduct = async (productId: string) => {
        const newProducts = pendingProducts.filter(p => p.id !== productId);
        setPendingProducts(newProducts);
        await persistPendingItems(pendingOrders, newProducts);
    };



    const activeConversation = conversations.find(c => c._id === currentId);

    const renderContextPanel = () => {
        if (!activeConversation) return null;

        if (activeConversation.mode === 'config') {
            return (
                <div className="h-full flex flex-col p-4 overflow-y-auto w-80 bg-slate-50 border-l border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Settings2 size={18} /> Configuration
                    </h3>
                    {activeConversation.factoryConfig ? (
                        <>
                            <FactoryAssetList
                                config={activeConversation.factoryConfig}
                                onEditMachine={(m) => setEditingItem({ type: 'machine', data: m })}
                                onEditOperator={(o) => setEditingItem({ type: 'operator', data: o })}
                            />
                            <div className="my-4 border-t border-slate-200" />
                            <ConstraintsList
                                constraints={activeConversation.factoryConfig.constraints}
                                onEditConstraint={(type, item) => setEditingItem({ type, data: item })}
                            />
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <button
                                    onClick={handlePublishConfig}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all font-medium"
                                >
                                    <Save size={18} /> Publish Configuration
                                </button>
                                <p className="text-xs text-center text-slate-400 mt-2">
                                    Makes this the active factory for scheduling.
                                </p>
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-slate-400">No configuration data found.</p>
                    )}
                </div>
            );
        }

        if (activeConversation.mode === 'whatif') {
            return (
                <div className="h-full flex flex-col p-4 overflow-y-auto w-80 bg-indigo-50/50 border-l border-indigo-100">
                    <h3 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                        <BarChart2 size={18} /> Simulation
                    </h3>
                    <p className="text-sm text-indigo-600 mb-4">
                        Define variables to test impact on the schedule.
                    </p>
                    <button
                        onClick={() => setShowWhatIfModal(true)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all"
                    >
                        Run Simulation
                    </button>
                </div>
            );
        }

        if (activeConversation.mode === 'orders') {
            return (
                <ExtractedOrdersList
                    pendingOrders={pendingOrders}
                    pendingProducts={pendingProducts}
                    onRemoveOrder={handleRemovePendingOrder}
                    onRemoveProduct={handleRemovePendingProduct}
                    onSave={handleSaveOrders}
                    isSaving={isSavingOrders}
                />
            );
        }

        return (
            <div className="h-full flex flex-col p-4 w-60 bg-slate-50 border-l border-slate-200 text-slate-400 text-sm text-center justify-center">
                <MessageCircle className="mx-auto mb-2 opacity-20" size={32} />
                <p>Standard Conversation</p>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-100px)] w-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">

            {/* NEW CHAT MODAL */}
            <AnimatePresence>
                {showNewChatModal && (
                    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md"
                        >
                            <h2 className="text-xl font-bold mb-4 text-slate-800">Start New Conversation</h2>
                            <div className="grid gap-3">
                                <button onClick={() => startNewConversation('orders')} className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 text-left transition-all group">
                                    <div className="flex items-center gap-3 font-semibold text-slate-700 group-hover:text-blue-700">
                                        <CalendarClock className="size-5" /> Orders Assistant
                                    </div>
                                    <p className="text-sm text-emerald-600 mt-1 pl-8">Create production orders in natural language!</p>
                                </button>
                                <button onClick={() => startNewConversation('config')} className="p-4 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 text-left transition-all group">
                                    <div className="flex items-center gap-3 font-semibold text-slate-700 group-hover:text-blue-700">
                                        <Settings2 className="size-5" /> Config Assistant
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 pl-8">Define machines, operators, and constraints.</p>
                                </button>
                                <button onClick={() => startNewConversation('whatif')} className="p-4 rounded-xl border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-left transition-all group">
                                    <div className="flex items-center gap-3 font-semibold text-slate-700 group-hover:text-indigo-700">
                                        <BarChart2 className="size-5" /> What-If Scenario
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 pl-8">Simulate delays, breakdowns, or rush orders.</p>
                                </button>
                                <button onClick={() => startNewConversation('general')} className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-left transition-all group">
                                    <div className="flex items-center gap-3 font-semibold text-slate-700">
                                        <MessageCircle className="size-5" /> General Chat
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1 pl-8">Ask general questions about scheduling.</p>
                                </button>
                            </div>

                            <div className="mt-4 flex items-center gap-2 px-1">
                                <input
                                    type="checkbox"
                                    id="useActiveConfig"
                                    checked={useActiveConfig}
                                    onChange={(e) => setUseActiveConfig(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <label htmlFor="useActiveConfig" className="text-sm text-slate-600 cursor-pointer select-none">
                                    Initialize with <strong>Active Configuration</strong>?
                                </label>
                            </div>

                            <button onClick={() => setShowNewChatModal(false)} className="mt-4 w-full py-2 text-slate-400 hover:text-slate-600">Cancel</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* EDIT ITEM MODAL */}
            <AnimatePresence>
                {editingItem && (
                    <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-sm"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 capitalize">Edit {editingItem.type.replace('_', ' ')}</h3>
                                <button onClick={() => setEditingItem(null)} className="p-1 hover:bg-slate-100 rounded-full"><X size={18} /></button>
                            </div>

                            <div className="space-y-3">
                                {/* Dynamic Edit Fields */}
                                {editingItem.type === 'machine' ? (
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                        <input
                                            className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                            defaultValue={editingItem.data.name || ''}
                                            id="edit-name"
                                        />
                                    </div>
                                ) : editingItem.type === 'operator' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                            <input
                                                className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                defaultValue={editingItem.data.name || ''}
                                                id="edit-operator-name"
                                            />
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Skills</label>
                                            <div className="space-y-2" id="edit-operator-skills">
                                                {(editingItem.data.skills || []).map((skill: string, idx: number) => (
                                                    <div key={idx} className="flex gap-2 items-center p-2 bg-slate-50 rounded-lg">
                                                        <input
                                                            type="text"
                                                            defaultValue={skill}
                                                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm"
                                                            data-skill-name={idx}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Time (min)"
                                                            defaultValue={editingItem.data.processing_times?.[skill] || ''}
                                                            className="w-24 px-2 py-1 border border-slate-200 rounded text-sm"
                                                            data-skill-time={idx}
                                                        />
                                                        <button
                                                            onClick={(e) => {
                                                                e.currentTarget.closest('.space-y-2')?.querySelector(`[data-skill-name="${idx}"]`)?.closest('.p-2')?.remove();
                                                            }}
                                                            className="px-2 py-1 text-red-500 hover:bg-red-50 rounded"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={(e) => {
                                                        const container = e.currentTarget.closest('.space-y-4')?.querySelector('#edit-operator-skills');
                                                        if (container) {
                                                            const existingSkills = container.querySelectorAll('[data-skill-name]');
                                                            const newIdx = existingSkills.length;
                                                            const newSkillDiv = document.createElement('div');
                                                            newSkillDiv.className = 'flex gap-2 items-center p-2 bg-slate-50 rounded-lg';
                                                            newSkillDiv.innerHTML = `
                                                                <input type="text" placeholder="Skill name" class="flex-1 px-2 py-1 border border-slate-200 rounded text-sm" data-skill-name="${newIdx}" />
                                                                <input type="number" placeholder="Time (min)" class="w-24 px-2 py-1 border border-slate-200 rounded text-sm" data-skill-time="${newIdx}" />
                                                                <button class="px-2 py-1 text-red-500 hover:bg-red-50 rounded" onclick="this.closest('.p-2').remove()">✕</button>
                                                            `;
                                                            container.insertBefore(newSkillDiv, e.currentTarget);
                                                        }
                                                    }}
                                                    className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:bg-slate-50"
                                                >
                                                    + Add Skill
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* MACHINE SELECTOR */}
                                        {editingItem.data.machine && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Machine</label>
                                                <input
                                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
                                                    defaultValue={editingItem.data.machine}
                                                    id="edit-machine"
                                                />
                                            </div>
                                        )}

                                        {/* DURATION (General) */}
                                        {editingItem.data.duration_minutes !== undefined && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Duration (min)</label>
                                                <input
                                                    type="number"
                                                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                                    defaultValue={editingItem.data.duration_minutes}
                                                    id="edit-duration"
                                                />
                                            </div>
                                        )}

                                        {/* SETUP SPECIFICS */}
                                        {(editingItem.type === 'setup_times') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">From</label>
                                                    <input className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={editingItem.data.from_product} id="edit-from" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">To</label>
                                                    <input className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={editingItem.data.to_product} id="edit-to" />
                                                </div>
                                            </div>
                                        )}

                                        {/* BATCHING SPECIFICS */}
                                        {(editingItem.type === 'batching') && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Min Size</label>
                                                    <input type="number" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={editingItem.data.min_size} id="edit-min-size" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase">Max Size</label>
                                                    <input type="number" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={editingItem.data.max_size} id="edit-max-size" />
                                                </div>
                                            </div>
                                        )}

                                        {/* MAINTENANCE SPECIFICS */}
                                        {(editingItem.type === 'maintenance') && (
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase">Every (Hours)</label>
                                                <input type="number" className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={editingItem.data.frequency_hours} id="edit-frequency" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button onClick={() => setEditingItem(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button
                                    onClick={() => {
                                        // Collect all possible fields
                                        const newData: any = {};

                                        // MACHINE EDIT
                                        const nameEl = document.getElementById('edit-name') as HTMLInputElement;
                                        if (nameEl) newData.name = nameEl.value;

                                        // OPERATOR EDIT
                                        const operatorNameEl = document.getElementById('edit-operator-name') as HTMLInputElement;
                                        if (operatorNameEl) {
                                            newData.name = operatorNameEl.value;

                                            // Collect skills and processing times
                                            const skillsContainer = document.getElementById('edit-operator-skills');
                                            if (skillsContainer) {
                                                const skillNameInputs = skillsContainer.querySelectorAll('[data-skill-name]') as NodeListOf<HTMLInputElement>;
                                                const skillTimeInputs = skillsContainer.querySelectorAll('[data-skill-time]') as NodeListOf<HTMLInputElement>;

                                                const skills: string[] = [];
                                                const processingTimes: { [skill: string]: number } = {};

                                                skillNameInputs.forEach((input, idx) => {
                                                    const skillName = input.value.trim();
                                                    if (skillName) {
                                                        skills.push(skillName);
                                                        const timeInput = skillTimeInputs[idx];
                                                        if (timeInput && timeInput.value) {
                                                            processingTimes[skillName] = Number(timeInput.value);
                                                        }
                                                    }
                                                });

                                                newData.skills = skills;
                                                if (Object.keys(processingTimes).length > 0) {
                                                    newData.processing_times = processingTimes;
                                                }
                                            }
                                        }

                                        // CONSTRAINT EDITS
                                        const machineEl = document.getElementById('edit-machine') as HTMLInputElement;
                                        if (machineEl) newData.machine = machineEl.value;

                                        const durationEl = document.getElementById('edit-duration') as HTMLInputElement;
                                        if (durationEl) newData.duration_minutes = Number(durationEl.value);

                                        const fromEl = document.getElementById('edit-from') as HTMLInputElement;
                                        if (fromEl) newData.from_product = fromEl.value;

                                        const toEl = document.getElementById('edit-to') as HTMLInputElement;
                                        if (toEl) newData.to_product = toEl.value;

                                        const minSizeEl = document.getElementById('edit-min-size') as HTMLInputElement;
                                        if (minSizeEl) newData.min_size = Number(minSizeEl.value);

                                        const maxSizeEl = document.getElementById('edit-max-size') as HTMLInputElement;
                                        if (maxSizeEl) newData.max_size = Number(maxSizeEl.value);

                                        const freqEl = document.getElementById('edit-frequency') as HTMLInputElement;
                                        if (freqEl) newData.frequency_hours = Number(freqEl.value);

                                        handleEditSave(newData);
                                    }}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* WHAT-IF DASHBOARD MODAL */}
            <AnimatePresence>
                {showWhatIfModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-8">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-white rounded-2xl w-full h-full max-w-6xl shadow-2xl flex flex-col relative overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-indigo-50">
                                <h2 className="font-bold text-lg text-indigo-800 flex items-center gap-2">
                                    <BarChart2 size={24} /> Simulation Dashboard
                                </h2>
                                <button
                                    onClick={() => setShowWhatIfModal(false)}
                                    className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 font-medium"
                                >
                                    Close Simulation
                                </button>
                            </div>
                            <div className="flex-1 p-8 overflow-y-auto">
                                {/* Placeholder Dashboard Content */}
                                <div className="grid grid-cols-3 gap-6 mb-8">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                                <div className="h-96 bg-slate-100 rounded-xl animate-pulse" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 280, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="bg-slate-50 border-r border-slate-200 flex flex-col shrink-0"
                    >
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-semibold text-slate-700">Conversations</h3>
                            <button onClick={() => setShowNewChatModal(true)} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                                <Plus size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {conversations.map(conv => (
                                <div
                                    key={conv._id}
                                    onClick={() => setCurrentId(conv._id!)}
                                    className={cn(
                                        "p-3 rounded-xl cursor-pointer flex justify-between items-start group transition-all",
                                        currentId === conv._id ? "bg-white shadow-sm border border-blue-100" : "hover:bg-slate-100"
                                    )}
                                >
                                    <div className="flex gap-3 overflow-hidden">
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full shrink-0",
                                            conv.mode === 'config' ? "bg-blue-400" :
                                                conv.mode === 'whatif' ? "bg-indigo-400" :
                                                    conv.mode === 'orders' ? "bg-emerald-400" : "bg-slate-400"
                                        )} />
                                        <div className="min-w-0">
                                            <p className={cn("truncate text-sm font-medium", currentId === conv._id ? "text-blue-700" : "text-slate-700")}>
                                                {conv.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-0.5">
                                                {conv.mode}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteConversation(conv._id!, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="h-16 border-b border-slate-200 flex items-center px-6 bg-white justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                            <Menu size={20} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                {activeConversation ? activeConversation.title : 'Select a conversation'}
                                {activeConversation?.mode === 'config' && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase font-bold">Config</span>}
                                {activeConversation?.mode === 'whatif' && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] rounded-full uppercase font-bold">What-If</span>}
                                {activeConversation?.mode === 'orders' && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full uppercase font-bold">Orders</span>}
                            </h2>
                        </div>
                    </div>
                    {/* Right Panel Toggle */}
                    {activeConversation && (activeConversation.mode === 'config' || activeConversation.mode === 'whatif' || activeConversation.mode === 'orders') && (
                        <button
                            onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
                            className={cn(
                                "p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                                isContextPanelOpen ? "bg-slate-100 text-slate-700" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <MoreHorizontal size={20} />
                            {isContextPanelOpen ? 'Hide Context' : 'Show Context'}
                        </button>
                    )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
                    {!activeConversation && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <Bot size={48} className="mb-4 opacity-20" />
                            <p>Select or create a conversation to start</p>
                            <button onClick={() => setShowNewChatModal(true)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-medium shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                                New Conversation
                            </button>
                        </div>
                    )}

                    {activeConversation?.messages.map((msg, idx) => (
                        <div key={idx} className={cn("flex gap-4 max-w-3xl mx-auto", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                msg.role === 'user' ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-emerald-600"
                            )}>
                                {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                            </div>
                            <div className={cn(
                                "px-6 py-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap max-w-[85%]",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-sm"
                                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                            )}>
                                {msg.role === 'model' ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-2 mt-4" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-1 mt-2" {...props} />,
                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-2" {...props} />,
                                            ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                            a: ({ node, ...props }) => <a className="text-blue-600 underline hover:text-blue-800" {...props} />,
                                            table: ({ node, ...props }) => <div className="overflow-x-auto my-3"><table className="min-w-full border-collapse border border-slate-200 text-sm" {...props} /></div>,
                                            thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                                            th: ({ node, ...props }) => <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700" {...props} />,
                                            td: ({ node, ...props }) => <td className="border border-slate-300 px-3 py-2" {...props} />,
                                            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-500 my-2" {...props} />,
                                            code: ({ node, inline, className, children, ...props }: any) => {
                                                if (inline) {
                                                    return <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-600 font-mono text-xs" {...props}>{children}</code>;
                                                }
                                                return <pre className="bg-slate-800 text-white p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono"><code {...props}>{children}</code></pre>;
                                            }
                                        }}
                                    >
                                        {msg.parts[0].text || "..."}
                                    </ReactMarkdown>
                                ) : (
                                    msg.parts[0].text
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                                <Bot size={16} />
                            </div>
                            <div className="px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-sm">
                                <AlertTriangle size={16} />
                            </div>
                            <div className="px-6 py-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl rounded-tl-sm shadow-sm">
                                <p className="font-semibold">Error</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-white border-t border-slate-200 shrink-0">
                    <div className="max-w-3xl mx-auto relative flex gap-3 items-end">
                        <textarea
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-500 transition-all font-medium text-slate-700 resize-none bg-slate-50 focus:bg-white max-h-32 overflow-y-auto"
                            placeholder={activeConversation ? "Type your message..." : "Select a conversation first..."}
                            rows={1}
                            style={{ minHeight: '48px' }}
                            disabled={!activeConversation}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'; // Max 128px (~5 lines)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                    // Reset height
                                    const target = e.target as HTMLTextAreaElement;
                                    setTimeout(() => { target.style.height = 'auto'; }, 0);
                                }
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim() || !activeConversation}
                            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Context Panel (Right) */}
            <AnimatePresence>
                {activeConversation && (activeConversation.mode === 'config' || activeConversation.mode === 'whatif' || activeConversation.mode === 'orders') && isContextPanelOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="shrink-0 h-full overflow-hidden"
                    >
                        {renderContextPanel()}
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
