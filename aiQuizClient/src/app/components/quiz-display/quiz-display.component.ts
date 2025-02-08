import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Quiz } from '../../interfaces/quiz.interface';
import { CommunicationService } from '../../services/communication.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-quiz-display',
  templateUrl: './quiz-display.component.html',
  styleUrl: './quiz-display.component.css',
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'quiz-display'
  }
})
export class QuizDisplayComponent implements OnInit, OnDestroy {
  quizData!: Quiz;
  private subscription: Subscription | null = null;
  shortAnswerResults: any[] = [];

  
  activeTab: 'qcm' | 'oui_non' | 'reponse_courte' = 'qcm';
  userAnswers: Map<string, string> = new Map();
  showAnswers: boolean = false;
  score: number = 0;
  currentQuestionIndex: number = 0;
  totalQuestions: number = 0;
  showQuestion: boolean = true;
  dynamicStyles: SafeHtml | null = null;
  currentStyles: { [key: string]: string } = {};
  styles = '';
  safeStyles: SafeHtml = '';

  constructor(
    private router: Router,
    private communicationService: CommunicationService,
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    console.log('QuizDisplay: Initializing...');
    this.subscription = this.communicationService.currentQuiz.subscribe(async quiz => {
      if (quiz) {
        this.quizData = quiz;
        this.totalQuestions = quiz.qcm.length + quiz.oui_non.length + quiz.reponse_courte.length;
        this.initializeUserAnswers();
        
        try {
          const styles = await this.apiService.getQuizStyles(this.quizData);
          const enhancedStyles = `
            body {
              background: linear-gradient(135deg, #0B1120, #1A1B4B);
              min-height: 100vh;
              margin: 0;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }

            .quiz-container {
              max-width: 800px;
              margin: 2rem auto;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(10px);
              border-radius: 20px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .quiz-header {
              text-align: center;
              margin-bottom: 2rem;
            }

            .quiz-header h2 {
              color: #EDF2F7;
              font-size: 2rem;
              margin-bottom: 1.5rem;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }

            .tabs {
              display: flex;
              justify-content: center;
              gap: 1rem;
              margin-bottom: 2rem;
            }

            .tabs button {
              padding: 0.8rem 1.5rem;
              border: none;
              border-radius: 10px;
              background: rgba(66, 153, 225, 0.1);
              color: #A0AEC0;
              cursor: pointer;
              transition: all 0.3s ease;
              font-size: 1rem;
              font-weight: 500;
            }

            .tabs button.active {
              background: linear-gradient(135deg, #4299E1, #805AD5);
              color: white;
              box-shadow: 0 4px 15px rgba(66, 153, 225, 0.3);
            }

            .question-card {
              background: rgba(255, 255, 255, 0.07);
              border-radius: 15px;
              padding: 2rem;
              margin-bottom: 1.5rem;
              border: 1px solid rgba(255, 255, 255, 0.1);
              transition: transform 0.3s ease;
            }

            .question-card:hover {
              transform: translateY(-5px);
            }

            .question-text {
              color: #EDF2F7;
              font-size: 1.2rem;
              margin-bottom: 1.5rem;
              line-height: 1.6;
            }

            .options {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }

            .option label {
              display: flex;
              align-items: center;
              padding: 1rem 1.5rem;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
              cursor: pointer;
              transition: all 0.3s ease;
              color: #E2E8F0;
            }

            .option label:hover {
              background: rgba(66, 153, 225, 0.1);
              transform: translateX(5px);
            }

            .progress-bar {
              height: 6px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 3px;
              overflow: hidden;
              margin: 2rem 0;
            }

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #4299E1, #805AD5);
              transition: width 0.3s ease;
            }

            ${styles}
          `;

          const styleElement = document.createElement('style');
          styleElement.id = 'quiz-styles';
          styleElement.textContent = enhancedStyles;
          
          const oldStyle = document.getElementById('quiz-styles');
          if (oldStyle) oldStyle.remove();
          document.head.appendChild(styleElement);
        } catch (error) {
          console.error('Erreur lors du chargement des styles:', error);
        }
      } else {
        this.router.navigate(['/upload']);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    const styleSheet = document.getElementById('quiz-dynamic-styles');
    if (styleSheet) {
      styleSheet.remove();
    }
  }

  initializeUserAnswers() {
    console.log('Initializing user answers with quiz:', this.quizData);
    if (this.quizData && this.quizData.qcm) {
      this.quizData.qcm.forEach(q => this.userAnswers.set(`qcm_${q.id}`, ''));
      this.quizData.oui_non.forEach(q => this.userAnswers.set(`oui_non_${q.id}`, ''));
      this.quizData.reponse_courte.forEach(q => this.userAnswers.set(`reponse_courte_${q.id}`, ''));
    }
  }

  setAnswer(questionType: string, questionId: number, answer: string) {
    this.userAnswers.set(`${questionType}_${questionId}`, answer);
  }

  async submitQuiz() {
    let correctAnswers = 0;
    let totalQuestions = 0;
  
    // Vérifier les QCM
    this.quizData.qcm.forEach(q => {
      totalQuestions++;
      if (this.userAnswers.get(`qcm_${q.id}`) === q.answer) {
        correctAnswers++;
      }
    });
  
    // Vérifier les questions Oui/Non
    this.quizData.oui_non.forEach(q => {
      totalQuestions++;
      if (this.userAnswers.get(`oui_non_${q.id}`) === q.answer) {
        correctAnswers++;
      }
    });
  
    // Préparer les questions de réponse courte pour l'API
    const shortAnswerQuestions = this.quizData.reponse_courte.map(q => ({
      question: q.question,
      userAnswer: this.userAnswers.get(`reponse_courte_${q.id}`) || '',
      correctAnswer: q.answer
    }));
  
    try {
      // Envoyer les questions à l'API pour vérification
      const apiResponse = await this.apiService.verifyShortAnswers(shortAnswerQuestions);
      console.log('API Response:', apiResponse);
  
      let parsedResults: any[] = [];
  
      // Vérifier la structure de la réponse
      if (apiResponse.results) {
        parsedResults = apiResponse.results;
      } else if (typeof apiResponse === 'string') {
        // Nettoyer la réponse pour retirer les balises markdown et convertir en JSON
        const cleaned = apiResponse.replace(/```json\n|\n```/g, '');
        parsedResults = JSON.parse(cleaned);
      } else if (Array.isArray(apiResponse)) {
        parsedResults = apiResponse;
      } else {
        throw new Error("Format de réponse inattendu");
      }
  
      // Utiliser les résultats de l'API pour la vérification des réponses courtes
      parsedResults.forEach(result => {
        totalQuestions++;
        if (result.isCorrect) {
          correctAnswers++;
        }
      });
  
      this.score = (correctAnswers / totalQuestions) * 100;
      this.showAnswers = true;
    } catch (error) {
      console.error('Erreur lors de la vérification des réponses:', error);
      // En cas d'erreur, vérifier localement les réponses courtes
      this.quizData.reponse_courte.forEach(q => {
        totalQuestions++;
        if (
          this.userAnswers
            .get(`reponse_courte_${q.id}`)
            ?.toLowerCase()
            .trim() === q.answer.toLowerCase().trim()
        ) {
          correctAnswers++;
        }
      });
      this.score = (correctAnswers / totalQuestions) * 100;
      this.showAnswers = true;
    }
  }
  
  

  resetQuiz() {
    this.initializeUserAnswers();
    this.showAnswers = false;
    this.score = 0;
  }

  isCorrect(questionType: string, questionId: number): boolean {
    if (!this.showAnswers) return false;
    
    const userAnswer = this.userAnswers.get(`${questionType}_${questionId}`);
    let correctAnswer = '';
    
    switch (questionType) {
      case 'qcm':
        correctAnswer = this.quizData.qcm.find(q => q.id === questionId)?.answer || '';
        break;
      case 'oui_non':
        correctAnswer = this.quizData.oui_non.find(q => q.id === questionId)?.answer || '';
        break;
      case 'reponse_courte':
        correctAnswer = this.quizData.reponse_courte.find(q => q.id === questionId)?.answer || '';
        break;
    }
    
    return userAnswer?.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
  }

  handleInput(event: Event, questionId: number) {
    const input = event.target as HTMLInputElement;
    this.setAnswer('reponse_courte', questionId, input.value);
  }

  nextQuestion() {
    this.showQuestion = false;
    setTimeout(() => {
      const currentTypeQuestions = this.quizData[this.activeTab];
      const currentIndex = this.currentQuestionIndex % currentTypeQuestions.length;
      
      if (currentIndex === currentTypeQuestions.length - 1) {
        // Si on est à la dernière question du type actuel, passer au type suivant
        switch (this.activeTab) {
          case 'qcm':
            this.activeTab = 'oui_non';
            this.currentQuestionIndex = 0;
            break;
          case 'oui_non':
            this.activeTab = 'reponse_courte';
            this.currentQuestionIndex = 0;
            break;
          case 'reponse_courte':
            // On est à la fin de toutes les questions
            break;
        }
      } else {
        this.currentQuestionIndex++;
      }
      this.showQuestion = true;
    }, 500);
  }

  previousQuestion() {
    this.showQuestion = false;
    setTimeout(() => {
      const currentTypeQuestions = this.quizData[this.activeTab];
      const currentIndex = this.currentQuestionIndex % currentTypeQuestions.length;
      
      if (currentIndex === 0) {
        // Si on est à la première question du type actuel, revenir au type précédent
        switch (this.activeTab) {
          case 'reponse_courte':
            this.activeTab = 'oui_non';
            this.currentQuestionIndex = this.quizData.oui_non.length - 1;
            break;
          case 'oui_non':
            this.activeTab = 'qcm';
            this.currentQuestionIndex = this.quizData.qcm.length - 1;
            break;
          case 'qcm':
            // On est au début de toutes les questions
            break;
        }
      } else {
        this.currentQuestionIndex--;
      }
      this.showQuestion = true;
    }, 500);
  }

  getCurrentQuestion() {
    const type = this.activeTab;
    const questions = this.quizData[type];
    const question = questions[this.currentQuestionIndex % questions.length];
    return question as any;
  }

  get progress() {
    return ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
  }

  get allQuestionsAnswered(): boolean {
    if (!this.quizData) return false;
    
    // Vérifier les QCM
    const qcmAnswered = this.quizData.qcm.every(q => 
      this.userAnswers.get(`qcm_${q.id}`) !== '');
    
    // Vérifier les questions Oui/Non
    const ouiNonAnswered = this.quizData.oui_non.every(q => 
      this.userAnswers.get(`oui_non_${q.id}`) !== '');
    
    // Vérifier les réponses courtes
    const reponseCourteAnswered = this.quizData.reponse_courte.every(q => 
      this.userAnswers.get(`reponse_courte_${q.id}`) !== '');
    
    return qcmAnswered && ouiNonAnswered && reponseCourteAnswered;
  }

  get answeredQuestionsCount(): number {
    if (!this.quizData) return 0;
    
    return Array.from(this.userAnswers.values()).filter(answer => answer !== '').length;
  }

  get remainingQuestions(): number {
    return this.totalQuestions - this.answeredQuestionsCount;
  }

  async loadStyles() {
    const styles = await this.apiService.getQuizStyles(this.quizData);
    if (styles) {
      const styleElement = document.createElement('style');
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
  }

  // Méthode pour convertir le CSS en objet de style
  private cssToObject(css: string): { [key: string]: string } {
    const styleObject: { [key: string]: string } = {};
    
    // Extraire les propriétés CSS
    const properties = css.match(/[^{}]+(?=})/g);
    if (properties) {
      properties.forEach(property => {
        const pairs = property.split(';');
        pairs.forEach(pair => {
          const [key, value] = pair.split(':').map(item => item?.trim());
          if (key && value) {
            // Convertir kebab-case en camelCase pour le style binding
            const camelKey = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
            styleObject[camelKey] = value;
          }
        });
      });
    }
    
    return styleObject;
  }
} 