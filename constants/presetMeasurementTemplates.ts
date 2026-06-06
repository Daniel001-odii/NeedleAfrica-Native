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

/** Full library of preset templates users can browse and add to their collection. */
export const TEMPLATE_LIBRARY: PresetMeasurementTemplate[] = [
    {
        name: 'Shirt',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck', 'Arm Hole'],
    },
    {
        name: 'Trousers',
        fields: ['Waist', 'Hip', 'Length', 'Thigh', 'Ankle', 'Knee', 'Crotch'],
    },
    {
        name: 'Dress',
        fields: ['Bust', 'Waist', 'Hip', 'Length', 'Shoulder', 'Sleeve', 'Arm Hole'],
    },
    {
        name: 'Skirt',
        fields: ['Waist', 'Hip', 'Length', 'Hip Depth'],
    },
    {
        name: 'Blazer / Jacket',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck', 'Cross Back'],
    },
    {
        name: 'Agbada',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve Width', 'Neck'],
    },
    {
        name: 'Kaftan',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck'],
    },
    {
        name: 'Buba (Native Shirt)',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck'],
    },
    {
        name: 'Iro & Buba',
        fields: ['Blouse Length', 'Wrapper Length', 'Waist', 'Hip', 'Chest', 'Shoulder'],
    },
    {
        name: 'Senator Wear',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck', 'Trouser Length'],
    },
    {
        name: 'Suit (2-Piece)',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Trouser Waist', 'Trouser Length', 'Stomach'],
    },
    {
        name: 'Gown (Wedding/Evening)',
        fields: ['Bust', 'Under Bust', 'Waist', 'Hip', 'Length', 'Shoulder', 'Sleeve', 'Train Length'],
    },
    {
        name: 'Waistcoat',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Neck Depth'],
    },
    {
        name: 'Jumpsuit',
        fields: ['Bust', 'Waist', 'Hip', 'Length', 'Shoulder', 'Sleeve', 'Inseam', 'Torso Length'],
    },
    {
        name: 'Overcoat',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Cross Back', 'Neck'],
    },
    {
        name: 'Polo / T-Shirt',
        fields: ['Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve', 'Neck', 'Arm Hole'],
    },
    {
        name: 'Short (Tailored)',
        fields: ['Waist', 'Hip', 'Length', 'Thigh', 'Inseam', 'Knee'],
    },
    {
        name: 'Corset',
        fields: ['Bust', 'Under Bust', 'Waist', 'Hip', 'Length', 'Shoulder'],
    },
    {
        name: 'Kimono / Wrap Top',
        fields: ['Chest', 'Waist', 'Length', 'Sleeve Width', 'Shoulder'],
    },
    {
        name: 'Children\'s Wear',
        fields: ['Age', 'Chest', 'Waist', 'Length', 'Shoulder', 'Sleeve'],
    },
];
