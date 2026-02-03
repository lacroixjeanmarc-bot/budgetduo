// ========== FORMATAGE DES DATES ET MONTANTS ==========

/**
 * Formate un montant en devise
 * @param {number} amount - Montant à formater
 * @param {string} currency - Code devise (CAD, USD, EUR)
 * @returns {string} Montant formaté (ex: "1 234,56 $")
 */
export function formatAmount(amount, currency = 'CAD') {
    const symbols = {
        'CAD': '$',
        'USD': '$',
        'EUR': '€'
    };

    const formatted = Math.abs(amount).toLocaleString('fr-CA', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return `${formatted} ${symbols[currency] || '$'}`;
}

/**
 * Formate une date en format lisible
 * @param {string} dateString - Date en format ISO (YYYY-MM-DD)
 * @returns {string} Date formatée (ex: "15 janvier 2025")
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    
    return date.toLocaleDateString('fr-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Formate une date en format court
 * @param {string} dateString - Date en format ISO (YYYY-MM-DD)
 * @returns {string} Date formatée (ex: "15 jan.")
 */
export function formatDateShort(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString + 'T00:00:00');
    
    return date.toLocaleDateString('fr-CA', {
        day: 'numeric',
        month: 'short'
    });
}

/**
 * Obtient le mois et l'année d'une date
 * @param {Date} date - Objet Date
 * @returns {string} Mois et année (ex: "Janvier 2025")
 */
export function getMonthYear(date) {
    return date.toLocaleDateString('fr-CA', {
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Obtient le premier jour du mois
 * @param {Date} date - Objet Date
 * @returns {Date} Premier jour du mois
 */
export function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Obtient le dernier jour du mois
 * @param {Date} date - Objet Date
 * @returns {Date} Dernier jour du mois
 */
export function getLastDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Formate une date en ISO (YYYY-MM-DD)
 * @param {Date} date - Objet Date
 * @returns {string} Date en format ISO
 */
export function formatDateISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}