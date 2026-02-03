import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, push, set } from 'firebase/database';
import Setup from './components/Setup';
import TransactionForm from './components/TransactionForm';
import { DEFAULT_CATEGORIES } from './constants/categories';
import { formatAmount, formatDate } from './utils/formatters';
import './App.css';
import Summary from './components/Summary';

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  // Vérifie si une session existe au démarrage
  useEffect(() => {
    const savedSession = localStorage.getItem('budgetduo_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setSession(sessionData);
        setIsSetup(true);
      } catch (error) {
        console.error('Session invalide, nettoyage...', error);
        localStorage.removeItem('budgetduo_session');
        setIsSetup(false);
      }
    }
  }, []);

  // Charge les transactions quand la session est prête
  useEffect(() => {
    if (session?.code) {
      const transactionsRef = ref(database, `sessions/${session.code}/transactions`);
      
      onValue(transactionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const transactionsList = Object.entries(data).map(([id, trans]) => ({
            id,
            ...trans
          }));
          setTransactions(transactionsList);
        } else {
          setTransactions([]);
        }
      });

      // Charge les catégories
      const categoriesRef = ref(database, `sessions/${session.code}/categories`);
      onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setCategories(data);
        } else {
          set(categoriesRef, DEFAULT_CATEGORIES);
        }
      });
    }
  }, [session]);

  // Callback quand le setup est complété
  const handleSetupComplete = (sessionData) => {
    setSession(sessionData);
    setIsSetup(true);
  };

  // Ajoute une transaction
  const handleAddTransaction = (transaction) => {
    const transactionsRef = ref(database, `sessions/${session.code}/transactions`);
    const newTransactionRef = push(transactionsRef);
    set(newTransactionRef, transaction);
    console.log('✅ Transaction ajoutée:', transaction);
  };

  // Si pas encore configuré, affiche le Setup
  if (!isSetup) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  // Interface principale
  return (
    <div className="app-container">
      <div className="header">
        <h1>💰 BudgetDuo</h1>
        <p className="header-users">{session.userName} & {session.partnerName}</p>
        <button 
          onClick={() => {
            if (confirm('Voulez-vous vraiment réinitialiser la configuration ?')) {
              localStorage.removeItem('budgetduo_session');
              setIsSetup(false);
              setSession(null);
            }
          }}
          className="header-settings-button"
          title="Réinitialiser"
        >
          ⚙️
        </button>
      </div>

      {/* Formulaire de transaction */}
      <TransactionForm 
        session={session}
        categories={categories}
        onSubmit={handleAddTransaction}
      />

      {/* Résumé/Statistiques */}
      <Summary 
        transactions={transactions}
        session={session}
        categories={categories}
      />

      {/* Liste des transactions */}
      <div className="transactions-section">
        <h2>📋 Transactions ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>Aucune transaction pour le moment.</p>
            <p>Ajoutez votre première transaction ci-dessus ! 👆</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(tx => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-icon">
                    {categories[tx.category]?.icon || '📦'}
                  </div>
                  <div className="transaction-details">
                    <div className="transaction-vendor">{tx.vendor}</div>
                    <div className="transaction-meta">
                      {formatDate(tx.date)} • {categories[tx.category]?.name || tx.category}
                      {tx.isShared && ' • Partagé'}
                      {tx.isPersonal && ' • Personnel'}
                    </div>
                  </div>
                  <div className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'income' && '+'}
                    {tx.type === 'expense' && '-'}
                    {formatAmount(tx.amount, session.currency)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;