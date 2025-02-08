import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PdfUploadComponent } from './components/pdf-upload/pdf-upload.component';
import { LoadingComponent } from './components/loading/loading.component';
import { QuizDisplayComponent } from './components/quiz-display/quiz-display.component';
import { QuizService } from './services/quiz.service';
import { PdfExtractorService } from './services/pdf-extractor.service';
import { CommunicationService } from './services/communication.service';

@NgModule({
  declarations: [
    AppComponent,
    PdfUploadComponent,
    LoadingComponent,
    QuizDisplayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    QuizService, 
    PdfExtractorService,
    CommunicationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
