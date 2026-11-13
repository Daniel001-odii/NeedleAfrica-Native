import axiosInstance from '../lib/axios';

export interface InstantLeadBid {
    id: string;
    tailorId: string;
    price: number;
    turnaroundDays: number;
    proposal: string | null;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';
}

export interface InstantLead {
    id: string;
    requestType: 'INSTANT' | 'DIRECT';
    fullName: string;
    description: string | null;
    fabricOption: string | null;
    fabricBudget: number | null;
    targetBudget: number | null;
    targetDate: string | null;
    bust: string | null;
    waist: string | null;
    hips: string | null;
    length: string | null;
    customMeasurements: { name: string; value: string }[] | null;
    inspoImages: string[];
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
    country: string | null;
    state: string | null;
    city: string | null;
    address: string | null;
    expiresAt: string | null;
    createdAt: string;
    bidCount: number;
    otherBidCount: number;
    averageBidPrice: number | null;
    otherBidAvatars: string[];
    myBid: InstantLeadBid | null;
    distanceKm: number | null;
}

export interface SubmitBidPayload {
    price: number;
    turnaroundDays: number;
    proposal?: string;
}

export class InstantRequestService {
    /** All open instant leads in the tailor's country + any the tailor has bid on. */
    static async getInstantLeads(): Promise<InstantLead[]> {
        try {
            const response = await axiosInstance.get('/order-requests/instant');
            return response.data.data || [];
        } catch (error) {
            console.error('Failed to fetch instant leads', error);
            return [];
        }
    }

    /** A single lead, resolved from the list (no dedicated GET-by-id endpoint). */
    static async getLead(id: string): Promise<InstantLead | null> {
        const leads = await this.getInstantLeads();
        return leads.find((l) => l.id === id) || null;
    }

    static async submitBid(requestId: string, payload: SubmitBidPayload): Promise<{ bid: InstantLeadBid; bidCount: number }> {
        const response = await axiosInstance.post(`/order-requests/instant/${requestId}/bid`, payload);
        return response.data.data;
    }

    static async withdrawBid(requestId: string): Promise<{ bidCount: number }> {
        const response = await axiosInstance.delete(`/order-requests/instant/${requestId}/bid`);
        return response.data.data;
    }
}
