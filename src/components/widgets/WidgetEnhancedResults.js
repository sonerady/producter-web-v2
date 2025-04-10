import React, { useState, useEffect } from "react";
import {
  RiSearchEyeLine,
  RiSparklingLine,
  RiImageLine,
  RiFullscreenLine,
  RiDownloadLine,
  RiEraserLine,
  RiCloseLine,
} from "@remixicon/react";
import FullscreenImageModal from "../modals/FullscreenImageModal";

function WidgetEnhancedResults({
  enhancedImages,
  style,
  onCleanImage,
  uploadedImage,
}) {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [fullscreenSourceImage, setFullscreenSourceImage] = useState(null);
  const [processingTimes, setProcessingTimes] = useState({});

  // Timer için useEffect hook'u
  useEffect(() => {
    const timers = {};

    if (enhancedImages) {
      enhancedImages.forEach((image, index) => {
        if (image && image.loading) {
          // Her yüklenen görsel için bir sayaç başlat
          if (!timers[index]) {
            timers[index] = {
              startTime: Date.now(),
              intervalId: setInterval(() => {
                setProcessingTimes((prev) => {
                  const elapsedSeconds = Math.floor(
                    (Date.now() - timers[index].startTime) / 1000
                  );
                  return {
                    ...prev,
                    [index]: elapsedSeconds,
                  };
                });
              }, 1000),
            };
          }
        } else if (timers[index]) {
          // Yükleme bittiyse sayacı durdur
          clearInterval(timers[index].intervalId);
          delete timers[index];
        }
      });
    }

    // Cleanup function
    return () => {
      Object.values(timers).forEach((timer) => {
        clearInterval(timer.intervalId);
      });
    };
  }, [enhancedImages]);

  // Saniye formatını "1m 2s" formatına çevirme
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

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
        a.download = filename || "enhanced-image.jpg";
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
        a.download = filename || "enhanced-image.jpg";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  // İşlenmiş görüntülerin sayısını hesapla
  const processedCount = enhancedImages
    ? enhancedImages.filter((img) => img !== null).length
    : 0;

  // Dinamik stil ekleme
  useEffect(() => {
    // Spinner animasyonu için CSS ekleme
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top: 5px solid #8A2BE2;
        border-left: 5px solid #8A2BE2;
        border-right: 5px solid transparent;
        animation: spin 0.8s linear infinite;
        display: inline-block;
        box-sizing: border-box;
        vertical-align: middle;
        box-shadow: 0 0 5px rgba(0,0,0,0.1);
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
      className="enhanced-results-panel"
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
      <h2
        style={{
          fontSize: "16px",
          fontWeight: "500",
          margin: "0 0 15px 0",
        }}
      >
        Netleştirme
      </h2>

      <div
        className={enhancedImages ? "results-container" : "results-empty"}
        style={{ flex: "1" }}
      >
        <div
          className="results-grid"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            alignItems: "center",
          }}
        >
          {!enhancedImages
            ? // Henüz görsel netleştirme işlemi başlatılmadığında 4 boş kart gösteriyoruz
              Array(4)
                .fill(null)
                .map((_, index) => (
                  <div
                    key={index}
                    className="result-item placeholder"
                    style={{
                      position: "relative",
                      width: "100%",
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
            : // enhancedImages var, 4 kart gösteriyoruz
              Array(4)
                .fill(null)
                .map((_, index) => {
                  // enhancedImages[index] varsa o görseli göster, yoksa boş placeholder
                  const image = enhancedImages[index];

                  if (!image) {
                    return (
                      <div
                        key={index}
                        className="result-item placeholder"
                        style={{
                          position: "relative",
                          width: "100%",
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
                        width: "100%",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #eee",
                        backgroundColor: "#fff",
                      }}
                    >
                      {image.loading ? (
                        // Yükleniyor durumu - Arkaplanda blur kaynak resim göster
                        <div
                          className="loading-spinner"
                          style={{
                            position: "relative",
                            width: "100%",
                            height: "0",
                            paddingBottom: "100%", // Kare oran için 1:1 aspect ratio
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "4px",
                            overflow: "hidden", // Taşan içeriği kırp
                          }}
                        >
                          {/* Kaynak resmi blur ile arka planda göster */}
                          {image.sourceImageUrl && (
                            <img
                              src={image.sourceImageUrl}
                              alt="Kaynak görüntü"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "blur(8px)",
                                opacity: "0.7",
                              }}
                            />
                          )}

                          {/* Spinner ortada */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              zIndex: 2,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              padding: "15px",
                              borderRadius: "10px",
                            }}
                          >
                            <div
                              className="spinner"
                              style={{
                                display: "block",
                                margin: "0 auto",
                              }}
                            ></div>
                            <div
                              style={{
                                marginTop: "10px",
                                textAlign: "center",
                                color: "#8A2BE2",
                                fontWeight: "500",
                                fontSize: "14px",
                                textShadow: "0 0 5px white",
                              }}
                            >
                              {processingTimes[index] !== undefined
                                ? formatTime(processingTimes[index])
                                : "Başlatılıyor..."}
                            </div>
                          </div>
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
                        // Başarıyla netleştirilmiş görüntü
                        <>
                          <div
                            style={{
                              width: "100%",
                              height: "0",
                              paddingBottom: "100%", // Kare oran için 1:1 aspect ratio
                              overflow: "hidden",
                              position: "relative",
                              borderRadius: "4px",
                            }}
                            className="result-image-container"
                          >
                            <img
                              src={image.url}
                              alt={`Netleştirilmiş ${index + 1}`}
                              style={{
                                position: "absolute",
                                top: "0",
                                left: "0",
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
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
                                      : "enhanced"
                                  }_enhanced.jpg`
                                );
                              }}
                            >
                              <RiDownloadLine />
                            </button>
                            <button
                              className="action-icon"
                              title="Arkaplanı Sil"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCleanImage(image.url, index);
                              }}
                              style={{
                                backgroundColor: "#8ADB53", // Yeşilimsi arka plan
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

        {/* Eğer hiç netleştirilmiş görüntü yoksa ve yükleme işlemi de yoksa uygun mesajı göster */}
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

export default WidgetEnhancedResults;
