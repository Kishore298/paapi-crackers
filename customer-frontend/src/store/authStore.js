import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      customer: null,
      isIdentified: false,

      setCustomer: (customer) => set({ customer, isIdentified: true }),

      clearCustomer: () => set({ customer: null, isIdentified: false }),
    }),
    {
      name: 'paapi-auth',
    }
  )
);

export default useAuthStore;
