import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import "./App.css";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
  ReactCompareSliderHandle,
} from "react-compare-slider";

// İkonlar için
import {
  RiArrowRightLine,
  RiCheckLine,
  RiCloseLine,
  RiCropLine,
  RiDeleteBin6Line,
  RiDownloadLine,
  RiFullscreenLine,
  RiImageLine,
  RiPencilLine,
  RiRefreshLine,
  RiSearchEyeLine,
  RiSparklingLine,
  RiUpload2Line,
  RiZoomInLine,
  RiZoomOutLine,
  RiEraserLine, // Makas ikonu yerine silgi ikonu ekledik
  RiContrastLine,
  RiUploadCloud2Line,
  RiEditLine,
  RiFileEditLine,
} from "@remixicon/react";

// Widget - Kaynak ve Açıklama Bileşeni
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
}) {
  return (
    <div
      className="product-retouch-panel"
      style={{
        ...style,
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
        <div>
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="İsterseniz ürünü detaylı bir şekilde açıklayabilirsiniz (malzeme, renk, doku, tasarım detayları vs.)"
            style={{
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              minHeight: "80px",
              padding: "8px",
              resize: "vertical",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          {error && <p className="error-message">{error}</p>}
          <button
            className="retouch-button"
            onClick={handleGenerate}
            disabled={isDisabled}
          >
            {isGenerating ? "İşleniyor..." : "Fotoğrafı Rötuşla"}
            <span className="arrow">
              <RiArrowRightLine />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Widget - Sonuçlar Bileşeni
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
}) {
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);

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
        position: relative;
      }
      
      .result-image-container:hover {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
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
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.3s ease;
      }
      
      .result-image-container:hover .result-actions {
        opacity: 1;
        transform: translateX(0);
      }
      
      .action-icon {
        background-color: rgba(255, 255, 255, 0.85);
        border: none;
        border-radius: 8px;
        padding: 8px;
        margin-bottom: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
      }
      
      .action-icon:hover {
        background-color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transform: translateY(-2px);
      }
      
      .action-icon.primary {
        display: flex;
      }
      
      .action-icon.secondary {
        display: none;
      }
      
      .result-image-container:hover .action-icon.secondary {
        display: flex;
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
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h2>
        <span className="icon-placeholder">
          <RiSparklingLine />
        </span>{" "}
        Rötuşlanmış Sonuçlar
      </h2>

      {!resultImages ? (
        <div className="results-empty">
          <div className="results-grid">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className="result-item placeholder"
                style={{ position: "relative", aspectRatio: "1/1" }}
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
            ))}
          </div>
          <p className="help-text">
            Fotoğraf yükleyip rötuşlamayı deneyin. Sistem 4 farklı sonuç
            oluşturacaktır.
          </p>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-grid">
            {resultImages.map((image, index) => (
              <div
                key={index}
                className={`result-item ${
                  selectedIndex === index ? "selected" : ""
                }`}
                onClick={() => !image.loading && onSelectResult(index)}
                onMouseEnter={() => setHoveredImageIndex(index)}
                onMouseLeave={() => setHoveredImageIndex(null)}
              >
                {image.loading ? (
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
                          console.error("Kaynak görüntü yüklenirken hata:", e)
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
                      <div
                        className="spinner"
                        style={{
                          width: "40px",
                          height: "40px",
                          border: "3px solid rgba(0, 0, 0, 0.1)",
                          borderTopColor: "#3498db",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                        }}
                      ></div>
                      <span
                        style={{
                          marginTop: "10px",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        Rötuşlanıyor...
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        width: "100%",
                        height: "0",
                        paddingBottom: "100%", // Kare oran için 1:1 aspect ratio
                        overflow: "hidden",
                        position: "relative",
                      }}
                      className="result-image-container"
                    >
                      {console.log(`Render görüntü ${index + 1}:`, image.url)}
                      {imageErrors[index] && (
                        <div style={imageErrorOverlayStyle}>
                          <RiSearchEyeLine size={32} />
                          <span>Görüntüyü görmek için tıklayın</span>
                          <button
                            style={{
                              marginTop: "10px",
                              padding: "5px 10px",
                              background: "#ffffff33",
                              border: "none",
                              borderRadius: "4px",
                              color: "white",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFullscreen(image.url);
                            }}
                          >
                            <RiFullscreenLine /> Görüntüyü Aç
                          </button>
                        </div>
                      )}
                      <img
                        src={image.url}
                        alt={`Sonuç ${index + 1}`}
                        className=""
                        style={{
                          position: "absolute",
                          top: "0",
                          left: "0",
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => handleImageError(e, index)}
                        onLoad={() => handleImageLoad(index)}
                        crossOrigin="anonymous"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="result-actions">
                      <button
                        className="action-icon primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullscreen(image.url);
                        }}
                      >
                        <RiFullscreenLine size={18} color="#333" />
                      </button>
                      <button
                        className="action-icon primary"
                        style={{
                          backgroundColor: "#8A2BE2", // Mor arka plan
                          color: "white", // Beyaz ikon rengi
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log(
                            `Sparkle butonuna tıklandı - index: ${index}, URL: ${image.url}`
                          );
                          onEnhanceImage(image.url, index);
                        }}
                      >
                        <RiSparklingLine size={18} color="white" />
                      </button>
                      <button
                        className="action-icon primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPrompt(index, image.description);
                        }}
                      >
                        <RiPencilLine size={18} color="#333" />
                      </button>

                      <button
                        className="action-icon"
                        title="Arkaplanı Sil"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBackground(image.url, index);
                        }}
                        style={{
                          backgroundColor: "#8ADB53", // Yeşilimsi arka plan
                          position: "relative", // Tooltip için position relative
                        }}
                      >
                        <RiEraserLine color="#fff" />
                        <span
                          style={{
                            position: "absolute",
                            top: "-25px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            backgroundColor: "rgba(0, 0, 0, 0.8)",
                            color: "#ff4444", // Kırmızı renk
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            pointerEvents: "none",
                          }}
                          className="tooltip"
                        >
                          Arkaplanı Sil
                        </span>
                      </button>

                      <button
                        className="action-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(image.url, `result-${index + 1}.jpg`);
                        }}
                      >
                        <RiDownloadLine size={18} color="#333" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
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

// Widget - Netleştirilmiş Sonuçlar Bileşeni
function WidgetEnhancedResults({ enhancedImages, style, onCleanImage }) {
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

  return (
    <div
      className="enhanced-results-panel"
      style={{
        ...style,
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        height: "fit-content",
        minHeight: "300px",
        overflow: "hidden",
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
          {!enhancedImages ? (
            // Hiç enhancedImages yoksa ve işlem yoksa bilgilendirici mesaj göster
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "30px 20px",
                color: "#888",
              }}
            >
              <RiSparklingLine size={32} style={{ marginBottom: "10px" }} />
              <p>
                Rötuşlama tamamlandıktan sonra netleştirmek istediğiniz görselin
                AI netleştirme butonuna tıklayın.
              </p>
            </div>
          ) : (
            // enhancedImages var, 4 kart gösteriyoruz
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
                      style={{ position: "relative", aspectRatio: "1/1" }}
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
                          <div
                            className="spinner"
                            style={{
                              width: "40px",
                              height: "40px",
                              border: "3px solid rgba(0, 0, 0, 0.1)",
                              borderTopColor: "#3498db",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          ></div>
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
                          <span style={{ marginTop: "5px", fontSize: "12px" }}>
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
                                `enhanced-${index + 1}.jpg`
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
                              position: "relative", // Tooltip için position relative
                            }}
                          >
                            <RiEraserLine color="#fff" />
                            <span
                              style={{
                                position: "absolute",
                                top: "-25px",
                                left: "50%",
                                transform: "translateX(-50%)",
                                backgroundColor: "rgba(0, 0, 0, 0.8)",
                                color: "#ff4444", // Kırmızı renk
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                whiteSpace: "nowrap",
                                opacity: 0,
                                transition: "opacity 0.2s",
                                pointerEvents: "none",
                              }}
                              className="tooltip"
                            >
                              Arkaplanı Sil
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
          )}
        </div>
        {processedCount === 0 && enhancedImages && (
          <p className="help-text">
            Rötuşlama tamamlandıktan sonra AI netleştirme uygulayabilirsiniz.
          </p>
        )}
        {!enhancedImages && (
          <p className="help-text">
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

// Widget - Arkaplanı Kaldırılmış Sonuçlar Bileşeni
function WidgetBackgroundRemovedResults({ removedBgImages, style }) {
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
    ? removedBgImages.filter((img) => img !== null).length
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

  return (
    <div
      className="background-removed-results-panel"
      style={{
        ...style,
        backgroundColor: "#f8f9fa",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        height: "fit-content",
        minHeight: "300px",
        overflow: "hidden",
      }}
    >
      <h2>
        <span className="icon-placeholder">
          <RiImageLine />
        </span>{" "}
        Arkaplanı Kaldırılmış Sonuçlar
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
          {!removedBgImages ? (
            // Hiç removedBgImages yoksa ve işlem yoksa bilgilendirici mesaj göster
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "30px 20px",
                color: "#888",
              }}
            >
              <RiEraserLine size={32} style={{ marginBottom: "10px" }} />
              <p>
                Rötuşlama tamamlandıktan sonra arkaplanı kaldırmak istediğiniz
                görselin arkaplan kaldırma butonuna tıklayın.
              </p>
            </div>
          ) : (
            // removedBgImages var, 4 kart gösteriyoruz
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
                      style={{ position: "relative", aspectRatio: "1/1" }}
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
                        {/* İşlenen kaynak resmi arka planda göster */}
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
                          <div
                            className="spinner"
                            style={{
                              width: "40px",
                              height: "40px",
                              border: "3px solid rgba(0, 0, 0, 0.1)",
                              borderTopColor: "#3498db",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                            }}
                          ></div>
                          <span
                            style={{
                              marginTop: "10px",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            Arkaplan Kaldırılıyor...
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
                          <span style={{ marginTop: "5px", fontSize: "12px" }}>
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
                              downloadImage(image.url, `nobg-${index + 1}.png`);
                            }}
                          >
                            <RiDownloadLine />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
          )}
        </div>
        {processedCount === 0 && removedBgImages && (
          <p className="help-text">
            Rötuşlama tamamlandıktan sonra arkaplan kaldırma uygulayabilirsiniz.
          </p>
        )}
        {!removedBgImages && (
          <p className="help-text">
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

// Kırpma Modalı Bileşeni
function CropModal({ isOpen, onClose, imageUrl, onCropComplete }) {
  const [loading, setLoading] = useState(false);
  const imgRef = useRef(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [selectedAspect, setSelectedAspect] = useState("square");
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [padding, setPadding] = useState(20); // Kenar boşluğu yüzdesi - %20 başlangıç değeri

  // Scale edilmiş görüntüde piksel konumlarını orijinal görüntüye dönüştürme
  function convertPixels(pixelCrop, scale) {
    return {
      x: pixelCrop.x / scale,
      y: pixelCrop.y / scale,
      width: pixelCrop.width / scale,
      height: pixelCrop.height / scale,
    };
  }

  // Aspect ratio seçenekleri
  const aspectOptions = [
    {
      id: "square",
      label: "Kare",
      aspectRatio: 1,
      description: "E-ticaret",
    },
    {
      id: "product",
      label: "4:3",
      aspectRatio: 4 / 3,
      description: "Ürün",
    },
    {
      id: "wide",
      label: "16:9",
      aspectRatio: 16 / 9,
      description: "Banner",
    },
    {
      id: "portrait",
      label: "3:4",
      aspectRatio: 3 / 4,
      description: "Portre",
    },
  ];

  // Seçili aspect ratio'yu bul
  const selectedAspectOption =
    aspectOptions.find((option) => option.id === selectedAspect) ||
    aspectOptions[0];

  // Görüntü yüklendiğinde başlangıç kırpma alanını ayarla
  const onImageLoad = useCallback(
    (e) => {
      const { width, height } = e.currentTarget;

      // Görüntüyü ortala
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 80, // Görüntünün %80'ini kapla
          },
          selectedAspectOption.aspectRatio,
          width,
          height
        ),
        width,
        height
      );

      setCrop(crop);
    },
    [selectedAspectOption.aspectRatio]
  );

  // Aspect Ratio değiştiğinde kırpma alanını güncelle
  useEffect(() => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;

      // Görüntüyü ortala ve yeni aspect ratio'ya göre ayarla
      const crop = centerCrop(
        makeAspectCrop(
          {
            unit: "%",
            width: 80, // Görüntünün %80'ini kapla
          },
          selectedAspectOption.aspectRatio,
          width,
          height
        ),
        width,
        height
      );

      setCrop(crop);
    }
  }, [selectedAspect, selectedAspectOption.aspectRatio]);

  // Aspect ratio değiştirme işleyicisi
  const handleAspectChange = (aspectId) => {
    setSelectedAspect(aspectId);
  };

  // Zoom işlevleri
  const handleZoomIn = () => setScale(Math.min(scale + 0.1, 3));
  const handleZoomOut = () => setScale(Math.max(scale - 0.1, 0.5));
  const resetZoom = () => {
    setScale(1);
    setRotate(0);
    // Kırpma alanını sıfırla
    if (imgRef.current) {
      onImageLoad({
        currentTarget: imgRef.current,
      });
    }
  };

  // Kenar boşluğunu değiştirme işleyicisi
  const handlePaddingChange = (e) => {
    setPadding(parseInt(e.target.value, 10));
  };

  // Kırpma işlemini tamamla
  const handleSave = async () => {
    if (!imgRef.current || !completedCrop) return;

    try {
      setLoading(true);

      // Kırpma işlemini gerçekleştir
      const simulateCrop = () => {
        return new Promise((resolve) => {
          const image = imgRef.current;

          // Canvas oluştur ve kırpma işlemini gerçekleştir
          const canvas = document.createElement("canvas");
          const scaleX = image.naturalWidth / image.width;
          const scaleY = image.naturalHeight / image.height;

          // Kırpılacak alanın boyutları
          const pixelCrop = {
            x: completedCrop.x * scaleX,
            y: completedCrop.y * scaleY,
            width: completedCrop.width * scaleX,
            height: completedCrop.height * scaleY,
          };

          // Canvas'ın boyutları
          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;

          const ctx = canvas.getContext("2d");

          // Rotasyon ve ölçekleme için daha doğru bir yaklaşım:
          // 1. Yeni bir canvas oluştur
          const rotateCanvas = document.createElement("canvas");
          const rotateCtx = rotateCanvas.getContext("2d");

          // 2. Orijinal resim boyutunda rotateCanvas oluştur
          rotateCanvas.width = image.naturalWidth;
          rotateCanvas.height = image.naturalHeight;

          // 3. Resmin merkezini bul
          const centerX = image.naturalWidth / 2;
          const centerY = image.naturalHeight / 2;

          // 4. Rotasyon ve ölçekleme uygula
          rotateCtx.translate(centerX, centerY);
          rotateCtx.rotate((rotate * Math.PI) / 180);
          rotateCtx.scale(scale, scale);
          rotateCtx.translate(-centerX, -centerY);

          // 5. Orijinal resmi rotateCanvas'a çiz
          rotateCtx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight
          );

          // 6. Son canvas'a kırpılmış alanı çiz
          ctx.drawImage(
            rotateCanvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
          );

          // Canvas'ı URL'ye dönüştür ve döndür
          canvas.toBlob((blob) => {
            if (!blob) {
              console.error("Canvas to Blob dönüşümü başarısız oldu");
              return;
            }

            const file = new File([blob], "cropped-image.jpg", {
              type: "image/jpeg",
            });

            resolve(file);
          }, "image/jpeg");
        });
      };

      // Kırpma koordinatlarını konsola yazdır
      console.log("Kırpma Bilgileri:", {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height,
        unit: completedCrop.unit,
        aspectRatio: selectedAspectOption.aspectRatio,
        zoom: scale,
        rotate: rotate,
        paddingPercent: padding,
      });

      // Crop işlemini gerçekleştir ve dosyı al
      const croppedFile = await simulateCrop();

      // Önce modal kapatılsın
      onClose();

      // Ana bileşene dosyı gönder
      onCropComplete(croppedFile);
      setLoading(false);
    } catch (error) {
      console.error("Kırpma işlemi başarısız:", error);
      setLoading(false);
    }
  };

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="modal-overlay">
      <div className="crop-modal">
        {/* Üst kontrol çubuğu */}
        <div className="modal-header">
          <div className="header-controls">
            <button onClick={onClose} className="close-button">
              <RiCloseLine />
            </button>
            <h3>Fotoğrafı Düzenle</h3>
          </div>
          <div className="zoom-info">{Math.round(scale * 100)}%</div>
        </div>

        {/* Görüntü önizleme alanı */}
        <div className="crop-container">
          {/* Arka plan ızgara deseni */}
          <div className="transparent-grid"></div>

          {/* ReactCrop bileşeni */}
          <div className="crop-wrapper">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={selectedAspectOption.aspectRatio}
              minWidth={50}
              minHeight={50}
              keepSelection={true}
              ruleOfThirds
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Düzenlenecek görüntü"
                style={{
                  transform: `scale(${scale}) rotate(${rotate}deg)`,
                  maxHeight: "70vh",
                  maxWidth: "100%",
                }}
                onLoad={onImageLoad}
                className="crop-image"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Sol panel - oran seçimi */}
        <div className="left-panel">
          <h4>Oran</h4>
          <div className="aspect-options">
            {aspectOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAspectChange(option.id)}
                className={`aspect-button ${
                  selectedAspect === option.id ? "selected" : ""
                }`}
              >
                <span className="aspect-label">{option.label}</span>
                <span className="aspect-description">{option.description}</span>
              </button>
            ))}
          </div>

          {/* Kenar boşluğu kontrolü */}
          <div className="padding-control">
            <h4>Kenar Boşluğu</h4>
            <div className="padding-slider-container">
              <input
                type="range"
                min="0"
                max="50"
                value={padding}
                onChange={handlePaddingChange}
                className="padding-slider"
              />
              <span className="padding-value">%{padding}</span>
            </div>
          </div>
        </div>

        {/* Sağ panel - zoom kontrolleri */}
        <div className="right-panel">
          <div className="zoom-controls">
            <button onClick={handleZoomIn} className="zoom-button">
              <RiZoomInLine />
            </button>

            <div className="zoom-value">{Math.round(scale * 100)}%</div>

            <button onClick={handleZoomOut} className="zoom-button">
              <RiZoomOutLine />
            </button>

            <button
              onClick={resetZoom}
              className="zoom-button reset"
              title="Görüntüyü sıfırla"
            >
              <RiRefreshLine />
            </button>
          </div>
        </div>

        {/* Alt panel - kontroller */}
        <div className="modal-footer">
          <div className="dimension-info">
            {completedCrop &&
              `${Math.round(completedCrop.width)} × ${Math.round(
                completedCrop.height
              )} piksel`}
          </div>
          <div className="button-group">
            <button onClick={onClose} className="cancel-button">
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={!completedCrop || loading}
              className="save-button"
            >
              {loading ? (
                <span className="loading-spinner-small"></span>
              ) : (
                <RiCheckLine />
              )}
              Kırpmayı Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tam ekran modal bileşeni
function FullscreenImageModal({ isOpen, onClose, imageUrl, sourceImageUrl }) {
  const [scale, setScale] = useState(0.8); // Başlangıç değerini 1'den 0.8'e düşürdüm
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Uzaklaştırma ve yakınlaştırma fonksiyonları
  const zoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.2));
  const resetZoom = () => setScale(0.8); // Sıfırlama değerini de 0.8 yaptım

  // Compare modunu açma kapama
  const toggleCompareMode = () => {
    if (!sourceImageUrl) return; // Kaynak görsel yoksa compare moduna geçme
    setCompareMode(!compareMode);
  };

  // İndirme fonksiyonu
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
        // Fallback - doğrudan URL ile dene
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = filename;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  // Görsel yüklendiğinde
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  // Görsel yüklenemediğinde
  const handleImageError = () => {
    setIsLoading(false);
    setError(true);
  };

  // Modal açıldığında state'i sıfırla
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(false);
      setScale(0.8); // Modal açıldığında scale değerini 0.8 olarak ayarla
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
        backgroundColor: "rgba(0, 0, 0, 0.6)", // Şeffaf siyah arka plan
        backdropFilter: "blur(15px)", // Cam efekti
        WebkitBackdropFilter: "blur(15px)", // Safari desteği
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

      {/* Zoom kontrolü sağ tarafta */}
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
                borderTopColor: "#ffffff", // Beyaz renkte spinner
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
              color: "#333", // Koyu renk yazı
              backgroundColor: "rgba(255, 255, 255, 0.8)", // Beyaz arka plan
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
                background: "rgba(50, 50, 50, 0.8)", // Siyah buton
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
                borderRadius: "12px", // Resme radius ekledim
                boxShadow: "0 15px 50px rgba(0, 0, 0, 0.3)", // Siyah gölge
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

// Açıklama düzenleme modalı
function EditPromptModal({ isOpen, onClose, onApply, initialPrompt }) {
  const [editPrompt, setEditPrompt] = useState(initialPrompt);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="edit-modal">
        <div className="modal-header">
          <h3>Rötuş Açıklamasını Düzenle</h3>
          <button onClick={onClose} className="close-button">
            <RiCloseLine />
          </button>
        </div>

        <div className="modal-content">
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="edit-textarea"
            placeholder="Rötuş açıklamasını düzenleyin..."
          />

          <div className="button-group">
            <button onClick={onClose} className="cancel-button">
              İptal
            </button>
            <button
              onClick={() => {
                onApply(editPrompt);
                onClose();
              }}
              className="apply-button"
            >
              <RiCheckLine />
              Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Rötuşlama API sonucunu incelemek için Debug Bileşeni
function ResponseInspector({ response }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!response) return null;

  return (
    <div className="response-inspector">
      {isOpen && (
        <div
          className="inspector-content"
          style={{
            position: "fixed",
            bottom: "50px",
            right: "10px",
            zIndex: 9998,
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "15px",
            borderRadius: "4px",
            maxWidth: "500px",
            maxHeight: "400px",
            overflow: "auto",
          }}
        >
          <h4>API Yanıtı</h4>
          <pre style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [resultImages, setResultImages] = useState(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState(null);
  const [debugResponse, setDebugResponse] = useState(null); // Debug için API yanıtını sakla

  // Netleştirilmiş görüntüler için state ekleyelim
  const [enhancedImages, setEnhancedImages] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState(null);

  // Arkaplanı kaldırılmış görüntüler için state
  const [removedBgImages, setRemovedBgImages] = useState(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [removingBgIndex, setRemovingBgIndex] = useState(null);

  // Modal durumları
  const [showCropModal, setShowCropModal] = useState(false);
  const [showEditPromptModal, setShowEditPromptModal] = useState(false);
  const [editPromptIndex, setEditPromptIndex] = useState(0);
  const [editPromptText, setEditPromptText] = useState("");

  // Dinamik stil ekleme
  useEffect(() => {
    // Spinner animasyonu için CSS ekleme
    const style = document.createElement("style");
    style.textContent = `
      .result-image-container {
        transition: all 0.3s ease;
      }
      
      .result-image-container:hover {
        box-shadow: 0 0 10px rgba(138, 43, 226, 0.4); /* Mor gölge */
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
    `;
    document.head.appendChild(style);

    // Temizleme fonksiyonu
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        setError("Lütfen bir görsel dosyası seçin (JPEG, PNG)");
        return;
      }
      setUploadedImage(selectedFile);
      setError(null);

      // Önizleme URL'i oluştur
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const imageUrl = fileReader.result;
        setImageUrl(imageUrl);
        // Kırpma modalını aç
        setShowCropModal(true);
      };
      fileReader.readAsDataURL(selectedFile);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setImageUrl(null);
    setResultImages(null);
    setError(null);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    if (e.target.value.trim()) {
      setError(null);
    }
  };

  const handleCropComplete = (croppedFile) => {
    // Kırpılmış görüntüyü ana görüntü olarak ayarla
    setUploadedImage(croppedFile);

    // Eski URL'yi temizle ve bellekten serbest bırak
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    // Kırpılmış görüntü için yeni bir URL oluştur
    const newImageUrl = URL.createObjectURL(croppedFile);
    setImageUrl(newImageUrl);

    // Sonuç verilerini sıfırla (yeni kırpılmış görüntü için)
    setResultImages(null);
  };

  const handleGenerate = () => {
    // Eğer resim yoksa hata mesajı göster
    if (!uploadedImage) {
      setError("Lütfen önce bir fotoğraf yükleyin.");
      return;
    }

    // Açıklama alanı artık zorunlu değil
    setError(null);
    setIsGenerating(true);

    // Geçici olarak önceki sonuçları temizle ve yükleniyor durumunu göster
    const tempResults = Array(4)
      .fill(null)
      .map((_, i) => ({
        id: i,
        url: "",
        description: "",
        savedPath: "",
        loading: true,
      }));
    setResultImages(tempResults);
    setSelectedResultIndex(0);

    // Kırpılmış görüntüyü API'ye gönder
    const sendImageToAPI = async () => {
      try {
        // Görüntüyü blob olarak al
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "cropped-image.jpg", {
          type: "image/jpeg",
        });

        console.log(
          "Debug - Görüntü boyutu:",
          Math.round(blob.size / 1024),
          "KB"
        );

        // 4 farklı rötuşlama varyasyonu için açıklamalar
        const promptVariations = [
          prompt.trim() ||
            "Profesyonel ürün fotoğrafı, beyaz arka plan, doğal yumuşak gölgeler",
          prompt.trim()
            ? `${prompt.trim()} - Altın/metal vurgusu ile parlaklık artırılmış`
            : "Altın/metal vurgusu, parlaklık artırılmış profesyonel ürün fotoğrafı",
          prompt.trim()
            ? `${prompt.trim()} - Dramatik kontrastlı çekim`
            : "Dramatik kontrastlı profesyonel ürün fotoğrafı, derinlikli gölgeler",
          prompt.trim()
            ? `${prompt.trim()} - Maksimum parlaklık ve detay`
            : "Maksimum parlaklık ve detay ile profesyonel ürün fotoğrafı",
        ];

        // API endpoint
        const apiBaseUrl =
          process.env.REACT_APP_API_URL || "http://localhost:3001";
        const apiUrl = `${apiBaseUrl}/api/gemini-process`;

        console.log("Gemini API isteği gönderiliyor:", apiUrl);

        // Tüm varyasyonları yükleme durumunda göster
        const tempResults = Array(4)
          .fill(null)
          .map((_, i) => ({
            id: i,
            url: "",
            description: promptVariations[i],
            savedPath: "",
            loading: true,
          }));
        setResultImages(tempResults);

        // Tüm API isteklerini parallel olarak başlat
        const apiRequests = promptVariations.map(async (promptText, index) => {
          try {
            // Her istek için yeni bir FormData oluştur
            const formData = new FormData();
            formData.append("image", file);
            formData.append("prompt", promptText);
            formData.append("userDescription", prompt);

            console.log(`Varyasyon ${index + 1} gönderiliyor:`, promptText);

            // API'ye POST isteği gönder
            const apiResponse = await fetch(apiUrl, {
              method: "POST",
              body: formData,
            });

            if (!apiResponse.ok) {
              const errorText = await apiResponse.text();
              throw new Error(
                `API yanıtı başarısız: ${apiResponse.status} - ${errorText}`
              );
            }

            // JSON yanıtını parse et
            const responseData = await apiResponse.json();
            console.log(`Varyasyon ${index + 1} yanıtı:`, responseData);

            // Debug için yanıtı sakla
            setDebugResponse((prevResponses) => {
              const newResponses = prevResponses ? [...prevResponses] : [];
              newResponses[index] = responseData;
              return newResponses;
            });

            // URL'i proxylerken kullanılan ortak fonksiyon - CORS sorunlarını çözmek için
            const formatImageUrl = (url) => {
              // URL bir string değilse veya boşsa hata fırlat
              if (!url || typeof url !== "string") {
                throw new Error("Geçersiz URL formatı");
              }

              // Supabase URL'si CORS sorunlarına neden oluyorsa, burada URL dönüştürme
              // işlemleri yapılabilir. Örneğin:

              // URL'i olduğu gibi döndür
              return url;
            };

            // Doğrudan supabaseUrls kontrolü yapın
            if (
              responseData.supabaseUrls &&
              responseData.supabaseUrls.length > 0
            ) {
              const imageUrl = formatImageUrl(responseData.supabaseUrls[0]); // İlk URL'i kullan
              console.log(
                `Varyasyon ${index + 1} için Supabase URL'i:`,
                imageUrl
              );

              return {
                id: index,
                url: imageUrl,
                description: promptText,
                savedPath: imageUrl,
                loading: false,
              };
            }
            // generatedImages kontrolü yap
            else if (
              responseData.generatedImages &&
              Array.isArray(responseData.generatedImages) &&
              responseData.generatedImages.length > 0 &&
              responseData.generatedImages[0].supabaseUrl
            ) {
              const imageUrl = formatImageUrl(
                responseData.generatedImages[0].supabaseUrl
              );
              console.log(
                `Varyasyon ${index + 1} için generatedImages supabaseUrl:`,
                imageUrl
              );

              return {
                id: index,
                url: imageUrl,
                description: promptText,
                savedPath: imageUrl,
                loading: false,
              };
            }
            // result alanı kontrolü
            else if (responseData.result) {
              console.log(
                `Varyasyon ${index + 1} görseli (result):`,
                responseData.result
              );

              return {
                id: index,
                url: formatImageUrl(responseData.result),
                description: promptText,
                savedPath: responseData.result,
                loading: false,
              };
            }
            // API yanıtında görsel bulunamadı, hata fırlat
            else {
              console.error(
                `Varyasyon ${index + 1} için geçerli görsel URL'si bulunamadı`,
                responseData
              );
              throw new Error("Görsel URL'si bulunamadı");
            }
          } catch (err) {
            console.error(`Varyasyon ${index + 1} hatası:`, err);
            // Hata durumunda demo görüntü döndür
            return {
              id: index,
              url: `https://fastly.picsum.photos/id/${
                638 + index
              }/600/400.jpg?hmac=sample${index}`,
              description: promptVariations[index],
              savedPath: `result_demo_${index + 1}.jpg`,
              loading: false,
            };
          }
        });

        // Tüm API yanıtlarını bekle
        const results = await Promise.all(apiRequests);

        // Sonuçları daha detaylı logla
        console.log("Tüm API sonuçları:", results);
        results.forEach((result, idx) => {
          console.log(`Sonuç ${idx + 1} - URL:`, result.url);
          console.log(`Sonuç ${idx + 1} - Açıklama:`, result.description);
        });

        // Sonuçları state'e kaydet
        setResultImages(results);
      } catch (error) {
        console.error("API istekleri sırasında genel hata:", error);
        // Genel hata durumunda simüle edilmiş sonuçlara geri dön
        simulateResults();
      } finally {
        setIsGenerating(false);
      }
    };

    // Simüle edilmiş sonuçlar (API çağrısı başarısız olduğunda kullanılır)
    const simulateResults = () => {
      // Gerçek API çağrısı yerine demo amaçlı bir gecikme kullan
      setTimeout(() => {
        // Simüle edilmiş sonuçlar (Gerçek uygulamada burası API sonuçları olacak)
        const results = [
          {
            id: 1,
            url: "https://fastly.picsum.photos/id/638/600/400.jpg?hmac=sM3g-P10hIKm_YZ1hQvfu-x2mpjQRJOSn9Fg3t-AGWE",
            description: prompt,
            savedPath: "result_1.jpg",
            loading: false,
          },
          {
            id: 2,
            url: "https://fastly.picsum.photos/id/447/600/400.jpg?hmac=Y3fzXZcYbwSQsopOs7xCZCHBIpjDMzaPGnqH8JYEVPo",
            description: prompt,
            savedPath: "result_2.jpg",
            loading: false,
          },
          {
            id: 3,
            url: "https://fastly.picsum.photos/id/176/600/400.jpg?hmac=F6r9xAQMjatmncSZaVtPJuTpWgw4g5bQTTrWBKNDwwQ",
            description: prompt,
            savedPath: "result_3.jpg",
            loading: false,
          },
          {
            id: 4,
            url: "https://fastly.picsum.photos/id/94/600/400.jpg?hmac=Nd1bT_X4OI-spq9295iwpFhwHkKSJ9gJpKNeRNvMQ6E",
            description: prompt,
            savedPath: "result_4.jpg",
            loading: false,
          },
        ];

        setResultImages(results);
        setIsGenerating(false);
      }, 2000);
    };

    // API çağrısını başlat
    sendImageToAPI();
  };

  const handleSelectResult = (index) => {
    setSelectedResultIndex(index);
  };

  // Edit prompt işlemleri
  const handleEditPromptOpen = (index, description) => {
    setEditPromptIndex(index);
    setEditPromptText(description);
    setShowEditPromptModal(true);
  };

  const handleEditPromptApply = (newDescription) => {
    if (resultImages && resultImages[editPromptIndex]) {
      const updatedResults = [...resultImages];
      updatedResults[editPromptIndex] = {
        ...updatedResults[editPromptIndex],
        description: newDescription,
      };
      setResultImages(updatedResults);
    }
  };

  // Görüntüyü netleştirme fonksiyonu
  const handleEnhanceImage = async (imageUrl, index) => {
    if (!imageUrl) return;

    try {
      // Eğer bu indekste bir işlem zaten devam ediyorsa çıkış yap
      if (isEnhancing && enhancingIndex === index) return;

      // İşlemin başladığını belirt
      setIsEnhancing(true);
      setEnhancingIndex(index);

      // URL'i logla
      console.log(`Netleştirme için kullanılan URL: ${imageUrl}`);

      // Eğer enhancedImages henüz oluşturulmadıysa, 4 boş öğe içeren bir dizi oluştur
      if (!enhancedImages) {
        setEnhancedImages(Array(4).fill(null));
      }

      // Mevcut netleştirilmiş görüntüleri koru, sadece işlenen indeksi güncelle
      const updatedEnhancedImages = enhancedImages
        ? [...enhancedImages]
        : Array(4).fill(null);

      // Sadece işlenen indeksi güncelle, diğer görüntülere dokunma
      updatedEnhancedImages[index] = {
        id: index,
        url: "", // yükleniyor durumunda henüz URL yok
        loading: true,
        sourceImageUrl: imageUrl, // kaynak URL'i kaydediyoruz
      };

      // State'i güncelleyelim
      setEnhancedImages(updatedEnhancedImages);

      // Gemini API'den gelen generatedPrompt bilgisini al (eğer varsa)
      let generatedPrompt = "";

      // Eğer bu görsel için debugResponse varsa ve generatedPrompt içeriyorsa
      if (
        debugResponse &&
        debugResponse[index] &&
        debugResponse[index].generatedPrompt
      ) {
        generatedPrompt = debugResponse[index].generatedPrompt;
        console.log(
          `Gemini generatedPrompt kullanılıyor (${index}):`,
          generatedPrompt
        );
      }
      // Değilse, bir varsayılan prompt kullan
      else {
        generatedPrompt =
          "Enhance this product image with higher clarity and details.";
        console.log(
          `Varsayılan netleştirme prompt'u kullanılıyor (${index}):`,
          generatedPrompt
        );
      }

      // API endpoint
      const apiBaseUrl =
        process.env.REACT_APP_API_URL || "http://localhost:3001";
      const apiUrl = `${apiBaseUrl}/api/image-clarity`;

      // API isteği gönder
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          mode: "flux", // varsayılan mod
          creativity: 4, // Yaratıcılık seviyesi 4 olarak ayarlandı
          prompt: generatedPrompt, // Gemini'den gelen generatedPrompt - userDescription kaldırıldı
        }),
      });

      if (!response.ok) {
        throw new Error(`API yanıtı başarısız: ${response.status}`);
      }

      // JSON yanıtını parse et
      const responseData = await response.json();
      console.log("Netleştirme API yanıtı:", responseData);

      // Yanıt başarılıysa, netleştirilmiş görüntü URL'sini al
      if (
        responseData.success &&
        (responseData.upscaledImageUrl ||
          responseData.result?.upscaled_image_url)
      ) {
        const enhancedImageUrl =
          responseData.upscaledImageUrl ||
          responseData.result.upscaled_image_url;

        // Mevcut netleştirilmiş görüntüleri koru, sadece işlenen indeksi güncelle
        // Önce güncel state'i al, doğrudan setEnhancedImages içinde yapmak yerine:
        setEnhancedImages((currentEnhancedImages) => {
          const newEnhancedImages = [
            ...(currentEnhancedImages || Array(4).fill(null)),
          ];
          newEnhancedImages[index] = {
            id: index,
            url: enhancedImageUrl,
            loading: false,
            sourceImageUrl: imageUrl, // Kaynak resim URL'sini koru
          };
          return newEnhancedImages;
        });

        console.log(
          `Görüntü netleştirildi. İndeks: ${index}, URL: ${enhancedImageUrl}`
        );
      } else {
        throw new Error(
          "API yanıtında netleştirilmiş görüntü URL'si bulunamadı"
        );
      }
    } catch (error) {
      console.error("Netleştirme sırasında hata:", error);

      // Hata durumunda sadece ilgili görüntüyü hata durumuna güncelle, diğerlerine dokunma
      setEnhancedImages((currentEnhancedImages) => {
        if (!currentEnhancedImages) return Array(4).fill(null);

        const newEnhancedImages = [...currentEnhancedImages];

        if (!newEnhancedImages[index]) {
          newEnhancedImages[index] = {
            id: index,
            error: true,
            loading: false,
            sourceImageUrl: imageUrl, // Hata durumunda da kaynak URL'yi koru
          };
        } else {
          newEnhancedImages[index] = {
            ...newEnhancedImages[index],
            error: true,
            loading: false,
            sourceImageUrl: imageUrl,
          };
        }

        return newEnhancedImages;
      });

      alert(`Görüntü netleştirilemedi: ${error.message}`);
    } finally {
      setIsEnhancing(false);
      setEnhancingIndex(null);
    }
  };

  // Görüntünün arkaplanını kaldırma fonksiyonu
  const handleRemoveBackground = async (imageUrl, index) => {
    if (!imageUrl) return;

    try {
      // Eğer bu indekste bir işlem zaten devam ediyorsa çıkış yap
      if (isRemovingBg && removingBgIndex === index) return;

      // İşlemin başladığını belirt
      setIsRemovingBg(true);
      setRemovingBgIndex(index);

      // URL'i logla
      console.log(`Arkaplan kaldırma için kullanılan URL: ${imageUrl}`);

      // Eğer removedBgImages henüz oluşturulmadıysa, 4 boş öğe içeren bir dizi oluştur
      if (!removedBgImages) {
        setRemovedBgImages(Array(4).fill(null));
      }

      // Mevcut arkaplanı kaldırılmış görüntüleri koru, sadece işlenen indeksi güncelle
      const updatedRemovedBgImages = removedBgImages
        ? [...removedBgImages]
        : Array(4).fill(null);

      // Sadece işlenen indeksi güncelle, diğer görüntülere dokunma
      updatedRemovedBgImages[index] = {
        id: index,
        url: "", // yükleniyor durumunda henüz URL yok
        loading: true,
        sourceImageUrl: imageUrl, // kaynak URL'i kaydediyoruz
      };

      // State'i güncelleyelim
      setRemovedBgImages(updatedRemovedBgImages);

      // API endpoint
      const apiBaseUrl =
        process.env.REACT_APP_API_URL || "http://localhost:3001";
      const apiUrl = `${apiBaseUrl}/api/remove-background`;

      console.log("Arkaplan kaldırma API isteği gönderiliyor:", apiUrl);

      try {
        // Önce URL'nin geçerli olup olmadığını kontrol et
        const urlCheck = new URL(imageUrl);
        console.log("Geçerli URL formatı:", urlCheck.href);
      } catch (urlError) {
        console.error("Geçersiz URL formatı:", imageUrl);
        throw new Error("Geçersiz görüntü URL'si formatı");
      }

      console.log("İstek gövdesi:", { imageUrl });

      // API isteği gönder
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
        }),
      });

      console.log("API yanıt durumu:", response.status);

      // Yanıt metnini al
      const responseText = await response.text();
      console.log("API yanıt metni:", responseText);

      // API yanıtını kontrol et
      if (!response.ok) {
        throw new Error(
          `API yanıtı başarısız: ${response.status}. Yanıt: ${responseText}`
        );
      }

      // JSON yanıtını parse et
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("API yanıtı JSON formatında değil:", e);
        throw new Error("API yanıtı geçersiz format");
      }

      console.log("Arkaplan kaldırma API yanıtı:", responseData);

      // Yanıt başarılıysa, arkaplanı kaldırılmış görüntü URL'sini al
      if (
        responseData.success &&
        (responseData.removedBgUrl || responseData.result?.removed_bg_url)
      ) {
        const removedBgUrl =
          responseData.removedBgUrl || responseData.result.removed_bg_url;

        // URL'nin geçerli olup olmadığını kontrol et
        try {
          new URL(removedBgUrl);
        } catch (e) {
          console.error(
            "Geçersiz arkaplanı kaldırılmış görüntü URL'si:",
            removedBgUrl
          );
          throw new Error("API geçersiz bir URL döndürdü");
        }

        // Mevcut arkaplanı kaldırılmış görüntüleri koru, sadece işlenen indeksi güncelle
        setRemovedBgImages((currentRemovedBgImages) => {
          const newRemovedBgImages = [
            ...(currentRemovedBgImages || Array(4).fill(null)),
          ];
          newRemovedBgImages[index] = {
            id: index,
            url: removedBgUrl,
            loading: false,
            sourceImageUrl: imageUrl, // Kaynak resim URL'sini koru
          };
          return newRemovedBgImages;
        });

        console.log(
          `Arkaplan kaldırıldı. İndeks: ${index}, URL: ${removedBgUrl}`
        );
      } else {
        throw new Error(
          "API yanıtında arkaplanı kaldırılmış görüntü URL'si bulunamadı"
        );
      }
    } catch (error) {
      console.error("Arkaplan kaldırma sırasında hata:", error);

      // Hata durumunda sadece ilgili görüntüyü hata durumuna güncelle, diğerlerine dokunma
      setRemovedBgImages((currentRemovedBgImages) => {
        if (!currentRemovedBgImages) return Array(4).fill(null);

        const newRemovedBgImages = [...currentRemovedBgImages];

        if (!newRemovedBgImages[index]) {
          newRemovedBgImages[index] = {
            id: index,
            error: true,
            loading: false,
            sourceImageUrl: imageUrl, // Hata durumunda da kaynak URL'yi koru
          };
        } else {
          newRemovedBgImages[index] = {
            ...newRemovedBgImages[index],
            error: true,
            loading: false,
            sourceImageUrl: imageUrl,
          };
        }

        return newRemovedBgImages;
      });

      alert(`Arkaplan kaldırılamadı: ${error.message}`);
    } finally {
      setIsRemovingBg(false);
      setRemovingBgIndex(null);
    }
  };

  // Netleştirilmiş görüntünün arkaplanını kaldırma fonksiyonu (Replicate API)
  const handleCleanImage = async (imageUrl, index) => {
    if (!imageUrl) return;

    try {
      // Eğer bu indekste bir işlem zaten devam ediyorsa çıkış yap
      if (isRemovingBg && removingBgIndex === index) return;

      // İşlemin başladığını belirt
      setIsRemovingBg(true);
      setRemovingBgIndex(index);

      // URL'i logla
      console.log(
        `Backend API ile arkaplan kaldırma için kullanılan URL: ${imageUrl}`
      );

      // Eğer removedBgImages henüz oluşturulmadıysa, 4 boş öğe içeren bir dizi oluştur
      if (!removedBgImages) {
        setRemovedBgImages(Array(4).fill(null));
      }

      // Mevcut arkaplanı kaldırılmış görüntüleri koru, sadece işlenen indeksi güncelle
      const updatedRemovedBgImages = removedBgImages
        ? [...removedBgImages]
        : Array(4).fill(null);

      // Sadece işlenen indeksi güncelle, diğer görüntülere dokunma
      updatedRemovedBgImages[index] = {
        id: index,
        url: "", // yükleniyor durumunda henüz URL yok
        loading: true,
        sourceImageUrl: imageUrl, // kaynak URL'i kaydediyoruz
      };

      // State'i güncelleyelim
      setRemovedBgImages(updatedRemovedBgImages);

      // API endpoint - Backend'imize istek gönderelim
      const apiBaseUrl =
        process.env.REACT_APP_API_URL || "http://localhost:3001";
      const apiUrl = `${apiBaseUrl}/api/remove-background`;

      // Backend API'ye istek gönder
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API yanıtı başarısız: ${response.status} - ${errorText}`
        );
      }

      // JSON yanıtını parse et
      const responseData = await response.json();
      console.log("Backend API yanıtı:", responseData);

      // Yanıt başarılıysa, arkaplanı kaldırılmış görüntü URL'sini al
      if (
        responseData.success &&
        (responseData.removedBgUrl || responseData.result?.removed_bg_url)
      ) {
        const removedBgUrl =
          responseData.removedBgUrl || responseData.result.removed_bg_url;

        // Mevcut arkaplanı kaldırılmış görüntüleri koru, sadece işlenen indeksi güncelle
        setRemovedBgImages((currentRemovedBgImages) => {
          const newRemovedBgImages = [
            ...(currentRemovedBgImages || Array(4).fill(null)),
          ];
          newRemovedBgImages[index] = {
            id: index,
            url: removedBgUrl,
            loading: false,
            sourceImageUrl: imageUrl, // Kaynak resim URL'sini koru
          };
          return newRemovedBgImages;
        });

        console.log(
          `Backend API ile arkaplan kaldırıldı. İndeks: ${index}, URL: ${removedBgUrl}`
        );
      } else {
        throw new Error(
          "API yanıtında arkaplanı kaldırılmış görüntü URL'si bulunamadı"
        );
      }
    } catch (error) {
      console.error("Backend API ile arkaplan kaldırma sırasında hata:", error);

      // Hata durumunda sadece ilgili görüntüyü hata durumuna güncelle, diğerlerine dokunma
      setRemovedBgImages((currentRemovedBgImages) => {
        if (!currentRemovedBgImages) return Array(4).fill(null);

        const newRemovedBgImages = [...currentRemovedBgImages];

        if (!newRemovedBgImages[index]) {
          newRemovedBgImages[index] = {
            id: index,
            error: true,
            loading: false,
            sourceImageUrl: imageUrl, // Hata durumunda da kaynak URL'yi koru
          };
        } else {
          newRemovedBgImages[index] = {
            ...newRemovedBgImages[index],
            error: true,
            loading: false,
            sourceImageUrl: imageUrl,
          };
        }

        return newRemovedBgImages;
      });

      alert(`Arkaplan kaldırılamadı: ${error.message}`);
    } finally {
      setIsRemovingBg(false);
      setRemovingBgIndex(null);
    }
  };

  return (
    <div className="App">
      <div className="container" style={{ display: "flex", gap: "20px" }}>
        <WidgetSourceAndPrompt
          onImageUpload={handleFileChange}
          previewUrl={imageUrl}
          handleFileChange={handleFileChange}
          prompt={prompt}
          handlePromptChange={handlePromptChange}
          isGenerating={isGenerating}
          isDisabled={isGenerating || !uploadedImage}
          handleGenerate={handleGenerate}
          openCropModal={() => setShowCropModal(true)}
          resetUpload={resetUpload}
          error={error}
          style={{ flex: "0 0 260px" }}
        />

        <WidgetResults
          resultImages={resultImages}
          onSelectResult={handleSelectResult}
          selectedIndex={selectedResultIndex}
          openCropModal={() => setShowCropModal(true)}
          onEditPrompt={handleEditPromptOpen}
          onEnhanceImage={handleEnhanceImage}
          onRemoveBackground={handleRemoveBackground}
          style={{ flex: "1.5" }}
          previewUrl={imageUrl}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "1",
            gap: "20px",
            alignItems: "stretch",
            alignSelf: "flex-start",
          }}
        >
          <WidgetEnhancedResults
            enhancedImages={enhancedImages}
            style={{ height: "fit-content" }}
            onCleanImage={handleCleanImage}
          />

          <WidgetBackgroundRemovedResults
            removedBgImages={removedBgImages}
            style={{ height: "fit-content" }}
          />
        </div>
      </div>

      {/* Kırpma Modalı */}
      <CropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        imageUrl={imageUrl}
        onCropComplete={handleCropComplete}
      />

      {/* Düzenleme Prompt Modalı */}
      <EditPromptModal
        isOpen={showEditPromptModal}
        onClose={() => setShowEditPromptModal(false)}
        onApply={handleEditPromptApply}
        initialPrompt={editPromptText}
      />

      {/* Debug API Yanıtı İnceleyici */}
      <ResponseInspector response={debugResponse} />
    </div>
  );
}

export default App;
