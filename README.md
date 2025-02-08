# AI Quiz Generator

Application web permettant de générer automatiquement des questions à partir d'un document PDF en utilisant l'intelligence artificielle. Les questions sont générées sous différents formats (QCM, Oui/Non, Réponse courte) et affichées dans une interface utilisateur interactive.

## Architecture du Projet

Le projet est divisé en deux parties principales :

### Frontend (aiQuizClient)
- Framework: Angular 18
- Fonctionnalités:
  - Upload de fichiers PDF
  - Affichage interactif des questions générées
  - Interface utilisateur moderne et responsive
  - Gestion des différents types de questions
  - Système de notation en temps réel
  - Adaptation dynamique du style selon le contexte

### Backend (aiQuizServer)
- Framework: FastAPI (Python)
- Fonctionnalités:
  - Extraction de texte depuis PDF
  - Génération de questions via IA (Gemini API)
  - API RESTful
  - Traitement asynchrone des requêtes
  - Analyse contextuelle pour adaptation du style

## Prérequis

### Pour le Frontend (aiQuizClient)
- Node.js (v14+)
- npm ou yarn
- Angular CLI (`npm install -g @angular/cli`)

### Pour le Backend (aiQuizServer)
- Python 3.8+
- pip (gestionnaire de paquets Python)
- Clé API Google (pour Gemini)

## Installation

### Frontend (aiQuizClient)

```bash
cd aiQuizClient
npm install
ng serve
```

L'application sera accessible à l'adresse `http://localhost:4200`

### Backend (aiQuizServer)

```bash
cd aiQuizServer
pip install -r requirements.txt
uvicorn main:app --reload
```

Le serveur sera accessible à l'adresse `http://localhost:8000`

## Configuration

### Variables d'environnement Backend
Créez un fichier `.env` dans le dossier aiQuizServer avec :
```env
GOOGLE_API_KEY=votre_clé_api_google
```

## Fonctionnalités Détaillées

### Génération de Questions
- Analyse automatique du contenu PDF
- Génération de questions pertinentes via IA
- Support de multiples formats de questions:
  - QCM (Questions à Choix Multiples)
  - Questions Vrai/Faux
  - Questions à réponse courte

### Interface Utilisateur
- Design moderne et intuitif
- Animations fluides
- Responsive design (mobile-friendly)
- Feedback visuel en temps réel
- Indicateur de progression

### Traitement des PDFs
- Support des PDFs multipage
- Extraction intelligente du texte
- Préservation de la structure du document
- Gestion des erreurs

## Structure du Projet

```
project/
├── aiQuizClient/          # Frontend Angular
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── interfaces/
│   │   └── assets/
│   └── ...
│
└── aiQuizServer/         # Backend FastAPI
    ├── main.py
    ├── requirements.txt
    └── ...
```

## API Documentation

La documentation de l'API est disponible aux endpoints suivants :
- Swagger UI: `http://localhost:8000/extract-pdf`
- Swagger UI: `http://localhost:8000/verifyQuestionOfCourteReponse`
- Swagger UI: `http://localhost:8000/quiz-styles`
