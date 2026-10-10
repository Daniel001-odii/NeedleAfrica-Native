import axiosInstance from '../lib/axios';

export interface OrderRequest {
    id: string;
    fullName: string;
    phoneNumber: string | null;
    email: string | null;
    description: string | null;
    fabricOption: string | null;
    fabricBudget: number | null;
    bust: string | null;
    waist: string | null;
    hips: string | null;
    length: string | null;
    customMeasurements: { name: string; value: string }[] | null;
    inspoImages: string[];
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    orderId: string | null;
    createdAt: string;
}

export class OrderRequestService {
    static async getOrderRequests(): Promise<OrderRequest[]> {
        try {
            const response = await axiosInstance.get('/order-requests');
            return response.data.data || [];
        } catch (error) {
            console.error('Failed to fetch order requests', error);
            return [];
        }
    }

    static async acceptOrderRequest(id: string): Promise<{ order: any; customer: any }> {
        const response = await axiosInstance.patch(`/order-requests/${id}/accept`);
        return response.data.data;
    }

    static async declineOrderRequest(id: string): Promise<void> {
        await axiosInstance.patch(`/order-requests/${id}/decline`);
    }
}
