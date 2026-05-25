import { create } from "zustand";

interface SubscriptionsState {
  subscriptions: Subscription[];
  isLoading: boolean;
  setSubscriptions: (subscriptions: Subscription[]) => void;
  setLoading: (loading: boolean) => void;
  addSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  updateSubscription: (subscription: Subscription) => void;
  resetSubscriptions: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  subscriptions: [],
  isLoading: false,
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setLoading: (isLoading) => set({ isLoading }),
  addSubscription: (subscription) =>
    set((state) => ({ subscriptions: [subscription, ...state.subscriptions] })),
  deleteSubscription: (id) =>
    set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) })),
  updateSubscription: (subscription) =>
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === subscription.id ? subscription : s
      ),
    })),
  resetSubscriptions: () => set({ subscriptions: [], isLoading: false }),
}));
