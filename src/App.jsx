import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, push, set, remove } from 'firebase/database';
import Setup from './components/Setup';
import TransactionForm from './components/TransactionForm';
import Summary from './components/Summary';
import { DEFAULT_CATEGORIES } from './constants/categories';
import { formatAmount, formatDate } from './utils/formatters';
import './App.css';

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [personalTransactions, setPersonalTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeTab, setActiveTab] = useState('add');
  const [currentUserName, setCurrentUserName] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Vérifie si une session existe au démarrage
  useEffect(() => {
    const savedSession = localStorage.getItem('budgetduo_session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        setSession(sessionData);
        setIsSetup(true);
        setCurrentUserName(sessionData.userName);
      } catch (error) {
        console.error('Session invalide, nettoyage...', error);
        localStorage.removeItem('budgetduo_session');
        setIsSetup(false);
      }
    }
  }, []);

  // Charge les transactions partagées
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

  // Charge les transactions personnelles
  useEffect(() => {
    if (session?.code && currentUserName) {
      const personalRef = ref(database, `sessions/${session.code}/personal/${currentUserName}/transactions`);
      
      onValue(personalRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const personalList = Object.entries(data).map(([id, trans]) => ({
            id,
            ...trans
          }));
          setPersonalTransactions(personalList);
        } else {
          setPersonalTransactions([]);
        }
      });
    }
  }, [session, currentUserName]);

  // Callback quand le setup est complété
  const handleSetupComplete = (sessionData) => {
    setSession(sessionData);
    setIsSetup(true);
    setCurrentUserName(sessionData.userName);
  };

  // Ajoute ou modifie une transaction
  const handleAddTransaction = (transaction) => {
    if (transaction.id) {
      // MODIFICATION d'une transaction existante
      if (transaction.isPersonal) {
        const transactionRef = ref(database, `sessions/${session.code}/personal/${currentUserName}/transactions/${transaction.id}`);
        set(transactionRef, transaction);
      } else {
        const transactionRef = ref(database, `sessions/${session.code}/transactions/${transaction.id}`);
        set(transactionRef, transaction);
      }
    } else {
      // AJOUT d'une nouvelle transaction
      if (transaction.isPersonal) {
        const personalRef = ref(database, `sessions/${session.code}/personal/${currentUserName}/transactions`);
        const newTransactionRef = push(personalRef);
        set(newTransactionRef, transaction);
      } else {
        const transactionsRef = ref(database, `sessions/${session.code}/transactions`);
        const newTransactionRef = push(transactionsRef);
        set(newTransactionRef, transaction);
      }
    }
    
    // Réinitialise l'édition
    setEditingTransaction(null);
    setActiveTab(transaction.isPersonal ? 'personal' : 'list');
  };

  // Commence l'édition d'une transaction
  const handleEditTransaction = (transaction, isPersonal) => {
    setEditingTransaction({ ...transaction, isPersonal });
    setActiveTab('add');
  };

  // Si pas encore configuré, affiche le Setup
  if (!isSetup) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  // Filtrer les transactions partagées
  const sharedTransactions = transactions.filter(tx => !tx.isPersonal);

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

      {/* Navigation par onglets */}
      <div className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Ajouter
        </button>
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Liste {sharedTransactions.length > 0 && `(${sharedTransactions.length})`}
        </button>
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          👤 Personnel {personalTransactions.length > 0 && `(${personalTransactions.length})`}
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="tab-content">
        {/* Onglet Ajouter */}
        {activeTab === 'add' && (
          <TransactionForm 
            session={session}
            categories={categories}
            onSubmit={handleAddTransaction}
            editingTransaction={editingTransaction}
            onCancelEdit={() => setEditingTransaction(null)}
          />
        )}

        {/* Onglet Liste (transactions partagées) */}
        {activeTab === 'list' && (
          <>
            <Summary 
              transactions={sharedTransactions}
              session={session}
              categories={categories}
            />
            
            <div className="transactions-section">
              <h2>📋 Transactions partagées</h2>
              {sharedTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune transaction partagée.</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {(() => {
                    // Grouper les transactions par date
                    const groupedByDate = {};
                    sharedTransactions
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .forEach(tx => {
                        const dateKey = tx.date;
                        if (!groupedByDate[dateKey]) {
                          groupedByDate[dateKey] = [];
                        }
                        groupedByDate[dateKey].push(tx);
                      });

                    return Object.entries(groupedByDate).map(([date, txs]) => (
                      <div key={date} className="transaction-date-group">
                        <div className="transaction-date-header">{formatDate(date)}</div>
                        {txs.map(tx => (
                          <div key={tx.id} className="transaction-item-compact">
                            <div className="transaction-icon-compact">
                              {categories[tx.category]?.icon || '📦'}
                            </div>
                            <div className="transaction-details-compact">
                              <div className="transaction-vendor-compact">{tx.vendor}</div>
                              <div className="transaction-payer">Payé par {tx.payer}</div>
                            </div>
                            <div className={`transaction-amount-compact ${tx.type}`}>
                              {formatAmount(tx.amount, session.currency)}
                            </div>
                            <button
                              className="btn-edit-compact"
                              onClick={() => handleEditTransaction(tx, false)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Onglet Personnel */}
        {activeTab === 'personal' && (
          <>
            <Summary 
              transactions={[...transactions, ...personalTransactions]}
              session={session}
              categories={categories}
            />
            
            <div className="transactions-section">
              <h2>👤 Transactions personnelles</h2>
              {personalTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>Aucune transaction personnelle.</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {(() => {
                    const groupedByDate = {};
                    personalTransactions
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .forEach(tx => {
                        const dateKey = tx.date;
                        if (!groupedByDate[dateKey]) {
                          groupedByDate[dateKey] = [];
                        }
                        groupedByDate[dateKey].push(tx);
                      });

                    return Object.entries(groupedByDate).map(([date, txs]) => (
                      <div key={date} className="transaction-date-group">
                        <div className="transaction-date-header">{formatDate(date)}</div>
                        {txs.map(tx => (
                          <div key={tx.id} className="transaction-item-compact">
                            <div className="transaction-icon-compact">
                              {categories[tx.category]?.icon || '📦'}
                            </div>
                            <div className="transaction-details-compact">
                              <div className="transaction-vendor-compact">{tx.vendor}</div>
                              <div className="transaction-payer">Payé par {tx.payer}</div>
                            </div>
                            <div className={`transaction-amount-compact ${tx.type}`}>
                              {formatAmount(tx.amount, session.currency)}
                            </div>
                            <button
                              className="btn-edit-compact"
                              onClick={() => handleEditTransaction(tx, true)}
                              title="Modifier"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;