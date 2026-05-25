import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { create } from "zustand";

interface SubscriptionsState {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  resetSubscriptions: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  subscriptions: HOME_SUBSCRIPTIONS,
  addSubscription: (subscription) =>
    set((state) => ({ subscriptions: [subscription, ...state.subscriptions] })),
  deleteSubscription: (id) =>
    set((state) => ({ subscriptions: state.subscriptions.filter((s) => s.id !== id) })),
  resetSubscriptions: () => set({ subscriptions: HOME_SUBSCRIPTIONS }),
}));
