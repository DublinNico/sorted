import { create } from "zustand";
import type { MonthlySnapshot } from "@/services/monthlySnapshots";

interface SubscriptionsState {
  subscriptions: Subscription[];
  isLoading: boolean;
  monthlySnapshots: MonthlySnapshot[];
  setSubscriptions: (subscriptions: Subscription[]) => void;
  setLoading: (loading: boolean) => void;
  setMonthlySnapshots: (snapshots: MonthlySnapshot[]) => void;
  addSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  updateSubscription: (subscription: Subscription) => void;
  resetSubscriptions: () => void;
}

export const useSubscriptionsStore = create<SubscriptionsState>((set) => ({
  subscriptions: [],
  isLoading: false,
  monthlySnapshots: [],
  setSubscriptions: (subscriptions) => set({ subscriptions }),
  setLoading: (isLoading) => set({ isLoading }),
  setMonthlySnapshots: (monthlySnapshots) => set({ monthlySnapshots }),
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
  resetSubscriptions: () => set({ subscriptions: [], isLoading: false, monthlySnapshots: [] }),
}));
