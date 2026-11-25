# 🛡️ JOBSHIELD — Recruitment Security & Fraud Detection Platform

> **Protecting Careers Before Scammers Destroy Them.**  
> An intelligent, end-to-end recruitment verification ecosystem equipped with automated multi-modal scanners, Trust Intelligence, Evidence Knowledge Graphs, Community Threat Reporting, and a Multilingual AI & Voice Assistant.

---

## 🌟 Key Features & Architecture

JOBSHIELD provides a comprehensive shield for students, fresh graduates, and job seekers against recruitment fraud, fake internships, registration-fee scams, Telegram task traps, and lookalike phishing domains.

### 1. 🔍 Unified Recruitment Scanner
Provides 5 specialized security engines for multi-modal recruitment analysis:
* **Offer Letter Scanner:** Analyzes appointment PDFs and image files for advance deposit clauses, unverified webmail, and lookalike domain mismatches.
* **Email Scanner:** Parses recruitment emails, header authentication status (SPF, DKIM, DMARC), Reply-To mismatches, and urgency indicators.
* **URL & Domain Scanner:** Inspects suspicious recruitment links, DNS records, TLS certificates, RDAP registrar information, and threat feeds over HTTPS.
* **Job Description Scanner:** Flags unrealistic daily payouts, work-from-home data-entry penalty traps, commission pyramids, and missing employer details.
* **Screenshot & Message Scanner:** Uses Optical Character Recognition (OCR) to extract and analyze text from WhatsApp messages, Telegram chats, and social media flyers.

### 2. 🤖 Multilingual AI Chat & Voice Assistant
A conversational AI assistant embedded across the entire application:
* **Natural Conversation & Memory:** Answers greetings, remembers user names and background context, provides safety recommendations, and answers follow-up questions.
* **Multilingual Support:** Automatic language detection and fluent responses in **English**, **Hindi (हिंदी)**, **Marathi (मराठी)**, **Gujarati (ગુજરાતી)**, Tamil, Telugu, Spanish, French, German, and more.
* **Voice Assistant (STT & TTS):** Integrated Speech-to-Text (STT) for hands-free voice input and Text-to-Speech (TTS) for vocalizing answers in the user's spoken language.
* **Authorized Data Assistance:** Retrieves the user's actual scan history, saved reports, and community report statuses upon request.
* **Direct Navigation:** Provides clickable in-chat action buttons that route users directly to relevant scanners or platform features.

### 3. 🕸️ Recruitment Trust Intelligence & Evidence Graph
* **Tri-Factor Entity Verification:** Verifies corporate entities across **Company Verification**, **Recruiter Verification**, and **Opportunity Verification**.
* **Visual Evidence Graph:** Interactive node-link graph mapping complex relationships:
  $$\text{Company} \longrightarrow \text{Domain} \longrightarrow \text{Recruiter} \longrightarrow \text{Email} \longrightarrow \text{Offer Letter} \longrightarrow \text{Application URL} \longrightarrow \text{Payment Request}$$
* **Status Badges:** Clearly categorizes entities as *Confirmed*, *Supported*, *Unverified*, *Contradictory*, *Suspicious*, or *Missing Evidence*.

### 4. 📢 Community Threat Intelligence
* **Crowdsourced Escalations:** Allows users to report fraudulent job offers, share evidence summaries, and track community moderation.
* **Moderation Workflow:** Administrator review queue where verified community reports are promoted to platform domain threat indicators.

### 5. 📚 User Protection Centre
* **Interactive Checklists:** *Before You Apply*, *Before You Pay*, and *Before You Share Documents*.
* **Emergency Response:** Practical step-by-step guidance for financial cybercrime victims, highlighting India's Cybercrime Helpline **1930** and **cybercrime.gov.in**.
* **Awareness Library:** 10 comprehensive educational guides covering fake HR scams, Telegram task traps, data-entry penalty clauses, and identity theft.

### 6. 📊 Dual Role Dashboards (Citizen & Administrator)
* **Citizen Dashboard:** Displays scan statistics (**24 total scans**, **7 high-risk**, **9 suspicious**, **8 lower-risk**), recent security alerts, saved reports, and risk distribution charts.
* **Administrator Operations Console:** Comprehensive oversight suite featuring platform telemetry (**120 Users**, **460 Total Scans**), scan monitoring, moderation queues, company records management, audit logs, and system health status.

---

## 🔑 Demo Login Accounts

JOBSHIELD features two pre-configured demo account environments with a single-click **Login with Demo** button:

| Role / Portal | Demo Identity Name | Email Address | Access & Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen / Student** | Aarav Kulkarni | `aarav.demo@jobshield.example` | Access to Citizen Dashboard, 24 pre-seeded security scans, 5 community reports, saved reports, and personal AI Assistant context. |
| **Administrator** | JobShield Administrator | `admin.demo@jobshield.example` | Access to Security Operations Console, 120 user records, 460 platform scans, 38 community moderation items, company records, and audit logs. |

---

## 💻 Tech Stack & Tools

* **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide React Icons, Recharts, `@xyflow/react` (React Flow), Web Speech API (STT/TTS).
* **Backend:** Node.js, Express.js, TypeScript, `better-sqlite3` (SQLite engine), `@google/genai` (Gemini API integration), Multer, `pdf-parse`.
* **Build System:** Vite 8, `tsx`.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vedantuj-lab/JobShield.git
   cd JobShield
   ```

2. **Install Dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Build the Production Bundle:**
   ```bash
   npm run build
   ```

4. **Start the Production Server:**
   ```bash
   npm run start
   ```

5. **Open in Browser:**
   Navigate to **[http://localhost:3000](http://localhost:3000)** or **[http://127.0.0.1:3000](http://127.0.0.1:3000)**.

---

## 📡 API Endpoints Overview

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Returns system health, database, AI, and OAuth configuration status. |
| `/api/auth/demo-login` | `POST` | Authenticates Citizen or Administrator demo accounts without password entry. |
| `/api/scans` | `GET / POST` | Retrieves user scan history or executes a new multi-modal security scan. |
| `/api/reports/:id` | `GET` | Retrieves full 14-section security assessment report for a scan ID. |
| `/api/reports/:id/download` | `GET` | Downloads security report in TXT or JSON format. |
| `/api/intelligence/records` | `GET` | Retrieves Trust Intelligence records, company profiles, and evidence graphs. |
| `/api/community/my-reports` | `GET / POST` | Submits or retrieves community threat reports. |
| `/api/ai/chat` | `POST` | Processes natural language & voice queries for the AI Chat Assistant. |
| `/api/admin/overview` | `GET` | Retrieves platform telemetry metrics for the Administrator Console. |
| `/api/admin/moderation/reports/:id/status` | `PATCH` | Updates moderation status and auto-promotes confirmed threats. |
| `/api/demo/reset` | `POST` | Restores the isolated demo sandbox to its initial seeded dataset. |

---

## 🛡️ Privacy & Security Disclaimer

* All company names, recruiter identities, and domain indicators used in the pre-seeded demo dataset are **fictional samples** created solely for demonstration purposes.
* If you suspect financial cybercrime in India, report immediately to your bank and call the **National Cybercrime Helpline at 1930** or visit **[https://cybercrime.gov.in](https://cybercrime.gov.in)**.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
