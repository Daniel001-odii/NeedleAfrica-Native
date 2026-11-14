import axiosInstance from '../lib/axios';

export interface OrderProgressUpdate {
    id: string;
    orderId: string;
    stageKey: string | null;
    label: string;
    note: string | null;
    progressPercent: number | null;
    createdById: string;
    createdAt: string;
}

export interface AddProgressPayload {
    stageKey?: string;
    label: string;
    note?: string;
}

/**
 * Online-only order progress updates. `orderServerId` is the backend Order.id,
 * which equals the WatermelonDB record `id` (sync upserts by that id).
 */
export class OrderProgressService {
    static async getProgress(orderServerId: string): Promise<OrderProgressUpdate[]> {
        try {
            const res = await axiosInstance.get(`/orders/${orderServerId}/progress`);
            return res.data.data || [];
        } catch (error) {
            console.error('Failed to fetch order progress', error);
            return [];
        }
    }

    static async addProgress(orderServerId: string, payload: AddProgressPayload): Promise<OrderProgressUpdate> {
        const res = await axiosInstance.post(`/orders/${orderServerId}/progress`, payload);
        return res.data.data;
    }

    static async deleteProgress(orderServerId: string, updateId: string): Promise<void> {
        await axiosInstance.delete(`/orders/${orderServerId}/progress/${updateId}`);
    }
}
