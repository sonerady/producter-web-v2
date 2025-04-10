import React, { useState, useEffect } from "react";
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

  // Süre sayacı için timer
  useEffect(() => {
    let timer;
    if (
      isGenerating ||
      (resultImages && resultImages.some((img) => img.loading))
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

  // Süre formatı (1s, 2s, 3s)
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  // Konsol logları ekle
  useEffect(() => {
    if (resultImages && resultImages.length > 0) {
      console.log("WidgetResults - sonuçlar:", resultImages);
      resultImages.forEach((img, idx) => {
        console.log(`Görüntü ${idx + 1} URL:`, img.url);
      });
    }
  }, [resultImages]);

  // Tam ekran modalı açma fonksiyonu
  const handleOpenFullscreen = (imageUrl) => {
    console.log("Tam ekran açılıyor:", imageUrl);
    setFullscreenImage(imageUrl);
  };

  // Dosya indirme fonksiyonu
  const downloadImage = (url, filename) => {
    console.log("İndiriliyor:", url);

    // Supabase URL'den direkt indirme
    fetch(url, {
      method: "GET",
      mode: "cors",
    })
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "download.jpg";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error("İndirme hatası:", error);
        // Fallback - doğrudan URL ile dene
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "download.jpg";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
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
    const style = document.createElement("style");
    style.textContent = `
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
    document.head.appendChild(style);

    // Temizleme fonksiyonu
    return () => {
      document.head.removeChild(style);
    };
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
            {resultImages.map((result, index) => (
              <div
                key={index}
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
                    <img
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
                          handleOpenFullscreen(result.url);
                        }}
                        title="Tam Ekran"
                      >
                        <RiFullscreenLine />
                      </button>
                      <button
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(
                            result.url,
                            `retouched_image_${index + 1}.jpg`
                          );
                        }}
                        title="İndir"
                      >
                        <RiDownloadLine />
                      </button>
                      <button
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPrompt(index, result.description || "");
                        }}
                        title="Açıklamayı Düzenle"
                      >
                        <RiPencilLine />
                      </button>
                      <button
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEnhanceImage(result.url, index);
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
                          onRemoveBackground(result.url, index);
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
            ))}
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
        isOpen={!!fullscreenImage}
        onClose={() => setFullscreenImage(null)}
        imageUrl={fullscreenImage}
        sourceImageUrl={previewUrl}
      />
    </div>
  );
}

export default WidgetResults;
