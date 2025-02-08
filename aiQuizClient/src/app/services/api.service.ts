import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Quiz } from '../interfaces/quiz.interface';

interface VerificationQuestion {
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) { }

  async extractPdfText(file: File): Promise<Quiz> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.http.post<any>(this.apiUrl+"/extract-pdf", formData).toPromise();
      // Parser la chaîne JSON de la réponse
      const quizData = JSON.parse(response.response.replace(/```json\n|\n```/g, ''));
      return quizData as Quiz;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du PDF:', error);
      throw new Error('Erreur lors de l\'envoi du PDF à l\'API');
    }
  }

  async verifyShortAnswers(questions: VerificationQuestion[]): Promise<any> {
    console.log(questions)
    return this.http.post(`${this.apiUrl}/verifyQuestionOfCourteReponse`, questions).toPromise();
  }

  async getQuizStyles(quizData: any): Promise<string> {
    try {
      const response = await this.http.post(this.apiUrl+'/quiz-styles', quizData, { responseType: 'text' }).toPromise();
      
      // Nettoyer la réponse de toutes les balises markdown
      return response?.replace(/```css\n|\n```/g, '').trim() || '';
    } catch (error) {
      console.error('Erreur lors de la récupération des styles:', error);
      return '';
    }
  }
} 