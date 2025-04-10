import React, { useState } from "react";
import { RiCheckLine } from "@remixicon/react";

function EditPromptModal({
  isOpen,
  onClose,
  onApply,
  initialPrompt,
  imageUrl,
}) {
  const [editPrompt, setEditPrompt] = useState(initialPrompt);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="edit-modal edit-modal-with-image">
        <div className="modal-content-flex">
          {/* Left side - Image preview */}
          <div className="edit-image-preview">
            <div className="edit-image-wrapper">
              <img
                src={imageUrl}
                alt="Düzenlenecek görsel"
                className="edit-preview-image"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x300?text=Görsel+Yüklenemedi";
                }}
              />
              <div className="edit-image-label">Seçilen Görsel</div>
            </div>
          </div>

          {/* Right side - Form */}
          <div className="edit-form-container">
            <div className="edit-form-inner">
              <div className="edit-form-content">
                <h3 className="edit-form-title">Görsel Açıklaması</h3>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  className="edit-textarea"
                  placeholder="Görsel için detaylı bir açıklama yazın..."
                />
                <div className="edit-help-text">
                  Detaylı ve açıklayıcı tanımlar daha iyi sonuçlar verir.
                </div>
              </div>

              <div className="button-group">
                <button onClick={onClose} className="cancel-button">
                  Kapat
                </button>
                <button
                  onClick={() => {
                    onApply(editPrompt);
                    onClose();
                  }}
                  className="apply-button"
                  disabled={!editPrompt.trim()}
                >
                  <RiCheckLine />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditPromptModal;
