import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import React, { createContext, useContext, useState } from "react";

interface SubscriptionsContextType {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
}

const SubscriptionsContext = createContext<SubscriptionsContextType | null>(null);

export const SubscriptionsProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

  const addSubscription = (subscription: Subscription) => {
    setSubscriptions((prev) => [subscription, ...prev]);
  };

  return (
    <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
      {children}
    </SubscriptionsContext.Provider>
  );
};

export const useSubscriptions = () => {
  const ctx = useContext(SubscriptionsContext);
  if (!ctx) throw new Error("useSubscriptions must be used within SubscriptionsProvider");
  return ctx;
};
