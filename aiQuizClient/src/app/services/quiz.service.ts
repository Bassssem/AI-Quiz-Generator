import { Injectable } from '@angular/core';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private sampleQuiz: Quiz = {
    "qcm": [
      {
        "id": 1,
        "question": "Quel est l'objectif principal de l'application ?",
        "options": [
          "Uploader des documents",
          "Générer des questions pertinentes",
          "Analyser des images",
          "Envoyer des emails"
        ],
        "answer": "Générer des questions pertinentes"
      },
      {
        "id": 2,
        "question": "Quel type de fichier peut être uploadé par l'application ?",
        "options": [
          "DOCX",
          "PDF",
          "TXT",
          "JPEG"
        ],
        "answer": "PDF"
      },
      {
        "id": 3,
        "question": "Quel composant permet de lancer la génération de questions ?",
        "options": [
          "Un champ de texte",
          "Un bouton d'upload",
          "Un bouton d'exécution du modèle IA",
          "Un menu déroulant"
        ],
        "answer": "Un bouton d'exécution du modèle IA"
      },
      {
        "id": 4,
        "question": "Combien de formats de questions sont proposés dans l'interface ?",
        "options": [
          "Un",
          "Deux",
          "Trois",
          "Quatre"
        ],
        "answer": "Trois"
      },
      {
        "id": 5,
        "question": "Quel est l'avantage d'une interface utilisateur interactive ?",
        "options": [
          "Améliorer l'expérience utilisateur",
          "Réduire les coûts de développement",
          "Augmenter la taille des fichiers uploadés",
          "Simplifier l'algorithme IA"
        ],
        "answer": "Améliorer l'expérience utilisateur"
      }
    ],
    "oui_non": [
      {
        "id": 1,
        "question": "L'application permet-elle d'uploader un document PDF ?",
        "answer": "Oui"
      },
      {
        "id": 2,
        "question": "Le modèle IA est-il utilisé pour générer des questions à partir du document ?",
        "answer": "Oui"
      },
      {
        "id": 3,
        "question": "L'interface affiche-t-elle uniquement des questions QCM ?",
        "answer": "Non"
      },
      {
        "id": 4,
        "question": "Les questions générées sont-elles personnalisables par l'utilisateur ?",
        "answer": "Non"
      },
      {
        "id": 5,
        "question": "L'application prend-elle en charge plusieurs types de questions ?",
        "answer": "Oui"
      }
    ],
    "reponse_courte": [
      {
        "id": 1,
        "question": "Quel est le rôle du bouton d'upload ?",
        "answer": "Permettre l'upload d'un document PDF"
      },
      {
        "id": 2,
        "question": "Quel modèle est utilisé pour générer les questions ?",
        "answer": "Un modèle IA (NLP)"
      },
      {
        "id": 3,
        "question": "Quel type de question propose un format Oui/Non ?",
        "answer": "Une question qui ne nécessite qu'une réponse affirmative ou négative"
      },
      {
        "id": 4,
        "question": "Combien de formats de questions sont affichés dans l'interface ?",
        "answer": "Trois formats"
      },
      {
        "id": 5,
        "question": "Quel avantage offre l'utilisation d'un modèle NLP dans cette application ?",
        "answer": "Générer automatiquement des questions pertinentes à partir d'un document"
      }
    ]
  };

  getQuizData(): Quiz {
    return this.sampleQuiz;
  }
} 