import { useState } from 'react';
import './CategoriesModal.css';

function CategoriesModal({ categories, onSave, onClose }) {
    const [localCategories, setLocalCategories] = useState({ ...categories });
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('📦');

    const handleAddCategory = () => {
        if (!newCategoryName) {
            alert('Veuillez entrer le nom de la catégorie');
            return;
        }

        // Génère automatiquement la clé à partir du nom
        const key = newCategoryName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
            .replace(/[^a-z0-9]+/g, '_') // Remplace espaces et caractères spéciaux par _
            .replace(/^_+|_+$/g, ''); // Enlève les _ au début et à la fin

        if (localCategories[key]) {
            alert('Cette catégorie existe déjà');
            return;
        }

        setLocalCategories({
            ...localCategories,
            [key]: {
                name: newCategoryName,
                icon: newCategoryIcon
            }
        });

        setNewCategoryName('');
        setNewCategoryIcon('📦');
    };

    const handleDeleteCategory = (key) => {
        if (confirm(`Voulez-vous vraiment supprimer la catégorie "${localCategories[key].name}" ?`)) {
            const newCategories = { ...localCategories };
            delete newCategories[key];
            setLocalCategories(newCategories);
        }
    };

    const handleSave = () => {
        onSave(localCategories);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🏷️ Gérer les catégories</h2>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {/* Liste des catégories existantes */}
                    <div className="categories-list">
                        <h3>Catégories existantes</h3>
                        {Object.entries(localCategories).map(([key, cat]) => (
                            <div key={key} className="category-item">
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-name">{cat.name}</span>
                                <button
                                    className="btn-delete-category"
                                    onClick={() => handleDeleteCategory(key)}
                                    title="Supprimer"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Ajouter une nouvelle catégorie */}
                    <div className="add-category-section">
                        <h3>Ajouter une catégorie</h3>
                        <div className="add-category-form">
                            <input
                                type="text"
                                placeholder="Nom (ex: Restaurants)"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="category-input"
                            />
                            <input
                                type="text"
                                placeholder="Icône (emoji)"
                                value={newCategoryIcon}
                                onChange={(e) => setNewCategoryIcon(e.target.value)}
                                className="category-input category-icon-input"
                                maxLength="2"
                            />
                            <button
                                className="btn-add-category"
                                onClick={handleAddCategory}
                            >
                                ➕ Ajouter
                            </button>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn-modal-cancel" onClick={onClose}>
                        Annuler
                    </button>
                    <button className="btn-modal-save" onClick={handleSave}>
                        💾 Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CategoriesModal;