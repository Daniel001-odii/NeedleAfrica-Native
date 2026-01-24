export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export const CURRENCIES: Currency[] = [
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: 'CN¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];
