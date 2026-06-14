import axiosInstance from '../lib/axios';

export interface OrderRequest {
    id: string;
    fullName: string;
    phoneNumber: string | null;
    email: string | null;
    description: string | null;
    bust: string | null;
    waist: string | null;
    hips: string | null;
    length: string | null;
    customMeasurements: { name: string; value: string }[] | null;
    inspoImages: string[];
    status: string;
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
}
