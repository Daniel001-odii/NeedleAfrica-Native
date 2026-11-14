// Mirror of the API's order-stages constant. Keep in sync with
// NAfrica-API/src/constants/order-stages.ts.

export interface OrderStage {
    key: string;
    label: string;
    progressPercent: number;
}

export const ORDER_STAGES: OrderStage[] = [
    { key: 'confirmed', label: 'Order confirmed', progressPercent: 10 },
    { key: 'fabric_sourced', label: 'Fabric sourced', progressPercent: 25 },
    { key: 'cutting', label: 'Cutting', progressPercent: 40 },
    { key: 'stitching', label: 'Stitching', progressPercent: 60 },
    { key: 'first_fitting', label: 'First fitting', progressPercent: 75 },
    { key: 'finishing', label: 'Finishing & detailing', progressPercent: 90 },
    { key: 'ready', label: 'Ready for pickup/delivery', progressPercent: 95 },
    { key: 'delivered', label: 'Delivered', progressPercent: 100 },
];

export const PROGRESS_LABEL_MAX = 40;
export const PROGRESS_NOTE_MAX = 140;
export const MAX_PROGRESS_UPDATES = 5;
