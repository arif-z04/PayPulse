export const config = {
  appName: import.meta.env.VITE_APP_NAME || 'PayPulse Enterprise',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  enableMockApi:
    import.meta.env.MODE === 'test'
      ? true
      : import.meta.env.VITE_ENABLE_MOCK_API === 'true',
  currency: import.meta.env.VITE_CURRENCY || 'BDT',
  currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || '৳',
  company: {
    name: 'PayPulse Technologies Ltd.',
    address: 'Gulshan Corporate Tower, Level 14, Road 11, Dhaka-1212',
    taxId: 'TIN-4920481029-C',
    email: 'payroll@paypulse.internal',
    phone: '+880 2 988 2301',
    web: 'https://paypulse.internal',
  },
};
