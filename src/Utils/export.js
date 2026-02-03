// ========== EXPORT EXCEL ==========
import * as XLSX from 'xlsx';
import { formatAmount, formatDate } from './formatters';

/**
 * Exporte les transactions en fichier Excel
 * @param {Array} transactions - Liste des transactions à exporter
 * @param {Object} categories - Catégories disponibles
 * @param {string} currency - Devise (CAD, USD, EUR)
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} partnerName - Nom du partenaire
 */
export function exportToExcel(transactions, categories, currency, userName, partnerName) {
    // Prépare les données pour Excel
    const excelData = transactions.map(tx => {
        const categoryName = categories[tx.category]?.name || tx.category || 'N/A';
        
        let row = {
            'Date': formatDate(tx.date),
            'Type': getTypeLabel(tx.type),
            'Vendeur/Description': tx.vendor || 'N/A',
            'Catégorie': categoryName,
            'Montant': formatAmount(tx.amount, currency)
        };

        // Ajoute les colonnes spécifiques selon le type
        if (tx.type === 'expense') {
            row['Payé par'] = tx.payer || 'N/A';
            row['Partagé'] = tx.isShared ? 'Oui' : 'Non';
            
            if (tx.isShared) {
                row[`Part ${userName}`] = formatAmount(tx.userShare || 0, currency);
                row[`Part ${partnerName}`] = formatAmount(tx.partnerShare || 0, currency);
            }
        } else if (tx.type === 'income') {
            row['Bénéficiaire'] = tx.beneficiary || 'N/A';
        } else if (tx.type === 'transfer') {
            row['De'] = tx.payer || 'N/A';
            row['Vers'] = tx.beneficiary || 'N/A';
        }

        return row;
    });

    // Crée le classeur Excel
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    // Ajuste la largeur des colonnes
    const columnWidths = [
        { wch: 12 }, // Date
        { wch: 12 }, // Type
        { wch: 25 }, // Vendeur
        { wch: 15 }, // Catégorie
        { wch: 12 }, // Montant
        { wch: 12 }, // Payé par / Bénéficiaire / De
        { wch: 10 }, // Partagé / Vers
        { wch: 12 }, // Part utilisateur
        { wch: 12 }  // Part partenaire
    ];
    worksheet['!cols'] = columnWidths;

    // Génère le nom de fichier avec la date
    const today = new Date();
    const fileName = `BudgetDuo_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;

    // Télécharge le fichier
    XLSX.writeFile(workbook, fileName);
}

/**
 * Obtient le label d'un type de transaction
 * @param {string} type - Type de transaction
 * @returns {string} Label traduit
 */
function getTypeLabel(type) {
    const labels = {
        'expense': 'Dépense',
        'income': 'Revenu',
        'transfer': 'Transfert'
    };
    return labels[type] || type;
}

/**
 * Exporte les statistiques en fichier Excel
 * @param {Object} stats - Statistiques calculées
 * @param {string} currency - Devise
 * @param {string} monthYear - Mois et année (ex: "Janvier 2025")
 */
export function exportStatsToExcel(stats, currency, monthYear) {
    const data = [
        { 'Statistique': 'Total dépenses', 'Valeur': formatAmount(stats.totalExpenses, currency) },
        { 'Statistique': 'Total revenus', 'Valeur': formatAmount(stats.totalIncome, currency) },
        { 'Statistique': 'Solde', 'Valeur': formatAmount(stats.balance, currency) },
        { 'Statistique': 'Nombre de transactions', 'Valeur': stats.transactionCount }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statistiques');

    const fileName = `BudgetDuo_Stats_${monthYear.replace(' ', '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}