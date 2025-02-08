import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CommunicationService } from '../../services/communication.service';
import { Quiz } from '../../interfaces/quiz.interface';

@Component({
  selector: 'app-pdf-upload',
  templateUrl: './pdf-upload.component.html',
  styleUrl: './pdf-upload.component.css'
})
export class PdfUploadComponent {
  selectedFile: File | null = null;
  isLoading: boolean = false;
  progress: number = 0;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private communicationService: CommunicationService
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
    } else {
      alert('Veuillez sélectionner un fichier PDF valide');
    }
  }

  async onUpload() {
    if (this.selectedFile) {
      this.isLoading = true;
      try {
        const quiz = await this.apiService.extractPdfText(this.selectedFile);
        console.log('Quiz généré:', quiz);
        
        // Vérifier que le quiz est bien formaté
        if (quiz && quiz.qcm && quiz.oui_non && quiz.reponse_courte) {
          this.communicationService.updateQuiz(quiz);
          this.simulateProgress();
        } else {
          throw new Error('Format de quiz invalide');
        }
      } catch (error) {
        console.error('Erreur lors de l\'extraction du texte:', error);
        alert('Erreur lors de l\'extraction du texte du PDF');
        this.isLoading = false;
      }
    }
  }

  private simulateProgress() {
    this.progress = 0;
    const interval = setInterval(() => {
      this.progress += 2;
      if (this.progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          this.isLoading = false;
          this.progress = 0;
          this.router.navigate(['/quiz']);
        }, 1000);
      }
    }, 100);
  }
} 