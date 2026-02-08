import { useState, useEffect } from "react";
import { DEFAULT_CATEGORIES } from "../constants/categories";
import "./TransactionForm.css";

function TransactionForm({
  session,
  categories = DEFAULT_CATEGORIES,
  onSubmit,
  editingTransaction = null,
  onCancelEdit = null,
}) {
  const [transactionType, setTransactionType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("groceries");
  const [date, setDate] = useState("");
  const [payer, setPayer] = useState(session.userName);
  const [beneficiary, setBeneficiary] = useState(session.userName);

  const [isShared, setIsShared] = useState(true);
  const [isPersonal, setIsPersonal] = useState(false);

  const [customAmounts, setCustomAmounts] = useState(false);
  const [userCustomAmount, setUserCustomAmount] = useState("");
  const [partnerCustomAmount, setPartnerCustomAmount] = useState("");

  const [receiptPhoto, setReceiptPhoto] = useState(null);
 useEffect(() => {
  if (!editingTransaction) {
    setReceiptPhoto(null);
    return;
  }

  setReceiptPhoto(editingTransaction.receiptPhoto ?? null);

}, [editingTransaction?.id]);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);

  // Date par défaut
  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    setDate(`${y}-${m}-${d}`);
  }, []);

  // Charger transaction en édition
  useEffect(() => {
    if (!editingTransaction) return;

    console.log("Editing transaction reçue:", editingTransaction);

    setTransactionType(editingTransaction.type || "expense");
    setAmount(
      editingTransaction.amount != null
        ? String(editingTransaction.amount)
        : ""
    );
    setVendor(editingTransaction.vendor || "");
    setCategory(editingTransaction.category || "groceries");
    setDate(editingTransaction.date || "");
    setPayer(editingTransaction.payer || session.userName);
    setBeneficiary(
      editingTransaction.beneficiary || session.userName
    );

    const personal = editingTransaction.isPersonal === true;
    setIsPersonal(personal);
    setIsShared(
      personal
        ? false
        : editingTransaction.isShared === true
    );

setReceiptPhoto(null);

setTimeout(() => {
  setReceiptPhoto(editingTransaction.receiptPhoto || null
  );
}, 0);



    if (
      editingTransaction.userShare != null &&
      editingTransaction.partnerShare != null
    ) {
      const total = editingTransaction.amount || 0;
      const half = total / 2;

      if (
        Math.abs(
          editingTransaction.userShare - half
        ) > 0.01
      ) {
        setCustomAmounts(true);
        setUserCustomAmount(
          String(editingTransaction.userShare)
        );
        setPartnerCustomAmount(
          String(editingTransaction.partnerShare)
        );
      } else {
        setCustomAmounts(false);
      }
    }
  }, [editingTransaction, session.userName]);




  // Ajuster bénéficiaire pour transfert
  useEffect(() => {
    if (transactionType !== "transfer") return;

    setBeneficiary(
      payer === session.userName
        ? session.partnerName
        : session.userName
    );
  }, [
    transactionType,
    payer,
    session.userName,
    session.partnerName,
  ]);

  // Split personnalisé (corrigé pour éviter boucle infinie)
  useEffect(() => {
    if (!customAmounts || !amount) return;

    const total = parseFloat(amount);
    if (isNaN(total)) return;

    if (userCustomAmount !== "") {
      const u = parseFloat(userCustomAmount);
      if (!isNaN(u)) {
        const newPartner = (total - u).toFixed(2);

        if (newPartner !== partnerCustomAmount) {
          setPartnerCustomAmount(newPartner);
        }
      }
    } else if (partnerCustomAmount !== "") {
      const p = parseFloat(partnerCustomAmount);
      if (!isNaN(p)) {
        const newUser = (total - p).toFixed(2);

        if (newUser !== userCustomAmount) {
          setUserCustomAmount(newUser);
        }
      }
    }
  }, [
    customAmounts,
    amount,
    userCustomAmount,
    partnerCustomAmount,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || !vendor || !date) {
      alert(
        "Veuillez remplir tous les champs obligatoires"
      );
      return;
    }

   let photoBase64 = receiptPhoto;

// Si nouvelle photo (File → base64)
if (receiptPhoto && typeof receiptPhoto !== "string") {
  photoBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(receiptPhoto);
  });
}

    const tx = {
      type: transactionType,
      amount: parseFloat(amount),
      vendor: vendor.trim(),
      category,
      date,
timestamp:
  typeof editingTransaction?.timestamp === "number"
    ? editingTransaction.timestamp
    : Date.now(),
      payer,
      beneficiary,
      isShared:
        transactionType === "expense"
          ? isShared
          : false,
      isPersonal,
      receiptPhoto: photoBase64 ?? null,
    };

    if (
      transactionType === "expense" &&
      isShared
    ) {
      const total = parseFloat(amount);

      if (customAmounts) {
        tx.userShare =
          parseFloat(userCustomAmount) || 0;
        tx.partnerShare =
          parseFloat(partnerCustomAmount) || 0;
      } else {
        tx.userShare = total / 2;
        tx.partnerShare = total / 2;
      }
    }

    if (editingTransaction) {
      tx.id = editingTransaction.id;
    }

    onSubmit(tx);

    setAmount("");
    setVendor("");
    setCategory("groceries");
    setCustomAmounts(false);
    setUserCustomAmount("");
    setPartnerCustomAmount("");
    setReceiptPhoto(null);

    onCancelEdit?.();
  };

  return (
    <div className="transaction-form-container">
<h2 className={editingTransaction ? "title-edit" : "title-new"}>
  {editingTransaction
    ? "Modifier la transaction"
    : "Nouvelle transaction"}
</h2>

      <form
        onSubmit={handleSubmit}
        className="transaction-form"
      >
        {/* TYPE */}
        <div className="form-type-selector">
          {["expense", "income", "transfer"].map(
            (type) => (
              <button
                key={type}
                type="button"
                className={
                  "type-btn " +
                  (transactionType === type
                    ? "active"
                    : "")
                }
                onClick={() =>
                  setTransactionType(type)
                }
              >
                {type === "expense" &&
                  "💸 Dépense"}
                {type === "income" &&
                  "💰 Revenu"}
                {type === "transfer" &&
                  "🔄 Transfert"}
              </button>
            )
          )}
        </div>

        {/* MONTANT */}
        <div className="form-field">
          <label>
            Montant ({session.currency})
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            className="form-input"
            required
          />
        </div>

        {/* VENDEUR + PHOTO */}
        <div className="form-field">
          <label>Vendeur</label>

          <div className="vendor-input-container">
            <input
              type="text"
              value={vendor}
              onChange={(e) =>
                setVendor(e.target.value)
              }
              className="form-input vendor-input"
              required
            />

            <button
              type="button"
              className="btn-camera"
              onClick={() =>
                setShowPhotoOptions(
                  !showPhotoOptions
                )
              }
            >
              📷
            </button>
          </div>

         {showPhotoOptions && (
  <div className="photo-options">

    <label className="photo-option-btn">
      📷 Prendre photo
      <input
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) => {
  if (e.target.files?.length) {
    setReceiptPhoto(e.target.files[0]);
    setShowPhotoOptions(false);
  }
}}
      />
    </label>

    <label className="photo-option-btn">
      🖼️ Galerie
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setReceiptPhoto(e.target.files[0]);
            setShowPhotoOptions(false);
          }
        }}
      />
    </label>

  </div>
)}

          {receiptPhoto && (
            <div className="photo-preview">
              <img
                src={
                  typeof receiptPhoto ===
                  "string"
                    ? receiptPhoto
                    : URL.createObjectURL(
                        receiptPhoto
                      )
                }
                alt="Reçu"
                className="receipt-thumbnail"
              />
              <button
                type="button"
                onClick={() =>
                  setReceiptPhoto(null)
                }
              >
                ❌
              </button>
            </div>
          )}
        </div>

        {/* CATÉGORIE */}
        <div className="form-field">
          <label>Catégorie</label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            className="form-select"
          >
            {Object.entries(categories).map(
              ([key, cat]) => (
                <option
                  key={key}
                  value={key}
                >
                  {cat.icon} {cat.name}
                </option>
              )
            )}
          </select>
        </div>

        {/* DATE */}
        <div className="form-field">
          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) =>
              setDate(e.target.value)
            }
            className="form-input"
            required
          />
        </div>

        {/* PAYEUR */}
        {(transactionType === "expense" ||
          transactionType ===
            "transfer") && (
          <div className="form-field">
            <label>Payé par</label>
            <select
              value={payer}
              onChange={(e) =>
                setPayer(e.target.value)
              }
              className="form-select"
            >
              <option
                value={session.userName}
              >
                {session.userName}
              </option>
              <option
                value={session.partnerName}
              >
                {session.partnerName}
              </option>
            </select>
          </div>
        )}

        {/* PARTAGÉ */}
        {transactionType === "expense" && (
          <div className="form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isShared}
                disabled={isPersonal}
                onChange={(e) =>
                  setIsShared(
                    e.target.checked
                  )
                }
              />
              Dépense partagée
            </label>
          </div>
        )}

        {/* PERSONNEL */}
        <div className="form-checkbox">
          <label>
            <input
              type="checkbox"
              checked={isPersonal}
              onChange={(e) => {
                const checked =
                  e.target.checked;
                setIsPersonal(checked);
                if (checked) {
                  setIsShared(false);
                  setCustomAmounts(false);
                }
              }}
            />
            Transaction personnelle
          </label>
        </div>

        {/* BOUTONS */}
        <div className="form-buttons">
          <button
            type="submit"
            className="btn-submit"
          >
            {editingTransaction
              ? "✅ Enregistrer"
              : "✅ Ajouter"}
          </button>

          {editingTransaction && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() =>
                onCancelEdit &&
                onCancelEdit()
              }
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
