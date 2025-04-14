import React, { useState, useEffect, useRef } from "react";
import {
  RiFullscreenLine,
  RiDownloadLine,
  RiSparklingLine,
  RiEraserLine,
  RiPencilLine,
  RiImageLine,
  RiSearchEyeLine,
  RiCloseLine,
} from "@remixicon/react";
import FullscreenImageModal from "../modals/FullscreenImageModal";
import { injectStyle } from "../../utils/styleManager";

function WidgetResults({
  resultImages,
  onSelectResult,
  selectedIndex,
  openCropModal,
  onEditPrompt,
  onEnhanceImage,
  onRemoveBackground,
  style,
  previewUrl,
  uploadedImage,
  isGenerating,
}) {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  const prevResultImagesRef = useRef(null);

  // Log when resultImages changes significantly
  useEffect(() => {
    // Only log when something meaningful changes (length or loading state)
    if (!resultImages || !prevResultImagesRef.current) {
      prevResultImagesRef.current = resultImages;
      return;
    }

    const prevLength = prevResultImagesRef.current?.length || 0;
    const currentLength = resultImages?.length || 0;

    if (prevLength !== currentLength) {
      console.log(
        "WidgetResults - resultImages length changed:",
        `${prevLength} -> ${currentLength}`
      );
    }

    // Check if loading state changed
    const prevHasLoading = prevResultImagesRef.current?.some(
      (img) => img?.loading
    );
    const currentHasLoading = resultImages?.some((img) => img?.loading);

    if (prevHasLoading !== currentHasLoading) {
      console.log(
        "WidgetResults - loading state changed:",
        `${prevHasLoading} -> ${currentHasLoading}`
      );
    }

    prevResultImagesRef.current = resultImages;
  }, [resultImages]);

  // Süre sayacı için timer
  useEffect(() => {
    let timer;
    if (
      isGenerating ||
      (resultImages && resultImages.some((img) => img?.loading))
    ) {
      // İşlem başladığında süre sayacını başlat
      timer = setInterval(() => {
        setProcessingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      // İşlem bittiğinde sayacı sıfırla
      setProcessingTime(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating, resultImages]);

  // Add safety measures to handle race conditions
  useEffect(() => {
    // Clean up fullscreen modal if resultImages changes
    if (fullscreenImage && (!resultImages || resultImages.length === 0)) {
      // If we have a fullscreen image open but resultImages is removed/empty, close it
      setFullscreenImage(null);
    } else if (fullscreenImage && resultImages && resultImages.length > 0) {
      // Check if the fullscreen image URL is still in the resultImages
      const urlStillExists = resultImages.some(
        (img) => img?.url === fullscreenImage
      );
      if (!urlStillExists) {
        // If the URL no longer exists, close the fullscreen modal
        setFullscreenImage(null);
      }
    }
  }, [resultImages, fullscreenImage]);

  // Süre formatı (1s, 2s, 3s)
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  // Konsol logları ekle
  useEffect(() => {
    if (resultImages && resultImages.length > 0) {
      console.log("WidgetResults - sonuçlar:", resultImages);
      resultImages.forEach((img, idx) => {
        if (img && img.url) {
          console.log(`Görüntü ${idx + 1} URL:`, img.url);
        } else {
          console.warn(`Görüntü ${idx + 1} geçersiz veya eksik URL:`, img);
        }
      });
    }
  }, [resultImages]);

  // Tam ekran modalı açma fonksiyonu
  const handleOpenFullscreen = (imageUrl) => {
    // Önce önceki modalı temizle (varsa)
    setFullscreenImage(null);

    // Kısa bir gecikmeyle yeni modalı aç (DOM güncellemesi için zaman tanı)
    setTimeout(() => {
      console.log("Tam ekran açılıyor:", imageUrl);
      setFullscreenImage(imageUrl);
    }, 50);
  };

  // Modal kapatma fonksiyonu - güvenli kapatma
  const handleCloseFullscreen = () => {
    console.log("Tam ekran kapatılıyor");
    // First set to null to trigger cleanup
    setFullscreenImage(null);
  };

  // Dosya indirme fonksiyonu
  const downloadImage = (url, filename = "download.jpg") => {
    console.log("İndiriliyor:", url);

    // Görüntüyü yeni sekmede açıp kullanıcının sağ tıklayıp kaydetmesini sağla
    window.open(url, "_blank");
  };

  // Görüntü yükleme hatası işleme
  const handleImageError = (e, index) => {
    console.error(`Görüntü ${index + 1} yüklenemedi:`, e.target.src);

    // Hata durumunu kaydet
    setImageErrors((prev) => ({ ...prev, [index]: true }));

    // Demo görüntüyle değiştir
    e.target.src = `https://fastly.picsum.photos/id/${
      638 + index
    }/600/400.jpg?hmac=demo${index}`;
    e.target.alt = "Yüklenemedi - Demo Görüntü";
  };

  // Görsel yüklendiğinde hata durumunu temizle
  const handleImageLoad = (index) => {
    console.log(`Görüntü ${index + 1} başarıyla yüklendi`);
    setImageErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  // JSX'te CSS stilini ekleyelim
  const imageErrorOverlayStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "white",
    zIndex: 10,
  };

  // Dinamik stil ekleme
  useEffect(() => {
    // Spinner animasyonu için CSS ekleme
    const css = `
      .result-image-container {
        transition: all 0.3s ease;
      }
      
      .result-image-container:hover {
        box-shadow: 0 0 10px rgba(138, 43, 226, 0.4);
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Butonlar için CSS */
      .result-actions {
        display: flex;
        flex-direction: column;
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
      }
      
      .action-icon {
        background-color: rgba(255, 255, 255, 0.7);
        border: none;
        border-radius: 4px;
        padding: 6px;
        margin-bottom: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .action-icon:hover {
        background-color: white;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
      }

      .action-icon:hover .tooltip {
        opacity: 1;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #8A2BE2;
        border-left-color: #8A2BE2;
        animation: spin 1s linear infinite;
      }
      
      .processing-time {
        position: absolute;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        color: #8A2BE2;
        font-weight: 600;
        font-size: 14px;
      }
    `;

    // Use the style manager to safely inject and manage the style
    const cleanup = injectStyle(css, "widget-results-styles");

    // Temizleme fonksiyonu
    return cleanup;
  }, []);

  return (
    <div
      className="results-panel"
      style={{
        ...style,
        padding: "15px",
        borderRadius: "8px",
      }}
    >
      <h2>
        <span className="icon-placeholder">
          <RiSparklingLine />
        </span>{" "}
        Rötuşlanmış Sonuçlar
        {isGenerating && (
          <span
            style={{
              marginLeft: "10px",
              fontSize: "14px",
              color: "#8A2BE2",
              fontWeight: "500",
            }}
          >
            İşleniyor... {formatTime(processingTime)}
          </span>
        )}
      </h2>

      {!uploadedImage ? (
        <div className="results-empty">
          <div
            className="results-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(50% - 10px), 1fr))",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="result-item placeholder"
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
                  borderRadius: "8px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #ddd",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bababa",
                  }}
                >
                  <RiImageLine size={32} />
                </div>
              </div>
            ))}
          </div>
          <p
            className="help-text"
            style={{ textAlign: "center", color: "#888", margin: "20px 0" }}
          >
            Henüz bir görsel yüklemediniz.
            <br />
            Lütfen sol panelden bir görsel yükleyip rötuşlama işlemi başlatın.
          </p>
        </div>
      ) : resultImages && resultImages.length > 0 ? (
        <div className="results-container">
          <div
            className="results-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(50% - 10px), 1fr))",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {resultImages.map((result, index) => {
              // Safety check for null/undefined results
              if (!result) {
                console.warn(`Null or undefined result at index ${index}`);
                return (
                  <div
                    key={`empty-${index}`}
                    className="result-item placeholder"
                    style={{
                      position: "relative",
                      aspectRatio: "1/1",
                      borderRadius: "8px",
                      backgroundColor: "#f0f0f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed #ddd",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#bababa",
                      }}
                    >
                      <RiImageLine size={32} />
                      <span style={{ fontSize: "12px", marginTop: "5px" }}>
                        Yüklenemedi
                      </span>
                    </div>
                  </div>
                );
              }

              // Generate a stable key for the result items
              const stableKey = result.url
                ? `result-${index}-${result.url.slice(-20)}`
                : `result-${index}`;

              return (
                <div
                  key={stableKey}
                  className={`result-item ${
                    selectedIndex === index ? "selected" : ""
                  }`}
                  onClick={() => !result.loading && onSelectResult(index)}
                  onMouseEnter={() => setHoveredImageIndex(index)}
                  onMouseLeave={() => setHoveredImageIndex(null)}
                  style={{
                    border:
                      selectedIndex === index && !result.loading
                        ? "2px solid #0070F3"
                        : "1px solid #ddd",
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: "8px",
                    cursor: result.loading ? "default" : "pointer",
                    aspectRatio: "1 / 1",
                    backgroundColor: "#ffffff",
                    width: "100%",
                    boxShadow:
                      selectedIndex === index && !result.loading
                        ? "0 0 10px rgba(0, 112, 243, 0.3)"
                        : "0 2px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {result.loading ? (
                    // Yükleniyor durumu - Basit beyaz arka plan
                    <div
                      className="loading-spinner"
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                      }}
                    >
                      <div className="spinner"></div>
                      <span className="processing-time">
                        {formatTime(processingTime)}
                      </span>
                    </div>
                  ) : (
                    <>
                      {result && result.url ? (
                        <img
                          key={`img-${result.url.slice(-20)}`}
                          src={result.url}
                          alt={`Rötuşlanan görsel ${index + 1}`}
                          className="result-image"
                          onError={(e) => handleImageError(e, index)}
                          onLoad={() => handleImageLoad(index)}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "all 0.3s ease",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#f0f0f0",
                          }}
                        >
                          <RiImageLine size={32} color="#bababa" />
                        </div>
                      )}

                      {imageErrors[index] && (
                        <div style={imageErrorOverlayStyle}>
                          <div>Yüklenirken hata oluştu</div>
                          <div style={{ fontSize: "0.8em", marginTop: "5px" }}>
                            Demo görüntü gösteriliyor
                          </div>
                        </div>
                      )}

                      <div className="result-actions">
                        <button
                          className="action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result && result.url) {
                              handleOpenFullscreen(result.url);
                            }
                          }}
                          title="Tam Ekran"
                        >
                          <RiFullscreenLine />
                        </button>
                        <button
                          className="action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result && result.url) {
                              downloadImage(result.url);
                            }
                          }}
                          title="İndir"
                        >
                          <RiDownloadLine />
                        </button>
                        <button
                          className="action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result) {
                              onEditPrompt(index, result.description || "");
                            }
                          }}
                          title="Açıklamayı Düzenle"
                        >
                          <RiPencilLine />
                        </button>
                        <button
                          className="action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result && result.url) {
                              onEnhanceImage(result.url, index);
                            }
                          }}
                          title="Geliştir"
                          style={{
                            backgroundColor: "#8A2BE2",
                            color: "white",
                          }}
                        >
                          <RiSparklingLine color="white" />
                        </button>
                        <button
                          className="action-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (result && result.url) {
                              onRemoveBackground(result.url, index);
                            }
                          }}
                          title="Arkaplanı Sil"
                          style={{
                            backgroundColor: "#8ADB53",
                            color: "white",
                          }}
                        >
                          <RiEraserLine color="white" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : isGenerating ? (
        <div className="results-empty">
          <div
            className="results-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(50% - 10px), 1fr))",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="result-item placeholder"
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #eee",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div className="spinner"></div>
                <span className="processing-time">
                  {formatTime(processingTime)}
                </span>
              </div>
            ))}
          </div>
          <p
            className="help-text"
            style={{ textAlign: "center", color: "#888", margin: "20px 0" }}
          >
            Görsel rötuşlanıyor, lütfen bekleyin...
          </p>
        </div>
      ) : (
        <div className="results-empty">
          <div
            className="results-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(calc(50% - 10px), 1fr))",
              gap: "10px",
              alignItems: "flex-start",
            }}
          >
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="result-item placeholder"
                style={{
                  position: "relative",
                  aspectRatio: "1/1",
                  borderRadius: "8px",
                  backgroundColor: "#f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #ddd",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#bababa",
                  }}
                >
                  <RiImageLine size={32} />
                </div>
              </div>
            ))}
          </div>
          <p
            className="help-text"
            style={{ textAlign: "center", color: "#888", margin: "20px 0" }}
          >
            Fotoğraf yükleyip rötuşlamayı deneyin. Sistem 4 farklı sonuç
            oluşturacaktır.
          </p>
        </div>
      )}

      {/* Tam ekran modal */}
      <FullscreenImageModal
        key={
          fullscreenImage ? `modal-${fullscreenImage.slice(-20)}` : "no-modal"
        }
        isOpen={!!fullscreenImage}
        onClose={handleCloseFullscreen}
        imageUrl={fullscreenImage}
        sourceImageUrl={previewUrl}
      />
    </div>
  );
}

export default WidgetResults;
