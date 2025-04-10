import React from "react";
import {
  RiImageLine,
  RiCropLine,
  RiUpload2Line,
  RiArrowRightLine,
} from "@remixicon/react";

function WidgetSourceAndPrompt({
  onImageUpload,
  previewUrl,
  handleFileChange,
  prompt,
  handlePromptChange,
  isGenerating,
  isDisabled,
  handleGenerate,
  openCropModal,
  resetUpload,
  error,
  style,
  hasShadow,
  hasReflection,
  onShadowChange,
  onReflectionChange,
}) {
  return (
    <div
      className="product-retouch-panel"
      style={{
        ...style,
        padding: "15px",
        borderRadius: "8px",
      }}
    >
      <h2>
        <span className="icon-placeholder">
          <RiImageLine />
        </span>{" "}
        Ürün Rötuşlama
      </h2>

      <div className="section">
        <h3>Kaynak Fotoğraf</h3>
        <div className="upload-area-container">
          {previewUrl ? (
            <div className="upload-preview">
              <div
                className="image-container"
                style={{
                  overflow: "hidden",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <img
                  src={previewUrl}
                  alt="Ürün önizleme"
                  className="preview-image"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </div>

              <div className="action-buttons">
                <button className="action-button" onClick={openCropModal}>
                  <RiCropLine /> Yeniden Kırp
                </button>
                <button className="action-button" onClick={resetUpload}>
                  Değiştir
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="product-image" className="upload-area">
              <div className="upload-icon">
                <RiUpload2Line />
              </div>
              <p>Fotoğraf yüklemek için buraya tıklayın</p>
              <p className="text-small">veya sürükle & bırak</p>
              <input
                type="file"
                id="product-image"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="section">
        <h3>Ürün Açıklaması (İsteğe Bağlı)</h3>

        <div
          className="options-container"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "12px",
            backgroundColor: "#fff",
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #eaeaea",
          }}
        >
          <div
            style={{
              width: "100%",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#666",
            }}
          >
            <strong>Rötuş seçenekleri:</strong>
          </div>

          <label
            className="option-checkbox"
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              padding: "5px 10px",
              backgroundColor: hasShadow ? "#f0f7ff" : "transparent",
              borderRadius: "4px",
              border: `1px solid ${hasShadow ? "#ADD8E6" : "#eaeaea"}`,
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={hasShadow}
              onChange={onShadowChange}
              style={{ marginRight: "6px" }}
            />
            <span style={{ fontWeight: hasShadow ? "500" : "normal" }}>
              Gölge
            </span>
          </label>

          <label
            className="option-checkbox"
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              padding: "5px 10px",
              backgroundColor: hasReflection ? "#f0f7ff" : "transparent",
              borderRadius: "4px",
              border: `1px solid ${hasReflection ? "#ADD8E6" : "#eaeaea"}`,
              transition: "all 0.2s ease",
            }}
          >
            <input
              type="checkbox"
              checked={hasReflection}
              onChange={onReflectionChange}
              style={{ marginRight: "6px" }}
            />
            <span style={{ fontWeight: hasReflection ? "500" : "normal" }}>
              Yansıma
            </span>
          </label>
        </div>

        <textarea
          placeholder="Ürünü ve istediğiniz rötuş tipini açıklayın..."
          value={prompt}
          onChange={handlePromptChange}
          disabled={isGenerating}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            minHeight: "80px",
            maxHeight: "200px",
            overflow: "auto",
          }}
        ></textarea>

        {error && <div className="error-message">{error}</div>}

        <button
          className="retouch-button"
          onClick={handleGenerate}
          disabled={isDisabled || isGenerating}
        >
          {isGenerating ? (
            <>
              <div
                className="spinner"
                style={{ width: 20, height: 20, marginRight: 10 }}
              ></div>
              İşleniyor...
            </>
          ) : (
            <>
              Rötuşla
              <span className="arrow">
                <RiArrowRightLine />
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default WidgetSourceAndPrompt;
