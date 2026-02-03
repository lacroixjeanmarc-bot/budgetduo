import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue } from 'firebase/database';
import Setup from './components/Setup';
import './App.css';

function App() {
  const [isSetup, setIsSetup] = useState(false);
  const [session, setSession] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Vérifie si une session existe au démarrage
  useEffect(() => {
    const savedSession = localStorage.getItem('budgetduo_session');
    if (savedSession) {
      const sessionData = JSON.parse(savedSession);
      setSession(sessionData);
      setIsSetup(true);
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
    }
  }, [session]);

  // Callback quand le setup est complété
  const handleSetupComplete = (sessionData) => {
    setSession(sessionData);
    setIsSetup(true);
  };

  // Si pas encore configuré, affiche le Setup
  if (!isSetup) {
    return <Setup onComplete={handleSetupComplete} />;
  }

  // Interface principale (temporaire pour tester)
  return (
    <div className="app-container">
      <div className="header">
        <h1>💰 BudgetDuo</h1>
        <p className="header-users">{session.userName} & {session.partnerName}</p>
      </div>

      <div className="test-section">
        <h2>✅ Configuration terminée !</h2>
        <div className="session-info">
          <p><strong>Code de session:</strong> {session.code}</p>
          <p><strong>Utilisateurs:</strong> {session.userName} & {session.partnerName}</p>
          <p><strong>Devise:</strong> {session.currency}</p>
          <p><strong>Transactions:</strong> {transactions.length}</p>
        </div>

        <button 
          onClick={() => {
            localStorage.removeItem('budgetduo_session');
            setIsSetup(false);
            setSession(null);
          }}
          className="btn-secondary"
          style={{ marginTop: '20px' }}
        >
          🔄 Réinitialiser la configuration
        </button>
      </div>
    </div>
  );
}

export default App;