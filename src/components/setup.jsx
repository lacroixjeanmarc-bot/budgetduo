import { useState } from 'react';
import './Setup.css';

function Setup({ onComplete }) {
    const [step, setStep] = useState(1);
    const [sessionCode, setSessionCode] = useState('');
    const [userName, setUserName] = useState('');
    const [partnerName, setPartnerName] = useState('');
    const [currency, setCurrency] = useState('CAD');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (step === 1) {
            if (sessionCode.trim().length >= 4) {
                setStep(2);
            }
        } else if (step === 2) {
            if (userName.trim() && partnerName.trim()) {
                const session = {
                    code: sessionCode.trim().toUpperCase(),
                    userName: userName.trim(),
                    partnerName: partnerName.trim(),
                    currency: currency
                };
                localStorage.setItem('budgetduo_session', JSON.stringify(session));
                onComplete(session);
            }
        }
    };

    return (
        <div className="setup-overlay">
            <div className="setup-container">
                <div className="setup-header">
                    <h1>💰 BudgetDuo</h1>
                    <p className="setup-tagline">Gérez vos finances à deux en toute simplicité</p>
                </div>

                <div className="setup-progress">
                    <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
                    <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                    <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
                </div>

                <form onSubmit={handleSubmit} className="setup-form">
                    {step === 1 && (
                        <div className="setup-step">
                            <h2>Code de session</h2>
                            <p className="setup-description">
                                Créez un code unique pour partager vos finances avec votre partenaire.
                            </p>
                            
                            <input
                                type="text"
                                placeholder="Ex: BUDGET2025"
                                value={sessionCode}
                                onChange={(e) => setSessionCode(e.target.value)}
                                className="setup-input"
                                maxLength="20"
                                autoFocus
                            />
                            
                            <div className="setup-hint">
                                💡 Minimum 4 caractères. Partagez ce code avec votre partenaire.
                            </div>

                            <button 
                                type="submit" 
                                className="btn-primary"
                                disabled={sessionCode.trim().length < 4}
                            >
                                Continuer →
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="setup-step">
                            <h2>Vos informations</h2>
                            <p className="setup-description">
                                Entrez vos prénoms pour personnaliser l'application.
                            </p>

                            <div className="setup-field">
                                <label>Votre prénom</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Jean-Marc"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    className="setup-input"
                                    autoFocus
                                />
                            </div>

                            <div className="setup-field">
                                <label>Prénom de votre partenaire</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Josée"
                                    value={partnerName}
                                    onChange={(e) => setPartnerName(e.target.value)}
                                    className="setup-input"
                                />
                            </div>

                            <div className="setup-field">
                                <label>Devise</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="setup-select"
                                >
                                    <option value="CAD">$ CAD - Dollar canadien</option>
                                    <option value="USD">$ USD - Dollar américain</option>
                                    <option value="EUR">€ EUR - Euro</option>
                                </select>
                            </div>

                            <div className="setup-buttons">
                                <button 
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="btn-secondary"
                                >
                                    ← Retour
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    disabled={!userName.trim() || !partnerName.trim()}
                                >
                                    Commencer 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default Setup;