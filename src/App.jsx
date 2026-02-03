import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, push, set } from 'firebase/database';
import { DEFAULT_CATEGORIES, AVAILABLE_ICONS } from './constants/categories';
import { cryptoManager } from './utils/encryption';
import { formatAmount, formatDate } from './utils/formatters';
import { exportToExcel } from './utils/export';
import './App.css';

function App() {
  // États de base pour tester
  const [sessionCode, setSessionCode] = useState('TEST123');
  const [userName, setUserName] = useState('Jean-Marc');
  const [partnerName, setPartnerName] = useState('Josée');
  const [transactions, setTransactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Test de connexion Firebase
  useEffect(() => {
    console.log('🔥 Firebase initialisé');
    console.log('📊 Database:', database);
    setIsConnected(true);
  }, []);

  // Test de chargement des transactions
  useEffect(() => {
    if (sessionCode) {
      const transactionsRef = ref(database, `sessions/${sessionCode}/transactions`);
      
      onValue(transactionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const transactionsList = Object.entries(data).map(([id, trans]) => ({
            id,
            ...trans
          }));
          setTransactions(transactionsList);
          console.log('✅ Transactions chargées:', transactionsList.length);
        } else {
          setTransactions([]);
          console.log('ℹ️ Aucune transaction');
        }
      });
    }
  }, [sessionCode]);

  // Test d'ajout d'une transaction
  const addTestTransaction = () => {
    const transactionsRef = ref(database, `sessions/${sessionCode}/transactions`);
    const newTransactionRef = push(transactionsRef);
    
    const transaction = {
      type: 'expense',
      amount: 25.50,
      vendor: 'Test Restaurant',
      category: 'restaurants',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      payer: userName,
      isShared: true,
      userShare: 12.75,
      partnerShare: 12.75
    };

    set(newTransactionRef, transaction);
    console.log('✅ Transaction test ajoutée');
  };

  // Test d'export Excel
  const testExport = () => {
    if (transactions.length > 0) {
      exportToExcel(transactions, DEFAULT_CATEGORIES, 'CAD', userName, partnerName);
      console.log('✅ Export Excel lancé');
    } else {
      console.log('⚠️ Aucune transaction à exporter');
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>🧪 BudgetDuo - Test Modulaire</h1>
        <p>Version React avec modules séparés</p>
      </div>

      <div className="test-section">
        <h2>📡 Status de connexion</h2>
        <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '✅ Firebase connecté' : '❌ Firebase déconnecté'}
        </div>
        
        <div className="session-info">
          <p><strong>Session:</strong> {sessionCode}</p>
          <p><strong>Utilisateurs:</strong> {userName} & {partnerName}</p>
          <p><strong>Transactions:</strong> {transactions.length}</p>
        </div>
      </div>

      <div className="test-section">
        <h2>🧪 Tests des modules</h2>
        
        <button onClick={addTestTransaction} className="btn-primary">
          ➕ Ajouter une transaction test
        </button>

        <button 
          onClick={testExport} 
          className="btn-secondary"
          disabled={transactions.length === 0}
        >
          📊 Tester export Excel
        </button>

        <div className="module-status">
          <p>✅ CryptoManager chargé</p>
          <p>✅ Formatters chargés</p>
          <p>✅ Export chargé</p>
          <p>✅ Catégories chargées ({Object.keys(DEFAULT_CATEGORIES).length})</p>
          <p>✅ Icônes disponibles ({AVAILABLE_ICONS.length})</p>
        </div>
      </div>

      <div className="test-section">
        <h2>📋 Transactions</h2>
        {transactions.length === 0 ? (
          <p>Aucune transaction pour le moment</p>
        ) : (
          <div className="transactions-list">
            {transactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div>
                  <strong>{tx.vendor}</strong>
                  <br />
                  <small>{formatDate(tx.date)}</small>
                </div>
                <div className="amount">
                  {formatAmount(tx.amount, 'CAD')}
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