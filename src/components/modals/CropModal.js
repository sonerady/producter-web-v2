import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  RiCloseLine,
  RiZoomInLine,
  RiZoomOutLine,
  RiRefreshLine,
  RiCheckLine,
} from "@remixicon/react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

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

            // Orijinal dosyadan extension'ı çıkartan fonksiyon
            const getOriginalFileName = () => {
              // imageUrl'den dosya adını çıkar (blob URL veya data URL olabilir)
              if (
                imageUrl.startsWith("blob:") ||
                imageUrl.startsWith("data:")
              ) {
                // Bu durumda orijinal dosya adına erişemiyoruz, "cropped-image" kullan
                return "cropped-image.jpg";
              }

              // URL path'inden dosya adını çıkar
              const urlParts = imageUrl.split("/");
              const fileName = urlParts[urlParts.length - 1];

              // Query parametrelerini temizle
              return fileName.split("?")[0] || "cropped-image.jpg";
            };

            const file = new File([blob], getOriginalFileName(), {
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
              className="apply-button"
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

export default CropModal;
