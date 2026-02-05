// ========== CONFIGURATION FIREBASE ==========
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Configuration Firebase - BudgetDuo
const firebaseConfig = {
    apiKey: "AIzaSyBP4VP0zfXMDGhWmparJAnue-2mIpgDWfE",
    authDomain: "budgetduo-96f22.firebaseapp.com",
    databaseURL: "https://budgetduo-96f22-default-rtdb.firebaseio.com",
    projectId: "budgetduo-96f22",
    storageBucket: "budgetduo-96f22.firebasestorage.app",
    messagingSenderId: "44840005819",
    appId: "1:44840005819:web:5344367cda9a500a4a799e"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Obtient la référence à la base de données
export const database = getDatabase(app);

export default app;