import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

@Injectable({
  providedIn: 'root'
})
export class PdfExtractorService {
  constructor() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.js';
  }

  async extractText(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += `Page ${i}:\n${pageText}\n\n`;
      }

      return fullText;
    } catch (error) {
      console.error('Erreur lors de l\'extraction du texte:', error);
      throw new Error('Impossible d\'extraire le texte du PDF');
    }
  }
} 