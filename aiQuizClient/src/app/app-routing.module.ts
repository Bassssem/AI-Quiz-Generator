import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PdfUploadComponent } from './components/pdf-upload/pdf-upload.component';
import { QuizDisplayComponent } from './components/quiz-display/quiz-display.component';

const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: PdfUploadComponent },
  { path: 'quiz', component: QuizDisplayComponent },
  { path: '**', redirectTo: '/upload' } // Route par défaut si l'URL n'existe pas
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
