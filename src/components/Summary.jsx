import { useTransactions } from '../context/TransactionContext';
import { useMemo } from 'react';
import { formatAmount } from '../utils/formatters';
import './Summary.css';

function Summary({ session, categories }) {
  const { transactions } = useTransactions();

  //console.log("transactions:", transactions);
  console.error("SUMMARY RENDER", transactions);

    // Calcul des statistiques
    const stats = useMemo(() => {
        let totalExpenses = 0;
        let totalIncome = 0;
        let userExpenses = 0;
        let transferAdjustment = 0;
        let partnerExpenses = 0;
        let personalExpenses = 0;
        let categoryTotals = {};
        let netBalance = 0;

       transactions.forEach(tx => {

    if (tx.type === 'expense') {
        totalExpenses += tx.amount;

        if (tx.isPersonal) {
            personalExpenses += tx.amount;
        } else {
           if (tx.isShared) {
    const userShare = tx.userShare || tx.amount / 2;
    const partnerShare = tx.partnerShare || tx.amount / 2;

    if (tx.payer === session.userName) {
        netBalance += partnerShare;
    } else {
        netBalance -= userShare;
    }

    userExpenses += userShare;
    partnerExpenses += partnerShare;
}
else {
    // Dépense non partagée
    if (tx.payer === session.userName) {
        userExpenses += tx.amount;
    } else {
        partnerExpenses += tx.amount;
    }
}

        }

        const category = tx.category || 'other';
        categoryTotals[category] =
            (categoryTotals[category] || 0) + tx.amount;
    }

    else if (tx.type === 'income') {
        totalIncome += tx.amount;
    }

    else if (tx.type === 'transfer') {
    if (tx.payer === session.userName) {
        netBalance -= tx.amount;
    } else {
        netBalance += tx.amount;
    }
}

});

        const myTotalExpenses = personalExpenses + userExpenses;
       const balance = netBalance;
        return {
            totalExpenses,
            totalIncome,
            balance,
            personalExpenses,
            userExpenses,
            myTotalExpenses,
            categoryTotals
        };
    }, [transactions, session]);

    // Détermine si on affiche les stats personnelles ou partagées
    const isPersonalView = transactions.some(tx => tx.isPersonal);

    return (
        <div className="summary-container-minimal">
            <div className="summary-list">
                {isPersonalView ? (
                    <>
                        {/* Vue Personnelle */}
                        <div className="summary-item">
                            <span className="summary-icon">🌱</span>
                            <span className="summary-label">Dépenses personnelles</span>
                            <span className="summary-value expense">{formatAmount(stats.personalExpenses, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">👥</span>
                            <span className="summary-label">Dépenses partagées (ma part)</span>
                            <span className="summary-value expense">{formatAmount(stats.userExpenses, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">💰</span>
                            <span className="summary-label">Total dépenses</span>
                            <span className="summary-value expense">{formatAmount(stats.myTotalExpenses, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">💵</span>
                            <span className="summary-label">Revenus</span>
                            <span className="summary-value income">+{formatAmount(stats.totalIncome, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">📊</span>
                            <span className="summary-label">Balance</span>
                            <span className={`summary-value ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
                                {formatAmount(stats.balance, session.currency)}
                            </span>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Vue Partagée */}
                        
                        <div className="summary-item">
                            <span className="summary-icon">👥</span>
                            <span className="summary-label">Dépenses partagées (ma part)</span>
                            <span className="summary-value expense">{formatAmount(stats.userExpenses, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">💰</span>
                            <span className="summary-label">Total dépenses</span>
                            <span className="summary-value expense">{formatAmount(stats.totalExpenses, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">💵</span>
                            <span className="summary-label">Revenus</span>
                            <span className="summary-value income">+{formatAmount(stats.totalIncome, session.currency)}</span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon">📊</span>
                            <span className="summary-label">Balance</span>
                            <span className={`summary-value ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
                                {formatAmount(stats.balance, session.currency)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Top catégories avec graphique */}
            {Object.keys(stats.categoryTotals).length > 0 && (
                <div className="category-section-minimal">
                    <div className="category-list-minimal">
                        {Object.entries(stats.categoryTotals)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([categoryKey, amount]) => {
                                const category = categories[categoryKey];
                                const percentage = (amount / (stats.totalExpenses || 1)) * 100;
                                
                                return (
                                    <div key={categoryKey} className="category-item-minimal">
                                        <div className="category-info-minimal">
                                            <span className="category-icon-minimal">
                                                {category?.icon || '📦'}
                                            </span>
                                            <span className="category-name-minimal">
                                                {category?.name || categoryKey}
                                            </span>
                                        </div>
                                        <div className="category-stats-minimal">
                                            <div className="category-bar-container-minimal">
                                                <div 
                                                    className="category-bar-minimal"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="category-amount-minimal">
                                                {formatAmount(amount, session.currency)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Summary;