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

// Custom hook for key press handling
function useKeyPress(targetKey, callback) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === targetKey) {
        callback();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [targetKey, callback]);
}

function FullscreenImageModal({ isOpen, onClose, imageUrl, sourceImageUrl }) {
  const [scale, setScale] = useState(0.8);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [isModalMounted, setIsModalMounted] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);

  // Generate a unique key whenever the modal opens with a new image
  useEffect(() => {
    if (isOpen && imageUrl) {
      setKeyCounter((prev) => prev + 1);
    }
  }, [isOpen, imageUrl]);

  // Ensure the modal DOM is fully mounted before rendering content
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is ready before mounting content
      const timer = setTimeout(() => {
        setIsModalMounted(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Exit the compare mode first to avoid ReactCompareSlider DOM issues
      setCompareMode(false);

      // Then unmount the modal with a delay
      const timer = setTimeout(() => {
        setIsModalMounted(false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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

        // Create invisible link element with download attribute
        // and click it programmatically, without appending to DOM
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = blobUrl;
        a.download = filename;

        // Click the link without adding to DOM
        a.click();

        // Clean up the blob URL
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
      })
      .catch((error) => {
        console.error("İndirme hatası:", error);
        // Fallback - direct URL method

        // Create invisible link element with download attribute
        // and click it programmatically, without appending to DOM
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = imageUrl;
        a.download = filename;
        a.target = "_blank";

        // Click the link without adding to DOM
        a.click();
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

  // Reset state when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(false);
      setScale(0.8);
      setCompareMode(false);
    } else {
      // Cleanup when modal closes
      const cleanup = () => {
        // Reset all state
        setIsLoading(false);
        setError(false);
        setScale(0.8);
        setCompareMode(false);
        setIsModalMounted(false);
      };

      // Small delay before cleanup to ensure proper unmounting
      const timer = setTimeout(cleanup, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Final cleanup when component unmounts
      setIsModalMounted(false);
    };
  }, []);

  // Handle escape key to close modal
  useKeyPress("Escape", () => {
    if (isOpen) {
      onClose();
    }
  });

  // Safety check - if not open or no image URL, don't render
  if (!isOpen || !imageUrl) return null;

  // Modal container without content
  if (!isModalMounted) {
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
        {/* Loading indicator while waiting for content to mount */}
        <div
          className="spinner"
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            borderTop: "4px solid rgba(255, 255, 255, 0.8)",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  return (
    <div
      className="fullscreen-modal"
      key={`modal-${keyCounter}`}
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
          {!error && compareMode && sourceImageUrl && imageUrl ? (
            <div
              style={{ position: "relative", width: "100%", height: "90vh" }}
            >
              <ReactCompareSlider
                key={`compare-${imageUrl}-${sourceImageUrl}`}
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
                    key={`compare-img-src-${sourceImageUrl}`}
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
                    onError={() => {
                      setError(true);
                      setCompareMode(false);
                    }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    key={`compare-img-dest-${imageUrl}`}
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
                    onError={() => {
                      setError(true);
                      setCompareMode(false);
                    }}
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
                onPositionChange={() => {
                  // Force repaint to prevent React DOM issues
                  window.requestAnimationFrame(() => {});
                }}
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
