from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import PyPDF2
import io
import os
import tempfile
import time
from google import genai
from pydantic import BaseModel
from typing import List

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GOOGLE_API_KEY="AIzaSyCkYvYfnTW0WvplFy4jEqaZGq6wS0Dhnck"
client = genai.Client(api_key=GOOGLE_API_KEY)
MODEL_ID = "gemini-2.0-flash"

def call_generate_content_with_retry(client, model_id, contents, retries=5, delay=2):
    current_delay = delay
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=model_id,
                contents=contents
            )
            return response
        except Exception as e:
            error_message = str(e)
            if "503" in error_message:
                print(f"Tentative {attempt + 1} sur {retries} échouée avec erreur 503. Réessai dans {current_delay} secondes...")
                time.sleep(current_delay)
                current_delay *= 2 
            else:
                raise e
    raise Exception("Le service est toujours indisponible après plusieurs tentatives.")

@app.post("/extract-pdf")
async def extract_pdf_text(file: UploadFile = File(...)):
    # Vérifier que le fichier est un PDF
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Le fichier doit être un PDF")
    
    try:
        contents = await file.read()

        pdf_file = io.BytesIO(contents)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        if not text.strip():
            raise HTTPException(status_code=400, detail="Impossible d'extraire le texte du PDF.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(contents)
            tmp_file_path = tmp_file.name

        file_upload = client.files.upload(file=tmp_file_path)

        os.unlink(tmp_file_path)

        prompt_template = """ Tu es un expert en analyse de documents et en création de quiz pédagogiques. On te fournit ci-dessous le texte extrait d'un document PDF. Ta mission est d'analyser ce texte et d'en déduire un quiz structuré en trois sections distinctes : QCM (questions à choix multiples), Oui/Non et Réponse courte. **IMPORTANT** : Assure-toi que l'ensemble du quiz (questions et réponses) soit rédigé dans la même langue que le contenu du PDF. Pour chaque section, génère exactement 5 questions. La réponse doit être uniquement un objet JSON respectant exactement le format suivant (sans explications supplémentaires ni commentaires) : { "qcm": [
            { "id": 1, "question": "Texte de la question QCM",
              "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
              ],
              "answer": "La bonne réponse"
            },
            {
              "id": 2,
              "question": "Texte de la question QCM",
              "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
              ],
              "answer": "La bonne réponse"
            },
            {
              "id": 3,
              "question": "Texte de la question QCM",
              "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
              ],
              "answer": "La bonne réponse"
            },
            {
              "id": 4,
              "question": "Texte de la question QCM",
              "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
              ],
              "answer": "La bonne réponse"
            },
            {
              "id": 5,
              "question": "Texte de la question QCM",
              "options": [
                "Option 1",
                "Option 2",
                "Option 3",
                "Option 4"
              ],
              "answer": "La bonne réponse"
            }
          ],
          "oui_non": [
            {
              "id": 1,
              "question": "Texte de la question Oui/Non",
              "answer": "Oui"
            },
            {
              "id": 2,
              "question": "Texte de la question Oui/Non", 
              "answer": "Oui"
            },
            {
              "id": 3,
              "question": "Texte de la question Oui/Non",
              "answer": "Oui"
            },
            {
              "id": 4,
              "question": "Texte de la question Oui/Non",
              "answer": "Oui"
            },
            {
              "id": 5,
              "question": "Texte de la question Oui/Non",
              "answer": "Oui"
            }
          ],
          "reponse_courte": [
            {
              "id": 1,
              "question": "Texte de la question Réponse courte",
              "answer": "Réponse concise"
            },
            {
              "id": 2,
              "question": "Texte de la question Réponse courte",
              "answer": "Réponse concise"
            },
            {
              "id": 3,
              "question": "Texte de la question Réponse courte",
              "answer": "Réponse concise"
            },
            {
              "id": 4,
              "question": "Texte de la question Réponse courte",
              "answer": "Réponse concise"
            },
            {
              "id": 5,
              "question": "Texte de la question Réponse courte",
              "answer": "Réponse concise"
            }
          ]
        }

Voici le texte extrait du PDF :
\"\"\"{text}\"\"\"
"""

        prompt = prompt_template.replace("{text}", text)

        response = call_generate_content_with_retry(
            client, MODEL_ID, [file_upload, prompt]
        )
        
        print(response.text)
        return {
            "message": "Texte extrait et analysé avec succès",
            "response": response.text if hasattr(response, 'text') else "Pas de réponse générée"
        }
    
    except Exception as e:
        print(f"Erreur détaillée: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Une erreur s'est produite: {str(e)}")




class QuestionItem(BaseModel):
    question: str
    userAnswer: str
    correctAnswer: str

@app.post("/verifyQuestionOfCourteReponse")
async def verify_question_of_courte_reponse(questions: List[QuestionItem]):
    try:
        for idx, item in enumerate(questions):
            print(f"Question {idx+1}: {item.question}")
            print(f"Réponse de l'utilisateur: {item.userAnswer}")
            print(f"Réponse correcte: {item.correctAnswer}")
            print("-----")

        questions_data = ""
        for idx, item in enumerate(questions):
            questions_data += f"\nQuestion {idx+1}: {item.question}\n"
            questions_data += f"Réponse de l'utilisateur: {item.userAnswer}\n"
            questions_data += f"Réponse correcte: {item.correctAnswer}\n"
            questions_data += "-----\n"
        
        prompt = """You are an assistant tasked with comparing a user's answers to the correct answers for a series of questions. For each question, determine whether the user's answer is correct by considering not only an exact match but also the context and logic behind the answer. In other words, even if the user's answer is not textually identical to the correct answer, it should be judged as correct if it is contextually appropriate and logically consistent.

Then, generate a JSON object containing an array of items where each item includes the following keys:

- "question": the text of the question,
- "userAnswer": the answer provided by the user,
- "correctAnswer": the correct answer,
- "isCorrect": true if the user's answer is deemed correct (taking into account context and logic), otherwise false.

Here is the data to process: """
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt+questions_data
        )

        return response.text

        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur est survenue: {str(e)}")




class QuizContent(BaseModel):
    qcm: List[dict]
    oui_non: List[dict]
    reponse_courte: List[dict]

@app.post("/quiz-styles")
async def analyze_quiz_styles(quiz_content: QuizContent):
    try:
        # Préparer les données du quiz pour l'analyse
        quiz_data = ""
        
        # Formatter les QCM
        quiz_data += "\nQuestions à Choix Multiples:\n"
        for q in quiz_content.qcm:
            quiz_data += f"Question {q['id']}: {q['question']}\n"
            quiz_data += f"Options: {', '.join(q['options'])}\n"
            quiz_data += f"Réponse: {q['answer']}\n"
            quiz_data += "---\n"
        
        # Formatter les questions Oui/Non
        quiz_data += "\nQuestions Oui/Non:\n"
        for q in quiz_content.oui_non:
            quiz_data += f"Question {q['id']}: {q['question']}\n"
            quiz_data += f"Réponse: {q['answer']}\n"
            quiz_data += "---\n"
        
        # Formatter les questions à réponse courte
        quiz_data += "\nQuestions à Réponse Courte:\n"
        for q in quiz_content.reponse_courte:
            quiz_data += f"Question {q['id']}: {q['question']}\n"
            quiz_data += f"Réponse: {q['answer']}\n"
            quiz_data += "---\n"

        prompt = """Contexte :
Vous disposez d'un quiz comportant plusieurs types de questions (QCM, Oui/Non, Réponse courte). Votre tâche consiste à analyser la qualité et le style des questions et des réponses.

Instructions :

    Analyse détaillée : Pour chaque type de question (QCM, Oui/Non, Réponse courte), fournissez une analyse qui aborde les points suivants :
        Clarté et précision des questions
        Évaluez si les questions sont formulées de manière compréhensible et sans ambiguïté.
        Pertinence des options de réponse (uniquement pour les QCM)
        Vérifiez si les options proposées sont adaptées et bien réparties.
        Qualité des réponses attendues
        Analysez si les réponses attendues répondent précisément aux objectifs de la question.
        Suggestions d’amélioration
        Proposez des pistes pour optimiser la formulation ou la structure des questions et réponses.
        Format de sortie :
        Retournez l'analyse sous forme de code CSS, en modifiant uniquement les propriétés de style (comme la couleur, la typographie, etc.) dans le CSS existant. Attention : Ne modifiez pas les noms de classes existants ni n'en ajoutez ou supprimez.
        Voici le quiz à analyser :
        """+quiz_data+ """Voici le code css a modifier : :host {
  display: flex;
  width: 100%;
  min-height: 100%;
}

.quiz-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 2.5rem;
  background: linear-gradient(135deg, rgba(17, 24, 39, 0.97), rgba(88, 28, 135, 0.95));
  border-radius: 40px;
  max-width: 1000px;
  margin: 2rem auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.quiz-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.quiz-header h2 {
  color: #fff;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  text-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  position: relative;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.tabs button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  padding: 1rem 2rem;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.tabs button.active {
  color: #fff;
  background: linear-gradient(135deg, #9333EA, #4F46E5);
  box-shadow: 0 5px 15px rgba(79, 70, 229, 0.3);
}

.tabs button:hover:not(.active) {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.1);
}

.question-card {
  background: rgba(255, 255, 255, 0.07);
  border-radius: 25px;
  padding: 2.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.question-card:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.25);
  background: rgba(255, 255, 255, 0.09);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.question-number {
  color: #9333EA;
  font-weight: 700;
  font-size: 1.2rem;
  background: rgba(147, 51, 234, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 12px;
}

.question-text {
  color: #fff;
  font-size: 1.2rem;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-weight: 500;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option {
  position: relative;
}

.option input[type="radio"] {
  display: none;
}

.option label {
  color: rgba(255, 255, 255, 0.9);
  padding: 1.2rem 1.8rem;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.option label:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(5px);
}

.option input[type="radio"]:checked + label {
  background: linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(79, 70, 229, 0.3));
  border: 1px solid rgba(147, 51, 234, 0.5);
  box-shadow: 0 5px 15px rgba(147, 51, 234, 0.2);
}

.answer-input input {
  width: 100%;
  padding: 1.2rem 1.8rem;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 1.1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.answer-input input:focus {
  outline: none;
  border-color: #9333EA;
  background: rgba(147, 51, 234, 0.15);
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.25);
}

.quiz-footer {
  margin-top: 3rem;
  text-align: center;
  position: relative;
}

.score {
  margin-bottom: 2rem;
}

.score h3 {
  color: #fff;
  font-size: 2rem;
  margin-bottom: 1rem;
  text-shadow: 0 0 20px rgba(147, 51, 234, 0.5);
}

.actions button {
  padding: 1rem 3rem;
  border-radius: 15px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.submit-btn {
  background: linear-gradient(135deg, #9333EA, #4F46E5);
  color: white;
  box-shadow: 0 8px 20px rgba(147, 51, 234, 0.3);
  padding: 1.2rem 3.5rem;
  font-size: 1.15rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(147, 51, 234, 0.4);
}

.reset-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.reset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.result-indicator {
  position: absolute;
  right: 1rem;
  top: 1rem;
  font-size: 1.5rem;
}

.result-indicator .fa-check {
  color: #10B981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.result-indicator .fa-times {
  color: #EF4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
}

.option label.correct {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.option label.incorrect {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.question-card {
  animation: fadeIn 0.5s ease forwards;
}

.question-card:nth-child(2) { animation-delay: 0.1s; }
.question-card:nth-child(3) { animation-delay: 0.2s; }
.question-card:nth-child(4) { animation-delay: 0.3s; }
.question-card:nth-child(5) { animation-delay: 0.4s; }

@media (max-width: 768px) {
  .quiz-container {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .quiz-header h2 {
    font-size: 2rem;
  }

  .tabs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tabs button {
    width: 100%;
    padding: 0.8rem;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .option label {
    padding: 0.8rem 1rem;
    font-size: 1rem;
  }

  .actions button {
    width: 100%;
    margin-bottom: 1rem;
  }
}

.question-container {
  transition: opacity 0.5s ease-in-out;
  opacity: 0;
}

.question-container.fade-in {
  opacity: 1;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;
}

.nav-btn {
  padding: 1rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1.1rem;
}

.nav-btn.prev {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nav-btn.next {
  background: linear-gradient(135deg, #9333EA, #4F46E5);
  color: white;
  box-shadow: 0 5px 15px rgba(147, 51, 234, 0.3);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(147, 51, 234, 0.35);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  margin: 2.5rem 0;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #9333EA, #4F46E5);
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
}

.progress-text {
  position: absolute;
  right: 0;
  top: 8px;
  color: #fff;
  font-size: 0.9rem;
  white-space: nowrap;
}

.submit-warning {
  color: #EF4444;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  text-align: center;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(147, 51, 234, 0.5);
  box-shadow: none;
}

.submit-btn:disabled:hover {
  transform: none;
  box-shadow: none;
} 


.correct-answer {
  margin-top: 5px;
  color: #28a745; /* couleur verte pour indiquer la bonne réponse */
  font-size: 0.9em;
}
"""

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt + quiz_data
        )
        print(response.text)
        
        return response.text

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Une erreur est survenue: {str(e)}")




