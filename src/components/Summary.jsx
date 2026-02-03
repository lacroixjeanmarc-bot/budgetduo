import { useMemo } from 'react';
import { formatAmount } from '../utils/formatters';
import './Summary.css';

function Summary({ transactions, session, categories }) {
    // Calcul des statistiques
    const stats = useMemo(() => {
        let totalExpenses = 0;
        let totalIncome = 0;
        let userExpenses = 0;
        let partnerExpenses = 0;
        let categoryTotals = {};

        transactions.forEach(tx => {
            if (tx.type === 'expense') {
                totalExpenses += tx.amount;
                
                // Calcul par personne
                if (tx.isShared) {
                    userExpenses += tx.userShare || (tx.amount / 2);
                    partnerExpenses += tx.partnerShare || (tx.amount / 2);
                } else {
                    if (tx.payer === session.userName) {
                        userExpenses += tx.amount;
                    } else {
                        partnerExpenses += tx.amount;
                    }
                }

                // Par catégorie
                const category = tx.category || 'other';
                categoryTotals[category] = (categoryTotals[category] || 0) + tx.amount;
            } else if (tx.type === 'income') {
                totalIncome += tx.amount;
            }
        });

        const balance = totalIncome - totalExpenses;
        const userBalance = totalIncome / 2 - userExpenses;
        const partnerBalance = totalIncome / 2 - partnerExpenses;

        // Qui doit quoi à qui
        let owes = null;
        if (Math.abs(userBalance - partnerBalance) > 0.01) {
            if (userBalance < partnerBalance) {
                owes = {
                    from: session.userName,
                    to: session.partnerName,
                    amount: Math.abs(userBalance - partnerBalance) / 2
                };
            } else {
                owes = {
                    from: session.partnerName,
                    to: session.userName,
                    amount: Math.abs(userBalance - partnerBalance) / 2
                };
            }
        }

        return {
            totalExpenses,
            totalIncome,
            balance,
            userExpenses,
            partnerExpenses,
            categoryTotals,
            owes
        };
    }, [transactions, session]);

    return (
        <div className="summary-container">
            <h2>📊 Résumé du mois</h2>

            {/* Totaux principaux */}
            <div className="summary-cards">
                <div className="summary-card expense">
                    <div className="card-icon">💸</div>
                    <div className="card-content">
                        <div className="card-label">Dépenses totales</div>
                        <div className="card-value">{formatAmount(stats.totalExpenses, session.currency)}</div>
                    </div>
                </div>

                <div className="summary-card income">
                    <div className="card-icon">💰</div>
                    <div className="card-content">
                        <div className="card-label">Revenus totaux</div>
                        <div className="card-value">{formatAmount(stats.totalIncome, session.currency)}</div>
                    </div>
                </div>

                <div className={`summary-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
                    <div className="card-icon">{stats.balance >= 0 ? '📈' : '📉'}</div>
                    <div className="card-content">
                        <div className="card-label">Solde</div>
                        <div className="card-value">{formatAmount(stats.balance, session.currency)}</div>
                    </div>
                </div>
            </div>

            {/* Dépenses par personne */}
            <div className="summary-section">
                <h3>👥 Dépenses par personne</h3>
                <div className="person-expenses">
                    <div className="person-item">
                        <span className="person-name">{session.userName}</span>
                        <span className="person-amount">{formatAmount(stats.userExpenses, session.currency)}</span>
                    </div>
                    <div className="person-item">
                        <span className="person-name">{session.partnerName}</span>
                        <span className="person-amount">{formatAmount(stats.partnerExpenses, session.currency)}</span>
                    </div>
                </div>

                {/* Qui doit quoi */}
                {stats.owes && (
                    <div className="owes-alert">
                        <span className="owes-icon">💳</span>
                        <span className="owes-text">
                            <strong>{stats.owes.from}</strong> doit{' '}
                            <strong>{formatAmount(stats.owes.amount, session.currency)}</strong> à{' '}
                            <strong>{stats.owes.to}</strong>
                        </span>
                    </div>
                )}
            </div>

            {/* Par catégorie */}
            {Object.keys(stats.categoryTotals).length > 0 && (
                <div className="summary-section">
                    <h3>📂 Par catégorie</h3>
                    <div className="category-list">
                        {Object.entries(stats.categoryTotals)
                            .sort((a, b) => b[1] - a[1])
                            .map(([categoryKey, amount]) => {
                                const category = categories[categoryKey];
                                const percentage = (amount / stats.totalExpenses) * 100;
                                
                                return (
                                    <div key={categoryKey} className="category-item">
                                        <div className="category-info">
                                            <span className="category-icon">
                                                {category?.icon || '📦'}
                                            </span>
                                            <span className="category-name">
                                                {category?.name || categoryKey}
                                            </span>
                                        </div>
                                        <div className="category-stats">
                                            <div className="category-bar-container">
                                                <div 
                                                    className="category-bar"
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="category-amount">
                                                {formatAmount(amount, session.currency)}
                                            </span>
                                            <span className="category-percentage">
                                                {percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* État vide */}
            {transactions.length === 0 && (
                <div className="summary-empty">
                    <p>Aucune transaction ce mois-ci.</p>
                    <p>Ajoutez des transactions pour voir les statistiques !</p>
                </div>
            )}
        </div>
    );
}

export default Summary;