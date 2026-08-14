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
                sellingPrice: product.sellingPrice,
                discountPrice: product.discountPrice,
                price: product.discountPrice && product.discountPrice < product.sellingPrice
                  ? product.discountPrice
                  : product.sellingPrice,
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

      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      get totalDiscount() {
        return get().items.reduce((sum, item) => {
          if (!item.isCombo && item.discountPrice && item.discountPrice < item.sellingPrice) {
            return sum + (item.sellingPrice - item.discountPrice) * item.quantity;
          }
          return sum;
        }, 0);
      },
    }),
    {
      name: 'paapi-cart',
    }
  )
);

export default useCartStore;
