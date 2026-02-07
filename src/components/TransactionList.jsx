import { formatAmount, formatDate } from "../utils/formatters";
import { useState } from "react";
import "./TransactionList.css";
import Summary from "./Summary";

function TransactionList({ transactions, session, onEdit, categories }) {
const [selectedPhoto, setSelectedPhoto] = useState(null);

if (!transactions || transactions.length === 0) {
return <p>Aucune transaction.</p>;
}

return (
<>
<Summary session={session} categories={categories} />



  <div className="transactions-list">
    {transactions.map((tx) => (
      <div key={tx.id} className="transaction-item-compact">
        {/* MEDIA */}
        <div className="transaction-media">
          {tx.receiptPhoto ? (
            <>
              <img
                src={tx.receiptPhoto}
                alt="Reçu"
                className="transaction-receipt-thumb"
                onClick={() => setSelectedPhoto(tx.receiptPhoto)}
              />
              <div className="transaction-category-badge">
                {categories?.[tx.category]?.icon || "📦"}
              </div>
            </>
          ) : (
            <div className="transaction-icon-compact">
              {categories?.[tx.category]?.icon || "📦"}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="transaction-details-compact">
          <div>{tx.vendor}</div>
          <div>
            {formatDate(tx.date)} • {tx.payer}
          </div>
        </div>

        {/* AMOUNT */}
        <div className={`transaction-amount-compact ${tx.type}`}>
          {formatAmount(tx.amount, session.currency)}
        </div>

        {/* EDIT */}
        <button
  onClick={() => {
    console.log("Transaction envoyée en édition:", tx);
    onEdit(tx);
  }}
>
  ✏️
</button>
      </div>
    ))}
  </div>

  {/* MODAL PHOTO */}
  {selectedPhoto && (
    <div className="photo-modal" onClick={() => setSelectedPhoto(null)}>
      <img
        src={selectedPhoto}
        alt="Reçu"
        className="photo-modal-image"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="photo-modal-close"
        onClick={() => setSelectedPhoto(null)}
      >
        ✕
      </button>
    </div>
  )}
</>

);
}

export default TransactionList;