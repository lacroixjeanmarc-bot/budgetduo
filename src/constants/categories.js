// ========== CATÉGORIES PAR DÉFAUT ==========
export const DEFAULT_CATEGORIES = {
    groceries: { icon: '🛒', name: 'Épicerie' },
    restaurants: { icon: '🍽️', name: 'Restaurants' },
    transport: { icon: '🚗', name: 'Transport' },
    entertainment: { icon: '🎬', name: 'Divertissement' },
    health: { icon: '💊', name: 'Santé' },
    utilities: { icon: '💡', name: 'Services publics' },
    shopping: { icon: '🛍️', name: 'Achats' },
    other: { icon: '📦', name: 'Autre' }
};

// ========== ICÔNES DISPONIBLES ==========
export const AVAILABLE_ICONS = [
    '🛒', '🍽️', '🚗', '🎬', '💊', '💡', '🛍️', '📦',
    '🏠', '✈️', '🎓', '💰', '🎮', '📱', '⚽', '🎨',
    '🍕', '☕', '🚌', '🚇', '🚲', '⛽', '🏥', '💼',
    '🎵', '📚', '🎁', '🧺', '🔧', '🌳', '🐕', '🎯',
    '💳', '🏋️', '🎪', '🎭', '🎸', '📷', '🖥️', '⚡',
    '🌟', '🔥', '💎', '🎊', '🎈', '🍔', '🍰', '🥗',
    '🌮', '🍜', '🥐', '🧃', '🍺', '🍷', '🚕', '🚙',
    '✨', '🌈', '⭐', '🎀', '🎃', '🎄', '🎆', '🎇'
];

// ========== TYPES DE TRANSACTIONS ==========
export const TRANSACTION_TYPES = {
    EXPENSE: 'expense',
    INCOME: 'income',
    TRANSFER: 'transfer'
};

// ========== COULEURS PAR TYPE ==========
export const TYPE_COLORS = {
    expense: '#3B82F6',
    income: '#10B981',
    transfer: '#F59E0B'
};