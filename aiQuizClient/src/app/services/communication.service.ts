import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Quiz } from '../interfaces/quiz.interface';

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {
  private quizSource = new BehaviorSubject<Quiz | null>(null);
  currentQuiz = this.quizSource.asObservable();

  constructor() { }

  updateQuiz(quiz: Quiz) {
    console.log('Updating quiz in service:', quiz);
    this.quizSource.next(quiz);
  }
} 