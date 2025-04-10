import React, { useState, useEffect } from "react";
import {
  RiImageLine,
  RiEraserLine,
  RiCloseLine,
  RiFullscreenLine,
  RiDownloadLine,
} from "@remixicon/react";
import FullscreenImageModal from "../modals/FullscreenImageModal";

function WidgetBackgroundRemovedResults({
  removedBgImages,
  style,
  uploadedImage,
}) {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenSourceImage, setFullscreenSourceImage] = useState(null);

  // Tam ekran modalı açma fonksiyonu
  const handleOpenFullscreen = (imageUrl, sourceImageUrl) => {
    if (!imageUrl) return;
    console.log("Tam ekran açılıyor:", imageUrl);
    setFullscreenImage(imageUrl);
    setFullscreenSourceImage(sourceImageUrl);
  };

  // Dosya indirme fonksiyonu
  const downloadImage = (url, filename) => {
    if (!url) return;
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
        a.download = filename || "nobg-image.png";
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
        a.download = filename || "nobg-image.png";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  // İşlenmiş görüntülerin sayısını hesapla
  const processedCount = removedBgImages
    ? removedBgImages.filter((img) => img !== null && !img.loading).length
    : 0;

  // Şeffaf arka plan için dama deseni CSS
  const checkerboardBg = {
    backgroundImage: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                      linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                      linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                      linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)`,
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
    backgroundColor: "#ffffff",
  };

  // Süre formatı
  const formatTime = (seconds) => {
    return `${seconds}s`;
  };

  // İşleme süresi için sayaç
  const [processingTime, setProcessingTime] = useState(0);

  // Arkaplan silme işlemi sırasında süre sayacı
  useEffect(() => {
    let timer;
    if (removedBgImages && removedBgImages.some((img) => img && img.loading)) {
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
  }, [removedBgImages]);

  useEffect(() => {
    // Spinner ve stil ekleme
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      className="background-removed-results-panel"
      style={{
        ...style,
        padding: "15px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        height: "fit-content",
        minHeight: "300px",
        overflow: "hidden",
        border: "1px solid #e0e0e073",
      }}
    >
      <h2>
        <span className="icon-placeholder">
          <RiEraserLine />
        </span>{" "}
        Arkaplanı Kaldırılmış Sonuçlar
        {removedBgImages &&
          removedBgImages.some((img) => img && img.loading) && (
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

      <div
        className={removedBgImages ? "results-container" : "results-empty"}
        style={{ flex: "1" }}
      >
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
          {!removedBgImages
            ? // Henüz arkaplan kaldırma işlemi başlatılmadığında 4 boş kart gösteriyoruz
              Array(4)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
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
                ))
            : // removedBgImages var, 4 kart gösteriyoruz
              Array(4)
                .fill(null)
                .map((_, index) => {
                  // removedBgImages[index] varsa o görseli göster, yoksa boş placeholder
                  const image = removedBgImages[index];

                  if (!image) {
                    return (
                      <div
                        key={index}
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
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="result-item"
                      style={{
                        position: "relative",
                        height: "100%",
                        minHeight: "120px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #eee",
                        backgroundColor: "#fff",
                      }}
                    >
                      {image.loading ? (
                        // Yükleniyor durumu - Basit beyaz arka plan
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "100%",
                            width: "100%",
                            position: "relative",
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                          }}
                        >
                          <div className="spinner"></div>
                          <span className="processing-time">
                            {formatTime(processingTime)}
                          </span>
                        </div>
                      ) : image.error ? (
                        // Hata durumu
                        <div
                          style={{
                            width: "100%",
                            height: "0",
                            paddingBottom: "100%",
                            position: "relative",
                            backgroundColor: "rgba(255, 0, 0, 0.05)",
                            borderRadius: "4px",
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
                              color: "#ff6b6b",
                            }}
                          >
                            <RiCloseLine size={32} />
                            <span
                              style={{ marginTop: "5px", fontSize: "12px" }}
                            >
                              Hata Oluştu
                            </span>
                          </div>
                        </div>
                      ) : (
                        // Başarıyla arkaplanı kaldırılmış görüntü
                        <>
                          <div
                            style={{
                              width: "100%",
                              height: "0",
                              paddingBottom: "100%", // Kare oran için 1:1 aspect ratio
                              overflow: "hidden",
                              position: "relative",
                              borderRadius: "4px",
                              ...checkerboardBg, // Dama deseni arka plan
                            }}
                            className="result-image-container"
                          >
                            <img
                              src={image.url}
                              alt={`Arkaplanı Kaldırılmış ${index + 1}`}
                              style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="result-actions">
                            <button
                              className="action-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFullscreen(
                                  image.url,
                                  image.sourceImageUrl
                                );
                              }}
                            >
                              <RiFullscreenLine />
                            </button>
                            <button
                              className="action-icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadImage(
                                  image.url,
                                  `${
                                    uploadedImage
                                      ? uploadedImage.name.replace(
                                          /\.[^/.]+$/,
                                          ""
                                        )
                                      : "nobg"
                                  }_nobg.png`
                                );
                              }}
                            >
                              <RiDownloadLine />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
        </div>
        {processedCount === 0 && removedBgImages && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#888",
            }}
          >
            <p>
              Rötuşlama tamamlandıktan sonra arkaplan kaldırma
              uygulayabilirsiniz.
            </p>
          </div>
        )}
        {!removedBgImages && (
          <p
            className="help-text"
            style={{ textAlign: "center", color: "#888", margin: "20px 0" }}
          >
            Rötuşlama tamamlandıktan sonra arkaplan kaldırma uygulayabilirsiniz.
          </p>
        )}
      </div>

      {/* Tam ekran modal */}
      <FullscreenImageModal
        isOpen={!!fullscreenImage}
        onClose={() => {
          setFullscreenImage(null);
          setFullscreenSourceImage(null);
        }}
        imageUrl={fullscreenImage}
        sourceImageUrl={fullscreenSourceImage}
      />
    </div>
  );
}

export default WidgetBackgroundRemovedResults;
