import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../constants/theme';
import { jsPDF } from 'jspdf';

// OCR.space API
const OCR_API_URL = 'https://api.ocr.space/parse/image';
const DEFAULT_API_KEY = 'K82740862688957';

interface ImageItem {
  id: string;
  uri: string;
  name: string;
  file: File | null;
  base64: string; // Store base64 for persistence
  extractedText: string;
  isProcessing: boolean;
  isProcessed: boolean;
}

const STORAGE_KEY = '@studyg_pdf_images';

const PDFConverterScreen = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load API key and saved images from localStorage on mount
  React.useEffect(() => {
    if (Platform.OS === 'web') {
      // Load API key
      const savedKey = localStorage.getItem('@studyg_ocr_api_key');
      if (savedKey) {
        setApiKey(savedKey);
      } else {
        setApiKey(DEFAULT_API_KEY);
      }

      // Load saved images
      const savedImages = localStorage.getItem(STORAGE_KEY);
      if (savedImages) {
        try {
          const parsed = JSON.parse(savedImages);
          // Restore images with base64 as uri (file will be null but we have base64)
          const restored = parsed.map((img: any) => ({
            ...img,
            uri: img.base64 || img.uri,
            file: null, // File can't be restored, but we have base64
            isProcessing: false,
          }));
          setImages(restored);
        } catch (e) {
          console.error('Error loading saved images:', e);
        }
      }
    } else {
      setApiKey(DEFAULT_API_KEY);
    }
  }, []);

  // Save images to localStorage whenever they change
  React.useEffect(() => {
    if (Platform.OS === 'web' && images.length > 0) {
      const toSave = images.map(img => ({
        id: img.id,
        name: img.name,
        base64: img.base64,
        extractedText: img.extractedText,
        isProcessed: img.isProcessed,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } else if (Platform.OS === 'web' && images.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [images]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (Platform.OS === 'web') {
      localStorage.setItem('@studyg_ocr_api_key', key);
    }
    setShowApiKeyInput(false);
  };

  const handleSelectImages = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const base64 = await fileToBase64(file);

      newImages.push({
        id: `${Date.now()}-${i}`,
        uri: base64,
        name: file.name,
        file: file,
        base64: base64, // Store base64 for persistence
        extractedText: '',
        isProcessing: false,
        isProcessed: false,
      });
    }

    setImages(prev => [...prev, ...newImages]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return new Blob([u8arr], { type: mime });
  };

  const processImage = async (imageId: string) => {
    if (!apiKey) {
      setShowApiKeyInput(true);
      alert('Lütfen önce OCR API anahtarınızı girin. Ücretsiz anahtar için: https://ocr.space/ocrapi');
      return;
    }

    setImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, isProcessing: true } : img
    ));

    const image = images.find(img => img.id === imageId);
    if (!image) return;

    // If no file but we have base64, create blob from base64
    if (!image.file && !image.base64) return;

    try {
      setProgress(`"${image.name}" işleniyor...`);

      // Create form data for OCR.space API
      const formData = new FormData();

      // Use file if available, otherwise create blob from base64
      if (image.file) {
        formData.append('file', image.file);
      } else if (image.base64) {
        const blob = base64ToBlob(image.base64);
        formData.append('file', blob, image.name);
      }

      formData.append('apikey', apiKey);
      formData.append('language', 'tur'); // Turkish
      formData.append('isOverlayRequired', 'false');
      formData.append('detectOrientation', 'true');
      formData.append('scale', 'true');
      formData.append('OCREngine', '2'); // Engine 2 is better for handwriting

      const response = await fetch(OCR_API_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage || 'OCR işlemi başarısız');
      }

      const extractedText = result.ParsedResults?.[0]?.ParsedText || '';

      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, extractedText: extractedText.trim(), isProcessing: false, isProcessed: true }
          : img
      ));
      setProgress('');
    } catch (error: any) {
      console.error('OCR error:', error);
      setImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, extractedText: `Hata: ${error.message || 'Metin okunamadı'}`, isProcessing: false, isProcessed: true }
          : img
      ));
      setProgress('');
    }
  };

  const processAllImages = async () => {
    const unprocessedImages = images.filter(img => !img.isProcessed && !img.isProcessing);

    for (const image of unprocessedImages) {
      await processImage(image.id);
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const generatePDF = async () => {
    const processedImages = images.filter(img => img.isProcessed && img.extractedText);

    if (processedImages.length === 0) {
      alert('Önce görselleri işleyin!');
      return;
    }

    setIsGeneratingPDF(true);
    setProgress('PDF oluşturuluyor...');

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;

      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Notlarım', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateStr = new Date().toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      doc.text(dateStr, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add divider line
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Process each image's text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      for (let i = 0; i < processedImages.length; i++) {
        const image = processedImages[i];

        // Add image header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);

        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        doc.text(`Görsel ${i + 1}: ${image.name}`, margin, yPosition);
        yPosition += 8;

        // Add extracted text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        const textLines = doc.splitTextToSize(image.extractedText, maxWidth);

        for (const line of textLines) {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 5;
        }

        yPosition += 10;

        // Add divider between images
        if (i < processedImages.length - 1) {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.setDrawColor(220, 220, 220);
          doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
          yPosition += 10;
        }
      }

      // Save PDF
      doc.save('notlarim.pdf');
      setProgress('PDF indirildi!');
      setTimeout(() => setProgress(''), 2000);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('PDF oluşturulurken hata oluştu');
      setProgress('');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Tüm görselleri kaldırmak istediğinize emin misiniz?')) {
      setImages([]);
    }
  };

  const allProcessed = images.length > 0 && images.every(img => img.isProcessed);
  const hasUnprocessed = images.some(img => !img.isProcessed && !img.isProcessing);
  const isAnyProcessing = images.some(img => img.isProcessing);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>PDF Dönüştürücü</Text>
            <TouchableOpacity
              style={styles.apiKeyButton}
              onPress={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              <Text style={styles.apiKeyButtonText}>
                {apiKey ? '🔑 ✓' : '🔑 Ayarla'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Görsellerden metin çıkarıp PDF oluşturun
          </Text>
        </View>

        {/* API Key Input */}
        {showApiKeyInput && (
          <View style={styles.apiKeyContainer}>
            <Text style={styles.apiKeyLabel}>OCR API Anahtarı</Text>
            <Text style={styles.apiKeyHelp}>
              Ücretsiz anahtar için: ocr.space/ocrapi
            </Text>
            <TextInput
              style={styles.apiKeyInput}
              placeholder="API anahtarınızı girin..."
              placeholderTextColor={colors.textSecondary}
              value={apiKey}
              onChangeText={setApiKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.apiKeySaveButton}
              onPress={() => saveApiKey(apiKey)}
            >
              <Text style={styles.apiKeySaveButtonText}>Kaydet</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hidden file input for web */}
        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        )}

        {/* Add Images Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleSelectImages}
        >
          <Text style={styles.addButtonIcon}>📷</Text>
          <Text style={styles.addButtonText}>Görsel Ekle</Text>
        </TouchableOpacity>

        {/* Progress indicator */}
        {progress !== '' && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.progressText}>{progress}</Text>
          </View>
        )}

        {/* Images List */}
        {images.length > 0 && (
          <View style={styles.imagesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Eklenen Görseller ({images.length})</Text>
              <TouchableOpacity onPress={clearAll}>
                <Text style={styles.clearAllText}>Tümünü Temizle</Text>
              </TouchableOpacity>
            </View>

            {images.map((image, index) => (
              <View key={image.id} style={styles.imageCard}>
                <Image source={{ uri: image.uri }} style={styles.thumbnail} />
                <View style={styles.imageInfo}>
                  <Text style={styles.imageName} numberOfLines={1}>
                    {index + 1}. {image.name}
                  </Text>
                  <View style={styles.imageStatus}>
                    {image.isProcessing ? (
                      <View style={styles.statusRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.processingText}>İşleniyor...</Text>
                      </View>
                    ) : image.isProcessed ? (
                      <Text style={styles.processedText}>
                        ✓ {image.extractedText.length} karakter
                      </Text>
                    ) : (
                      <TouchableOpacity
                        style={styles.processButton}
                        onPress={() => processImage(image.id)}
                      >
                        <Text style={styles.processButtonText}>Metni Çıkar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeImage(image.id)}
                >
                  <Text style={styles.removeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Process All Button - Show when multiple images and at least one unprocessed */}
            {images.length >= 1 && hasUnprocessed && !isAnyProcessing && (
              <TouchableOpacity
                style={styles.processAllButton}
                onPress={processAllImages}
              >
                <Text style={styles.processAllButtonIcon}>🔍</Text>
                <Text style={styles.processAllButtonText}>Tüm Metinleri Çıkar ({images.filter(img => !img.isProcessed).length} görsel)</Text>
              </TouchableOpacity>
            )}

            {/* Preview Section */}
            {images.some(img => img.isProcessed && img.extractedText) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewTitle}>Önizleme</Text>
                {images.filter(img => img.isProcessed && img.extractedText).map((image, index) => (
                  <View key={image.id} style={styles.previewCard}>
                    <Text style={styles.previewHeader}>Görsel {index + 1}</Text>
                    <Text style={styles.previewText} numberOfLines={5}>
                      {image.extractedText || 'Metin bulunamadı'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Generate PDF Button - Show when at least one image is processed */}
            {images.some(img => img.isProcessed && img.extractedText) && (
              <TouchableOpacity
                style={[styles.generateButton, isGeneratingPDF && styles.generateButtonDisabled]}
                onPress={generatePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.generateButtonIcon}>📄</Text>
                    <Text style={styles.generateButtonText}>PDF Oluştur ve İndir</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>Henüz görsel eklenmedi</Text>
            <Text style={styles.emptySubtitle}>
              Notlarınızın fotoğraflarını ekleyin, metinleri otomatik olarak çıkarıp PDF'e dönüştürelim
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  apiKeyButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  apiKeyButtonText: {
    fontSize: fontSize.sm,
    color: colors.text,
  },
  apiKeyContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  apiKeyLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  apiKeyHelp: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  apiKeyInput: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  apiKeySaveButton: {
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  apiKeySaveButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  addButtonIcon: {
    fontSize: 24,
  },
  addButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semiBold,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: borderRadius.md,
  },
  progressText: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  imagesSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },
  clearAllText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  imageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  imageInfo: {
    flex: 1,
  },
  imageName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  imageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  processingText: {
    color: colors.primary,
    fontSize: fontSize.sm,
  },
  processedText: {
    color: colors.success,
    fontSize: fontSize.sm,
  },
  processButton: {
    backgroundColor: colors.primaryLight + '30',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  processButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.round,
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: fontWeight.bold,
  },
  processAllButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  processAllButtonIcon: {
    fontSize: 20,
  },
  processAllButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  previewSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  previewTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
  },
  previewCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  previewHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semiBold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  previewText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonIcon: {
    fontSize: 24,
  },
  generateButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
});

export default PDFConverterScreen;
