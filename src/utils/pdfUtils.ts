import { jsPDF } from 'jspdf';

export const createPDFFromImage = async (
  imageUri: string,
  courseName: string,
  noteTitle: string
): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Calculate image dimensions to fit page
      const imgWidth = pageWidth - 20; // 10mm margin on each side
      const imgHeight = (img.height * imgWidth) / img.width;

      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add title
      pdf.setFontSize(16);
      pdf.setTextColor(212, 175, 55); // Gold color
      pdf.text(`${courseName} - ${noteTitle}`, pageWidth / 2, position, { align: 'center' });
      position += 10;

      // Add image
      pdf.addImage(img, 'JPEG', 10, position, imgWidth, Math.min(imgHeight, pageHeight - position - 10));
      heightLeft -= (pageHeight - position - 10);

      // Add more pages if image is tall
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(img, 'JPEG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Convert to blob
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUri;
  });
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const viewPDF = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};
