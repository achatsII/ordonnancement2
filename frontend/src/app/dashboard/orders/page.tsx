'use client';

import { useProductionState } from '@/contexts/ProductionStateContext';
import { gateway } from '@/services/gateway';
import OrderManager from '@/components/OrderManager';
import { toast } from 'sonner';

export default function OrdersPage() {
    const {
        state: { activeConfig, activeOrders },
        reload
    } = useProductionState();

    const handleOrdersUpdate = async (updatedOrders: any[]) => {
        try {
            const ordersRes = await gateway.getAllData('production_orders');
            let ordersDocId = null;

            if (ordersRes.results && ordersRes.results.length > 0) {
                const latest = ordersRes.results.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];
                ordersDocId = latest._id;
            }

            if (ordersDocId) {
                await gateway.updateData('production_orders', ordersDocId, { orders: updatedOrders });
            } else {
                await gateway.saveData('production_orders', { orders: updatedOrders }, 'Production Orders');
            }

            // Reload context to get updated orders
            await reload();
            toast.success('Orders updated');
        } catch (e) {
            console.error('=== ORDERS UPDATE ERROR ===', e);
            toast.error('Failed to save orders');
        }
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestion des Commandes</h1>
                <p className="text-slate-500">Ajoutez, modifiez ou priorisez vos ordres de fabrication.</p>
            </div>

            <OrderManager
                orders={activeOrders}
                activeConfig={activeConfig}
                onUpdate={handleOrdersUpdate}
            />
        </div>
    );
}
