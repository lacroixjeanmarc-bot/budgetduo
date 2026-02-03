import { useState, useEffect } from 'react';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import './TransactionForm.css';

function TransactionForm({ 
    session, 
    categories = DEFAULT_CATEGORIES,
    onSubmit,
    editingTransaction = null,
    onCancelEdit = null
}) {
    const [transactionType, setTransactionType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [vendor, setVendor] = useState('');
    const [category, setCategory] = useState('groceries');
    const [date, setDate] = useState('');
    const [payer, setPayer] = useState(session.userName);
    const [beneficiary, setBeneficiary] = useState(session.userName);
    const [isShared, setIsShared] = useState(true);
    const [isPersonal, setIsPersonal] = useState(false);
    const [customAmounts, setCustomAmounts] = useState(false);
    const [userCustomAmount, setUserCustomAmount] = useState('');
    const [partnerCustomAmount, setPartnerCustomAmount] = useState('');

    // Initialise la date à aujourd'hui
    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setDate(`${year}-${month}-${day}`);
    }, []);

    // Charge la transaction à éditer
    useEffect(() => {
        if (editingTransaction) {
            setTransactionType(editingTransaction.type);
            setAmount(editingTransaction.amount.toString());
            setVendor(editingTransaction.vendor);
            setCategory(editingTransaction.category);
            setDate(editingTransaction.date);
            setPayer(editingTransaction.payer);
            setBeneficiary(editingTransaction.beneficiary);
            setIsShared(editingTransaction.isShared || false);
            setIsPersonal(editingTransaction.isPersonal || false);
            
            if (editingTransaction.userShare && editingTransaction.partnerShare) {
                const totalAmount = editingTransaction.amount;
                const half = totalAmount / 2;
                if (Math.abs(editingTransaction.userShare - half) > 0.01) {
                    setCustomAmounts(true);
                    setUserCustomAmount(editingTransaction.userShare.toString());
                    setPartnerCustomAmount(editingTransaction.partnerShare.toString());
                }
            }
        }
    }, [editingTransaction]);

    // Ajuste le bénéficiaire pour les transferts
    useEffect(() => {
        if (transactionType === 'transfer') {
            setBeneficiary(payer === session.userName ? session.partnerName : session.userName);
        }
    }, [transactionType, payer, session.userName, session.partnerName]);

    // Calcul automatique des montants personnalisés
    useEffect(() => {
        if (customAmounts && amount) {
            const totalAmount = parseFloat(amount);
            if (!isNaN(totalAmount)) {
                if (userCustomAmount && userCustomAmount !== '') {
                    const userAmt = parseFloat(userCustomAmount);
                    if (!isNaN(userAmt)) {
                        setPartnerCustomAmount((totalAmount - userAmt).toFixed(2));
                    }
                } else if (partnerCustomAmount && partnerCustomAmount !== '') {
                    const partnerAmt = parseFloat(partnerCustomAmount);
                    if (!isNaN(partnerAmt)) {
                        setUserCustomAmount((totalAmount - partnerAmt).toFixed(2));
                    }
                }
            }
        }
    }, [customAmounts, amount, userCustomAmount, partnerCustomAmount]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!amount || !vendor || !date) {
            alert('Veuillez remplir tous les champs obligatoires');
            return;
        }

        const transaction = {
            type: transactionType,
            amount: parseFloat(amount),
            vendor: vendor.trim(),
            category,
            date,
            timestamp: editingTransaction ? editingTransaction.timestamp : Date.now(),
            payer,
            beneficiary,
            isShared: transactionType === 'expense' ? isShared : false,
            isPersonal
        };

        // Calcul des parts si dépense partagée
        if (transactionType === 'expense' && isShared) {
            const totalAmount = parseFloat(amount);
            if (customAmounts) {
                transaction.userShare = parseFloat(userCustomAmount) || 0;
                transaction.partnerShare = parseFloat(partnerCustomAmount) || 0;
            } else {
                transaction.userShare = totalAmount / 2;
                transaction.partnerShare = totalAmount / 2;
            }
        }

        // Si on édite, on ajoute l'ID
        if (editingTransaction) {
            transaction.id = editingTransaction.id;
        }

        onSubmit(transaction);

        // Reset du formulaire
        setAmount('');
        setVendor('');
        setCategory('groceries');
        setCustomAmounts(false);
        setUserCustomAmount('');
        setPartnerCustomAmount('');
        
        if (onCancelEdit) {
            onCancelEdit();
        }
    };

    return (
        <div className="transaction-form-container">
            <h2>{editingTransaction ? '✏️ Modifier la transaction' : '➕ Nouvelle transaction'}</h2>
            
            <form onSubmit={handleSubmit} className="transaction-form">
                {/* Type de transaction */}
                <div className="form-type-selector">
                    <button
                        type="button"
                        className={`type-btn ${transactionType === 'expense' ? 'active expense' : ''}`}
                        onClick={() => setTransactionType('expense')}
                    >
                        💸 Dépense
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${transactionType === 'income' ? 'active income' : ''}`}
                        onClick={() => setTransactionType('income')}
                    >
                        💰 Revenu
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${transactionType === 'transfer' ? 'active transfer' : ''}`}
                        onClick={() => setTransactionType('transfer')}
                    >
                        🔄 Transfert
                    </button>
                </div>

                {/* Montant */}
                <div className="form-field">
                    <label>Montant ({session.currency})</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="form-input"
                        required
                    />
                </div>

                {/* Vendeur/Description */}
                <div className="form-field">
                    <label>
                        {transactionType === 'expense' ? 'Vendeur' : 
                         transactionType === 'income' ? 'Source' : 'Description'}
                    </label>
                    <input
                        type="text"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                        placeholder={transactionType === 'expense' ? 'Ex: Supermarché' : 
                                   transactionType === 'income' ? 'Ex: Salaire' : 'Ex: Remboursement'}
                        className="form-input"
                        required
                    />
                </div>

                {/* Catégorie */}
                <div className="form-field">
                    <label>Catégorie</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="form-select"
                    >
                        {Object.entries(categories).map(([key, cat]) => (
                            <option key={key} value={key}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div className="form-field">
                    <label>Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="form-input"
                        required
                    />
                </div>

                {/* Payeur (pour dépenses et transferts) */}
                {(transactionType === 'expense' || transactionType === 'transfer') && (
                    <div className="form-field">
                        <label>{transactionType === 'expense' ? 'Payé par' : 'De'}</label>
                        <select
                            value={payer}
                            onChange={(e) => setPayer(e.target.value)}
                            className="form-select"
                        >
                            <option value={session.userName}>{session.userName}</option>
                            <option value={session.partnerName}>{session.partnerName}</option>
                        </select>
                    </div>
                )}

                {/* Bénéficiaire (pour revenus) */}
                {transactionType === 'income' && (
                    <div className="form-field">
                        <label>Bénéficiaire</label>
                        <select
                            value={beneficiary}
                            onChange={(e) => setBeneficiary(e.target.value)}
                            className="form-select"
                        >
                            <option value={session.userName}>{session.userName}</option>
                            <option value={session.partnerName}>{session.partnerName}</option>
                        </select>
                    </div>
                )}

                {/* Partage (pour dépenses uniquement) */}
                {transactionType === 'expense' && (
                    <>
                        <div className="form-checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isShared}
                                    disabled={isPersonal}
                                    onChange={(e) => {
                                        setIsShared(e.target.checked);
                                        if (!e.target.checked) {
                                            setCustomAmounts(false);
                                            setUserCustomAmount('');
                                            setPartnerCustomAmount('');
                                        }
                                    }}
                                />
                                <span>Dépense partagée</span>
                            </label>
                        </div>

                        {/* Montants personnalisés */}
                        {isShared && (
                            <div className="form-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={customAmounts}
                                        onChange={(e) => {
                                            setCustomAmounts(e.target.checked);
                                            if (!e.target.checked) {
                                                setUserCustomAmount('');
                                                setPartnerCustomAmount('');
                                            }
                                        }}
                                    />
                                    <span>Montants personnalisés</span>
                                </label>
                            </div>
                        )}

                        {/* Champs montants personnalisés */}
                        {isShared && customAmounts && (
                            <div className="custom-amounts-grid">
                                <div className="form-field">
                                    <label>{session.userName}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={userCustomAmount}
                                        onChange={(e) => setUserCustomAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-field">
                                    <label>{session.partnerName}</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={partnerCustomAmount}
                                        onChange={(e) => setPartnerCustomAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Transaction personnelle */}
                <div className="form-checkbox">
                    <label>
                        <input
                            type="checkbox"
                            checked={isPersonal}
                            onChange={(e) => {
                                setIsPersonal(e.target.checked);
                                if (e.target.checked) {
                                    setIsShared(false);
                                    setCustomAmounts(false);
                                    setUserCustomAmount('');
                                    setPartnerCustomAmount('');
                                }
                            }}
                        />
                        <span>Transaction personnelle (visible uniquement par moi)</span>
                    </label>
                </div>

                {/* Boutons soumettre */}
                <div className="form-buttons">
                    <button type="submit" className="btn-submit">
                        {editingTransaction ? '✅ Enregistrer' : '✅ Ajouter'}
                    </button>
                    {editingTransaction && (
                        <button 
                            type="button" 
                            className="btn-cancel"
                            onClick={() => {
                                setAmount('');
                                setVendor('');
                                setCategory('groceries');
                                setCustomAmounts(false);
                                setUserCustomAmount('');
                                setPartnerCustomAmount('');
                                if (onCancelEdit) {
                                    onCancelEdit();
                                }
                            }}
                        >
                            ❌ Annuler
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default TransactionForm;