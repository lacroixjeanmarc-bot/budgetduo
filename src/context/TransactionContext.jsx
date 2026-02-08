import { createContext, useContext, useState } from "react";

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState(null); // ← null = pas chargé

  const isReady = transactions !== null;

  return (
    <TransactionContext.Provider
      value={{
        transactions: transactions || [],
        setTransactions,
        isReady,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  return useContext(TransactionContext);
}