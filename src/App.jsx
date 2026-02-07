import { useTransactions } from "./context/TransactionContext";
import { useState, useEffect, useMemo } from "react";
import { database } from "./firebase";
import { ref, onValue, push, set } from "firebase/database";
import Setup from "./components/Setup";
import TransactionForm from "./components/TransactionForm";
import Summary from "./components/Summary";
import TransactionList from "./components/TransactionList";
import ConfigCategories from "./components/ConfigCategories";

import { DEFAULT_CATEGORIES } from "./constants/categories";


import "./App.css";

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [session, setSession] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [personalTransactions, setPersonalTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);


  const [activeTab, setActiveTab] = useState("add");
  const [currentUserName, setCurrentUserName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { setTransactions: setContextTransactions } = useTransactions();

  // ---------- SESSION ----------

  useEffect(() => {
    const saved = localStorage.getItem("budgetduo_session");
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      setSession(data);
      setIsSetup(true);
      setCurrentUserName(data.userName);
    } catch {
      localStorage.removeItem("budgetduo_session");
    }
  }, []);

  // ---------- FIREBASE SHARED ----------

  useEffect(() => {
    if (!session?.code) return;

    const refPath = ref(database, `sessions/${session.code}/transactions`);

    onValue(refPath, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setTransactions([]);

      const list = Object.entries(data).map(([id, tx]) => ({
        id,
        ...tx,
      }));

      setTransactions(list);
    });
  }, [session]);

  // ---------- FIREBASE PERSONAL ----------

  useEffect(() => {
    if (!session?.code || !currentUserName) return;

    const refPath = ref(
      database,
      `sessions/${session.code}/personal/${currentUserName}/transactions`
    );

    onValue(refPath, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setPersonalTransactions([]);

      const list = Object.entries(data).map(([id, tx]) => ({
        id,
        ...tx,
      }));

      setPersonalTransactions(list);
    });
  }, [session, currentUserName]);

  const handleSetupComplete = (data) => {
    setSession(data);
    setIsSetup(true);
    setCurrentUserName(data.userName);
  };

// ---------- FIREBASE CATEGORIES ----------

useEffect(() => {
  if (!session?.code) return;

  const catRef = ref(
    database,
    `sessions/${session.code}/categories`
  );

  onValue(catRef, (snapshot) => {
    const data = snapshot.val();

    if (data) {
      setCategories(data);
    } else {
      // initialiser avec défaut
      set(catRef, DEFAULT_CATEGORIES);
    }
  });
}, [session]);


  // ---------- NORMALISATION SAFE TX ----------

  const normalizeTransaction = (tx, isPersonal) => ({
    id: tx.id || "",
    type: tx.type || "expense",
    category: tx.category || "",
    amount: Number(tx.amount) || 0,
    date: tx.date || "",
    payer: tx.payer || session?.userName || "",
    isShared: !!tx.isShared,
    isPersonal,
    userShare: Number(tx.userShare) || 0,
    partnerShare: Number(tx.partnerShare) || 0,
    vendor: tx.vendor || "",
  });

  // ---------- ADD / EDIT ----------

  const handleAddTransaction = (tx) => {
    if (!session) return;

    const base = tx.isPersonal
      ? `sessions/${session.code}/personal/${currentUserName}/transactions`
      : `sessions/${session.code}/transactions`;

    if (tx.id) {
      set(ref(database, `${base}/${tx.id}`), tx);
    } else {
      const newRef = push(ref(database, base));
      set(newRef, tx);
    }

    setEditingTransaction(null);
    setActiveTab(tx.isPersonal ? "personal" : "list");
  };

  // ---------- FILTER MONTH ----------

  const filterByMonth = (list) =>
    list.filter((tx) => {
      if (!tx.date) return false;

      const [y, m, d] = tx.date.split("-").map(Number);
      const date = new Date(y, m - 1, d);

      return (
        date.getMonth() === selectedMonth.getMonth() &&
        date.getFullYear() === selectedMonth.getFullYear()
      );
    });

  const shared = useMemo(() => {
    return filterByMonth(
      transactions.filter((tx) => !tx.isPersonal)
    );
  }, [transactions, selectedMonth]);


  const personal = useMemo(() => {
    return filterByMonth(personalTransactions);
  }, [personalTransactions, selectedMonth]);

  // ---------- BALANCE ----------

  const diff = useMemo(() => {
    if (!session) return 0;

    let balance = 0;

    shared.forEach((tx) => {
      if (tx.type !== "expense" || !tx.isShared) return;

      if (tx.payer === session.userName) {
        balance += tx.partnerShare || 0;
      } else {
        balance -= tx.userShare || 0;
      }
    });

    return balance;
  }, [shared, session]);

  // ---------- SYNC CONTEXT ----------

  useEffect(() => {
    const data =
      activeTab === "personal"
        ? [...shared, ...personal]
        : shared;

    setContextTransactions(data);
  }, [activeTab, shared, personal, setContextTransactions]);

  if (!isSetup) return <Setup onComplete={handleSetupComplete} />;

  // ---------- UI ----------

  return (
    <div className="app-container">
      <div className="header">
        <h1>💰 BudgetDuo</h1>
        <button
  onClick={() => setActiveTab("config")}
  className="config-btn"
>
  ⚙️
</button>


        <p className="header-users">
          {session.userName} & {session.partnerName}
        </p>

        <div className="header-month-selector">
          <button
            className="header-month-btn"
            onClick={() =>
              setSelectedMonth((d) => {
                const x = new Date(d);
                x.setMonth(x.getMonth() - 1);
                return x;
              })
            }
          >
            ←
          </button>

          <div className="header-month-display">
            <span className="header-month-text">
              {selectedMonth.toLocaleDateString("fr-CA", {
                year: "numeric",
                month: "long",
              })}
            </span>

            <button
              className="header-today-btn"
              onClick={() => setSelectedMonth(new Date())}
            >
              Aujourd'hui
            </button>
          </div>

          <button
            className="header-month-btn"
            onClick={() =>
              setSelectedMonth((d) => {
                const x = new Date(d);
                x.setMonth(x.getMonth() + 1);
                return x;
              })
            }
          >
            →
          </button>
        </div>

        <div className="balance-indicator">
          {Math.abs(diff) < 0.01
            ? "Équilibré"
            : diff > 0
            ? `${session.partnerName} doit ${diff.toFixed(2)}$ à ${session.userName}`
            : `${session.userName} doit ${Math.abs(diff).toFixed(2)}$ à ${session.partnerName}`}
        </div>
      </div>

 <div className="tabs-navigation">
  <button onClick={() => setActiveTab("add")}>➕ Ajouter</button>
  <button onClick={() => setActiveTab("list")}>📋 Liste</button>
  <button onClick={() => setActiveTab("personal")}>👤 Personnel</button>
</div>


<div className="tab-content">

  {activeTab === "config" && (
  <ConfigCategories
    session={session}
    categories={categories}
  />
)}


  {activeTab === "add" && (
    <TransactionForm
      session={session}
      categories={categories}
      onSubmit={handleAddTransaction}
      editingTransaction={editingTransaction}
      onCancelEdit={() => setEditingTransaction(null)}
    />
  )}


        {activeTab === "list" && (
<>



<TransactionList
  transactions={shared}
  session={session}
  categories={categories}
  onEdit={(tx) => {
    setEditingTransaction(
      normalizeTransaction(tx, false)
    );
    setActiveTab("add");
  }}
/>

</>
)}

        {activeTab === "personal" && (
<>



<TransactionList
  transactions={personal}
  session={session}
  categories={categories}
  onEdit={(tx) => {
    setEditingTransaction(
      normalizeTransaction(tx, true)
    );
    setActiveTab("add");
  }}
/>

</>
)}
      </div>
    </div>
  );
}

export default App;
