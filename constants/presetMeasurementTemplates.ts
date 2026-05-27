export interface PresetMeasurementTemplate {
    name: string;
    fields: string[];
}

/** Seeded once per user when they have no templates. Users can edit or delete these. */
export const PRESET_MEASUREMENT_TEMPLATES: PresetMeasurementTemplate[] = [
    {
        name: 'Shirt',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve'],
    },
    {
        name: 'Trousers',
        fields: ['Waist', 'Hip', 'Length', 'Thigh', 'Ankle'],
    },
];
