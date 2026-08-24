import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, isCombo = false) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (item) => isCombo
            ? item.isCombo && item.comboId === product._id
            : !item.isCombo && item.productId === product._id
        );

        if (existingIndex > -1) {
          const updated = [...items];
          const current = updated[existingIndex];
          // Check stock
          const maxQty = isCombo ? (product.availableStock || 0) : (product.stock || 0);
          if (current.quantity < maxQty) {
            updated[existingIndex] = { ...current, quantity: current.quantity + 1 };
            set({ items: updated });
          }
        } else {
          const newItem = isCombo
            ? {
                comboId: product._id,
                isCombo: true,
                name: product.name,
                image: product.image?.url,
                price: product.price,
                savings: product.savings,
                products: product.products,
                quantity: 1,
                maxStock: product.availableStock || 0,
              }
            : {
                productId: product._id,
                isCombo: false,
                name: product.name,
                image: product.image?.url,
                sku: product.sku,
                mrp: product.mrp,
                price: product.displayPrice !== undefined ? product.displayPrice : product.mrp,
                packQuantity: product.packQuantity,
                quantity: 1,
                maxStock: product.stock || 0,
              };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (id, isCombo = false) => {
        set({
          items: get().items.filter((item) =>
            isCombo ? !(item.isCombo && item.comboId === id) : !((!item.isCombo) && item.productId === id)
          ),
        });
      },

      incrementItem: (id, isCombo = false) => {
        const items = get().items.map((item) => {
          const match = isCombo
            ? item.isCombo && item.comboId === id
            : !item.isCombo && item.productId === id;
          if (match && item.quantity < item.maxStock) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
        set({ items });
      },

      decrementItem: (id, isCombo = false) => {
        const items = get().items;
        const idx = items.findIndex((item) =>
          isCombo ? item.isCombo && item.comboId === id : !item.isCombo && item.productId === id
        );
        if (idx > -1) {
          if (items[idx].quantity <= 1) {
            set({ items: items.filter((_, i) => i !== idx) });
          } else {
            const updated = [...items];
            updated[idx] = { ...updated[idx], quantity: updated[idx].quantity - 1 };
            set({ items: updated });
          }
        }
      },

      getItemQuantity: (id, isCombo = false) => {
        const item = get().items.find((item) =>
          isCombo ? item.isCombo && item.comboId === id : !item.isCombo && item.productId === id
        );
        return item?.quantity || 0;
      },

      clearCart: () => set({ items: [] }),

      setItemQuantity: (id, quantity, isCombo = false, product = null) => {
        const items = get().items;
        const idx = items.findIndex((item) =>
          isCombo ? item.isCombo && item.comboId === id : !item.isCombo && item.productId === id
        );

        if (quantity <= 0) {
          if (idx > -1) {
            set({ items: items.filter((_, i) => i !== idx) });
          }
          return;
        }

        if (idx > -1) {
          const updated = [...items];
          const maxQty = updated[idx].maxStock;
          updated[idx] = { ...updated[idx], quantity: Math.min(quantity, maxQty) };
          set({ items: updated });
        } else if (product) {
          const maxQty = isCombo ? (product.availableStock || 0) : (product.stock || 0);
          const finalQty = Math.min(quantity, maxQty);
          
          if (finalQty > 0) {
            const newItem = isCombo
              ? {
                  comboId: product._id,
                  isCombo: true,
                  name: product.name,
                  image: product.image?.url,
                  price: product.price,
                  savings: product.savings,
                  products: product.products,
                  quantity: finalQty,
                  maxStock: product.availableStock || 0,
                }
              : {
                  productId: product._id,
                  isCombo: false,
                  name: product.name,
                  image: product.image?.url,
                  sku: product.sku,
                  mrp: product.mrp,
                  price: product.displayPrice !== undefined ? product.displayPrice : product.mrp,
                  packQuantity: product.packQuantity,
                  quantity: finalQty,
                  maxStock: product.stock || 0,
                };
            set({ items: [...items, newItem] });
          }
        }
      },
    }),
    {
      name: 'paapi-cart',
    }
  )
);

export default useCartStore;
