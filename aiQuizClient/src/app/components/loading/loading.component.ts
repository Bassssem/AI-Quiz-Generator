import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  @Input() message: string = "Analyse du PDF en cours...";
  @Input() progress: number = 0;

  loadingMessages = [
    "Extraction du contenu...",
    "Analyse du texte...",
    "Génération des questions...",
    "Création du quiz...",
    "Finalisation..."
  ];

  getCurrentMessage(): string {
    const index = Math.floor((this.progress / 100) * this.loadingMessages.length);
    return this.loadingMessages[Math.min(index, this.loadingMessages.length - 1)];
  }
} 