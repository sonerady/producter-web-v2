import React, { useState, useEffect } from "react";
import {
  RiCloseLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiRefreshLine,
  RiDownloadLine,
  RiFullscreenLine,
  RiSearchEyeLine,
  RiContrastLine,
} from "@remixicon/react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from "react-compare-slider";

function FullscreenImageModal({ isOpen, onClose, imageUrl, sourceImageUrl }) {
  const [scale, setScale] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Zoom in and out functions
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.2));
  const resetZoom = () => setScale(0.8);

  // Toggle compare mode
  const toggleCompareMode = () => {
    if (!sourceImageUrl) return;
    setCompareMode(!compareMode);
  };

  // Download image function
  const downloadImage = () => {
    if (!imageUrl) return;

    const filename = compareMode ? "enhanced-image.jpg" : "image.jpg";

    fetch(imageUrl, {
      method: "GET",
      mode: "cors",
    })
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error("İndirme hatası:", error);
        // Fallback - direct URL method
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  // Image load handler
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  // Image error handler
  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(false);
      setScale(0.8);
      setCompareMode(false);
    }
  }, [isOpen]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fullscreen-modal"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
      }}
    >
      <div className="fullscreen-header">
        <button
          onClick={onClose}
          className="close-button"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
            transition: "all 0.2s ease",
          }}
        >
          <RiCloseLine size={24} color="#333" />
        </button>
      </div>

      {/* Zoom controls on right side */}
      <div
        className="zoom-controls-panel"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          padding: "8px",
          borderRadius: "12px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={zoomIn}
          className="zoom-control-button"
          style={{
            backgroundColor: "#f8f9fa",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <RiZoomInLine color="#333" />
        </button>
        <div
          className="zoom-value"
          style={{
            textAlign: "center",
            fontWeight: "500",
            padding: "4px 0",
            color: "#333",
          }}
        >
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={zoomOut}
          className="zoom-control-button"
          style={{
            backgroundColor: "#f8f9fa",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          }}
        >
          <RiZoomOutLine color="#333" />
        </button>
        <button
          onClick={resetZoom}
          className="zoom-control-button"
          style={{
            backgroundColor: "#f8f9fa",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            marginTop: "4px",
          }}
        >
          <RiRefreshLine color="#333" />
        </button>

        {/* Compare button, only show if sourceImageUrl exists */}
        {sourceImageUrl && (
          <button
            onClick={toggleCompareMode}
            className="zoom-control-button"
            style={{
              backgroundColor: compareMode ? "#4a90e2" : "#f8f9fa",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              marginTop: "8px",
            }}
            title={
              compareMode ? "Karşılaştırmayı Kapat" : "Orijinalle Karşılaştır"
            }
          >
            <RiContrastLine color={compareMode ? "#fff" : "#333"} />
          </button>
        )}

        {/* Download button */}
        <button
          onClick={downloadImage}
          className="zoom-control-button"
          style={{
            backgroundColor: "#4CAF50",
            border: "none",
            borderRadius: "8px",
            padding: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
            marginTop: "8px",
          }}
          title="Görseli İndir"
        >
          <RiDownloadLine color="#fff" />
        </button>
      </div>

      <div className="fullscreen-content">
        {isLoading && (
          <div
            className="loading-spinner"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
            }}
          >
            <div
              className="spinner"
              style={{
                borderTopColor: "#ffffff",
              }}
            />
            <span>Yükleniyor...</span>
          </div>
        )}

        {error && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "#333",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              padding: "20px",
              borderRadius: "12px",
            }}
          >
            <RiSearchEyeLine size={32} color="#333" />
            <span>Görüntüyü görmek için tıklayın</span>
            <button
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                background: "rgba(50, 50, 50, 0.8)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
              }}
              onClick={(e) => {
                e.stopPropagation();
                window.open(imageUrl, "_blank");
              }}
            >
              <RiFullscreenLine /> Görüntüyü Aç
            </button>
          </div>
        )}

        <div
          className="image-wrapper"
          style={{
            transform: `scale(${scale})`,
            maxWidth: "100%",
            maxHeight: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "transform 0.3s ease",
          }}
        >
          {!error && compareMode && sourceImageUrl ? (
            <div
              style={{ position: "relative", width: "100%", height: "90vh" }}
            >
              <ReactCompareSlider
                style={{
                  maxWidth: "100%",
                  maxHeight: "90vh",
                  width: "100%",
                  height: "90vh",
                  borderRadius: "12px",
                  boxShadow: "0 15px 50px rgba(0, 0, 0, 0.3)",
                }}
                itemOne={
                  <ReactCompareSliderImage
                    src={sourceImageUrl}
                    alt="Orijinal görüntü"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "100%",
                    }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onLoad={() => setIsLoading(false)}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={imageUrl}
                    alt="İşlenmiş görüntü"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "100%",
                    }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onLoad={() => setIsLoading(false)}
                  />
                }
                handle={
                  <ReactCompareSliderHandle
                    buttonStyle={{
                      backdropFilter: "blur(10px)",
                      background: "rgba(255, 255, 255, 0.8)",
                      border: 0,
                      color: "#333",
                    }}
                    linesStyle={{ color: "#333" }}
                  />
                }
                position={50}
                portrait={false}
              />
              {/* Before label */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  left: "15px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "5px 15px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                }}
              >
                ÖNCE
              </div>

              {/* After label */}
              <div
                style={{
                  position: "absolute",
                  top: "15px",
                  right: "15px",
                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                  color: "white",
                  padding: "5px 15px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                }}
              >
                SONRA
              </div>
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="Tam ekran görüntü"
              className="fullscreen-image"
              style={{
                maxWidth: "100%",
                maxHeight: "90vh",
                objectFit: "contain",
                display: error ? "none" : "block",
                borderRadius: "12px",
                boxShadow: "0 15px 50px rgba(0, 0, 0, 0.3)",
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FullscreenImageModal;
