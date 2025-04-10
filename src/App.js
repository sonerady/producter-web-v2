import React, { useState, useEffect } from "react";
import "./App.css";
import "react-image-crop/dist/ReactCrop.css";
import Navbar from "./components/Navbar";
import WidgetSourceAndPrompt from "./components/widgets/WidgetSourceAndPrompt";
import WidgetResults from "./components/widgets/WidgetResults";
import WidgetEnhancedResults from "./components/widgets/WidgetEnhancedResults";
import WidgetBackgroundRemovedResults from "./components/widgets/WidgetBackgroundRemovedResults";
import CropModal from "./components/modals/CropModal";
import EditPromptModal from "./components/modals/EditPromptModal";

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

  // Checkbox options for image processing
  const [hasShadow, setHasShadow] = useState(true);
  const [hasReflection, setHasReflection] = useState(true);
  const [keepPose, setKeepPose] = useState(false);

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
      
      /* Checkbox options styling */
      .option-checkbox {
        position: relative;
        overflow: hidden;
      }
      
      .option-checkbox input[type="checkbox"] {
        cursor: pointer;
      }
      
      .option-checkbox:hover {
        background-color: #f9f9f9;
      }
      
      .option-checkbox input[type="checkbox"]:checked + span {
        color: #0066cc;
      }
      
      @keyframes checkboxPulse {
        0% { box-shadow: 0 0 0 0 rgba(173, 216, 230, 0.7); }
        70% { box-shadow: 0 0 0 6px rgba(173, 216, 230, 0); }
        100% { box-shadow: 0 0 0 0 rgba(173, 216, 230, 0); }
      }
      
      .option-checkbox input[type="checkbox"]:checked {
        animation: checkboxPulse 0.5s;
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

  // Handlers for image processing option checkboxes
  const handleShadowChange = (e) => {
    setHasShadow(e.target.checked);
  };

  const handleReflectionChange = (e) => {
    setHasReflection(e.target.checked);
  };

  const handleKeepPoseChange = (e) => {
    setKeepPose(e.target.checked);
  };

  const handleCropComplete = (croppedFile) => {
    // Orijinal dosya adını koruyalım ve uploadedImage'e aktaralım
    if (uploadedImage && uploadedImage.name) {
      // Orijinal dosya adını ve tipini al, uzantıyı koru
      const extension = croppedFile.name.split(".").pop();
      const originalName = uploadedImage.name.split(".")[0];

      // Aynı içerikli ama orijinal isimli bir dosya oluştur
      const renamedFile = new File(
        [croppedFile],
        `${originalName}.${extension}`,
        {
          type: croppedFile.type,
        }
      );

      // Kırpılmış görüntüyü ana görüntü olarak ayarla
      setUploadedImage(renamedFile);
    } else {
      // Orijinal dosya adı yoksa doğrudan kullan
      setUploadedImage(croppedFile);
    }

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

        // Yüklenen resmin orijinal dosya adını kullan
        const fileName = uploadedImage ? uploadedImage.name : "image.jpg";

        const file = new File([blob], fileName, {
          type: "image/jpeg",
        });

        console.log(
          "Debug - Görüntü boyutu:",
          Math.round(blob.size / 1024),
          "KB"
        );

        // Add checkbox options to the prompt
        const basePrompt = prompt.trim();
        const optionsText = [
          hasShadow ? "gölgeli" : "",
          hasReflection ? "yansımalı" : "",
          keepPose ? "pozu korunmuş" : "",
        ]
          .filter(Boolean)
          .join(", ");

        const enhancedPrompt = basePrompt
          ? optionsText
            ? `${basePrompt} - ${optionsText}`
            : basePrompt
          : optionsText
          ? optionsText
          : "";

        // 4 farklı rötuşlama varyasyonu için açıklamalar
        const promptVariations = [
          enhancedPrompt ||
            "Profesyonel ürün fotoğrafı, beyaz arka plan, doğal yumuşak gölgeler",
          enhancedPrompt
            ? `${enhancedPrompt} - Altın/metal vurgusu ile parlaklık artırılmış`
            : `Altın/metal vurgusu, parlaklık artırılmış profesyonel ürün fotoğrafı${
                optionsText ? `, ${optionsText}` : ""
              }`,
          enhancedPrompt
            ? `${enhancedPrompt} - Dramatik kontrastlı çekim`
            : `Dramatik kontrastlı profesyonel ürün fotoğrafı, derinlikli gölgeler${
                optionsText ? `, ${optionsText}` : ""
              }`,
          enhancedPrompt
            ? `${enhancedPrompt} - Maksimum parlaklık ve detay`
            : `Maksimum parlaklık ve detay ile profesyonel ürün fotoğrafı${
                optionsText ? `, ${optionsText}` : ""
              }`,
        ];

        // API endpoint
        const apiBaseUrl =
          process.env.REACT_APP_API_URL || "https://dires-server.onrender.com";
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
            formData.append("hasShadow", String(hasShadow));
            formData.append("hasReflection", String(hasReflection));
            formData.append("keepPose", String(keepPose));

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
      setIsEnhancing(true);
      setEnhancingIndex(index);

      setEnhancedImages((prev) => {
        const newImages = prev || Array(4).fill(null);
        newImages[index] = {
          id: index,
          url: "",
          loading: true,
          sourceImageUrl: imageUrl,
        };
        return newImages;
      });

      const apiBaseUrl =
        process.env.REACT_APP_API_URL || "https://dires-server.onrender.com";
      const response = await fetch(`${apiBaseUrl}/api/image-clarity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          mode: "flux",
          creativity: 2,
          prompt: "Enhance this product image with higher clarity and details.",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.upscaledImageUrl) {
        throw new Error("No enhanced image URL in response");
      }

      setEnhancedImages((prev) => {
        const newImages = [...(prev || Array(4).fill(null))];
        newImages[index] = {
          id: index,
          url: data.upscaledImageUrl,
          loading: false,
          sourceImageUrl: imageUrl,
        };
        return newImages;
      });
    } catch (error) {
      console.error("Enhancement error:", error);

      setEnhancedImages((prev) => {
        const newImages = [...(prev || Array(4).fill(null))];
        newImages[index] = {
          id: index,
          error: true,
          loading: false,
          sourceImageUrl: imageUrl,
        };
        return newImages;
      });

      alert("Görüntü netleştirilemedi. Lütfen daha sonra tekrar deneyin.");
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
        process.env.REACT_APP_API_URL || "https://dires-server.onrender.com";
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
        process.env.REACT_APP_API_URL || "https://dires-server.onrender.com";
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
      <Navbar />
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
          hasShadow={hasShadow}
          hasReflection={hasReflection}
          keepPose={keepPose}
          onShadowChange={handleShadowChange}
          onReflectionChange={handleReflectionChange}
          onKeepPoseChange={handleKeepPoseChange}
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
          uploadedImage={uploadedImage}
          isGenerating={isGenerating}
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
            uploadedImage={uploadedImage}
          />

          <WidgetBackgroundRemovedResults
            removedBgImages={removedBgImages}
            style={{ height: "fit-content" }}
            uploadedImage={uploadedImage}
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
        imageUrl={
          resultImages && resultImages[editPromptIndex]
            ? resultImages[editPromptIndex].url
            : ""
        }
      />

      {/* Debug API Yanıtı İnceleyici */}
      <ResponseInspector response={debugResponse} />
    </div>
  );
}

export default App;
