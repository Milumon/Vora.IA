import { create } from 'zustand';

type Currency = 'PEN' | 'USD';

interface CurrencyState {
    currency: Currency;
    toggleCurrency: () => void;
    setCurrency: (c: Currency) => void;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
    currency: 'PEN',
    toggleCurrency: () =>
        set((state) => ({ currency: state.currency === 'PEN' ? 'USD' : 'PEN' })),
    setCurrency: (currency) => set({ currency }),
}));
