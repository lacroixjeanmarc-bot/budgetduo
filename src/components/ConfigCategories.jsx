import { useState, useEffect } from "react";
import { database } from "../firebase";
import { ref, set } from "firebase/database";

function ConfigCategories({ session, categories }) {
const [localCategories, setLocalCategories] = useState(categories || {});
const [newName, setNewName] = useState("");
const [newIcon, setNewIcon] = useState("");

useEffect(() => {
setLocalCategories(categories || {});
}, [categories]);

const addCategory = () => {
if (!session) {
alert("Session non chargée");
return;
}

if (!newName.trim()) return;

let key = newName
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "_")
  .replace(/^_|_$/g, "");

if (!key) key = "cat_" + Date.now();

const updated = {
  ...localCategories,
  [key]: {
    name: newName,
    icon: newIcon || "📁",
  },
};

const catRef = ref(
  database,
  `sessions/${session.code}/categories`
);

set(catRef, updated);

setNewName("");
setNewIcon("");

};

return (
<div style={{ padding: 20 }}>
⚙️ Configuration

  <h3>Catégories</h3>

  <ul>
    {Object.entries(localCategories).map(([key, cat]) => (
      <li key={key}>
        {cat.icon} {cat.name}
      </li>
    ))}
  </ul>

  <h4>Ajouter une catégorie</h4>

  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
    <input
      placeholder="nom affiché"
      value={newName}
      onChange={(e) => setNewName(e.target.value)}
    />

    <input
      placeholder="emoji"
      value={newIcon}
      onChange={(e) => setNewIcon(e.target.value)}
      style={{ width: 60 }}
    />
  </div>

  <button onClick={addCategory}>
    ➕ Ajouter catégorie
  </button>
</div>

);
}

export default ConfigCategories;