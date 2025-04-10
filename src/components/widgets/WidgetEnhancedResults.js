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
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #3498db;
        animation: spin 1s linear infinite;
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
      <h2>
        <span className="icon-placeholder">
          <RiSearchEyeLine />
        </span>{" "}
        Netleştirilmiş Sonuçlar
      </h2>

      <div
        className={enhancedImages ? "results-container" : "results-empty"}
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
                      <span style={{ marginTop: "5px", fontSize: "12px" }}>
                        Bekleniyor
                      </span>
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
                          <span style={{ marginTop: "5px", fontSize: "12px" }}>
                            Bekleniyor
                          </span>
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
                        // Yükleniyor durumu
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
                            backgroundColor: "rgba(0, 0, 0, 0.05)",
                            borderRadius: "4px",
                            overflow: "hidden", // Taşan içeriği kırp
                          }}
                        >
                          {/* Netleştirilen kaynak resmi arka planda göster */}
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
                                opacity: 0.5,
                                filter: "blur(2px)",
                              }}
                              onError={(e) =>
                                console.error(
                                  "Kaynak görüntü yüklenirken hata:",
                                  e
                                )
                              }
                            />
                          )}

                          <div
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "rgba(255, 255, 255, 0.7)",
                              zIndex: 2,
                            }}
                          >
                            <div className="spinner"></div>
                            <span
                              style={{
                                marginTop: "10px",
                                fontSize: "14px",
                                color: "#666",
                              }}
                            >
                              Netleştiriliyor...
                            </span>
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
        {enhancedImages && processedCount === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "20px",
              color: "#888",
            }}
          >
            <p>
              Rötuşlama tamamlandıktan sonra netleştirmek istediğiniz görselin
              AI netleştirme butonuna tıklayın.
            </p>
          </div>
        )}
        {!enhancedImages && (
          <p
            className="help-text"
            style={{ textAlign: "center", color: "#888", margin: "20px 0" }}
          >
            Rötuşlama tamamlandıktan sonra AI netleştirme uygulayabilirsiniz.
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

export default WidgetEnhancedResults;
