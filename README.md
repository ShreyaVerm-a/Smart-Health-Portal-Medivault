# 🩺 Smart Health Portal

AI Powered Patient Care Coordination System



##### 📌 Project Overview



Smart Health Portal is a cloud-based healthcare management platform built to help patients, doctors, and hospital administrators coordinate healthcare activities in a secure, simple, and patient-controlled way.



The motivation behind this project came from observing how medical data today is often scattered across different hospitals, labs, and personal devices. Patients frequently lose reports, doctors do not have complete medical history during consultations, and administrative processes are still heavily manual. This project attempts to solve these problems by creating a single digital platform where:



* Patients own and control their medical data
* Doctors can securely access records only after patient approval
* Administrators ensure that the system remains trustworthy and compliant
* AI assists patients with preliminary symptom guidance
* OCR digitizes handwritten prescriptions into usable digital records



The system focuses strongly on privacy, security, and accountability while still remaining practical and usable for real-world healthcare scenarios.



##### 🎯 Key Features



For Patients

1. Upload and securely store medical documents (reports, prescriptions, scans)
2. View complete medical history in one place
3. Book appointments with doctors based on availability
4. Receive automatic medication reminders via email
5. Use an AI assistant for preliminary symptom analysis
6. Control which doctors can view their records using OTP authorization



For Doctors

1. Search patients using unique patient ID
2. Request access to patient documents via OTP authorization
3. Upload verified medical records
4. Manage working hours and appointment availability
5. View assigned patient appointment schedules



For Administrators

1. Verify and manage doctor registrations
2. Assist patients by booking appointments when required
3. Authorize controlled deletion of medical documents
4. Monitor system usage and enforce access governance



##### 🏗️ System Architecture (High Level)



* Frontend: React.js
* Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
* AI Chatbot: LLaMA-2 Chat model served via Hugging Face API
* OCR Engine: Custom Python model using TensorFlow + LSTM
* Notifications: SendGrid Email Service
* Security: Row-Level Security, Role-Based Access Control, OTP verification



##### 🛠️ Technologies Used



Frontend

* React.js
* JavaScript
* HTML/CSS



Backend

* Supabase (PostgreSQL)
* Supabase Auth
* Supabase Storage
* Supabase Edge Functions



AI \& OCR

* LLaMA 2 Chat weights
* Hugging Face Inference API
* Python 3
* TensorFlow
* Keras
* OpenCV
* PIL



Other Tools

* Node.js
* npm
* Git
* Visual Studio Code
* SendGrid



##### 📂 Repository Structure



smart-health-portal/

│

├── frontend/           # React frontend

├── backend/            # Supabase functions and logic

├── ocr/                # OCR model code (Python + TensorFlow)

├── docs/               # Project documents

├── .env.example        # Environment variable template

└── README.md



##### 🚀 How to Run the Project Locally



###### 1️⃣ Prerequisites

Make sure you have installed:

Node.js (v18 or above)

npm

Python 3.9+

Git

A Supabase account

Hugging Face account (for API access)

SendGrid account (for email service)



###### 2️⃣ Clone the Repository

git clone https://github.com/your-username/smart-health-portal.git

cd smart-health-portal



###### 3️⃣ Setup Environment Variables

Create a .env file in the root directory based on .env.example and add:

SUPABASE\_URL=your\_supabase\_url

SUPABASE\_KEY=your\_supabase\_key

HUGGINGFACE\_API\_KEY=your\_huggingface\_api\_key

SENDGRID\_API\_KEY=your\_sendgrid\_api\_key



###### 4️⃣ Setup Frontend

cd frontend

npm install

npm start





This will start the React app at:

http://localhost:3000



###### 5️⃣ Setup Backend (Supabase)

Create a project in Supabase

Import database schema (tables + RLS policies)

Deploy Edge Functions using Supabase CLI

Configure authentication providers



###### 6️⃣ Setup OCR Service

cd ocr

pip install -r requirements.txt

python train\_model.py      # (optional if training is needed)

python run\_ocr\_service.py



###### 7️⃣ Running the Full System

Once frontend, backend, and OCR service are running:

Patients and doctors can register/login

Patients upload documents and book appointments

Doctors request access via OTP

Admin manages verification and governance



##### 🔐 Security Design



* All medical documents are protected by Row Level Security in PostgreSQL.
* Doctors cannot view any patient data without explicit OTP authorization.
* Admins cannot view patient medical records.
* All sensitive actions are logged in audit trails.



##### 📊 Dataset Used for OCR



IAM Handwriting Dataset (primary training)

Fine-tuned with prescription-style handwritten samples



##### 🧪 Disclaimer



This system is intended for academic and prototype use only. The AI assistant provides preliminary guidance and does not replace professional medical consultation. All medical decisions must be made by licensed healthcare professionals.

