# OmniSupport AI 🤖⚡
### Autonomous Customer Support & Human Agent Copilot Platform

OmniSupport AI is a full-stack, enterprise-grade AI customer support platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **SQLite**. It combines autonomous AI tier-1 deflection powered by **Retrieval-Augmented Generation (RAG)** and **Google Gemini 1.5 Flash** with a live workspace for human agents featuring an **AI Copilot**, ticket queues, and real-time **Server-Sent Events (SSE)** token streaming.

---

## 🌟 Key Features

### 1. 💬 Customer AI Chat Widget
* **Real-Time Token Streaming**: Streams AI responses token-by-token over Server-Sent Events (SSE) for zero-latency user experience.
* **RAG Grounding**: Queries are cross-referenced with SQLite-indexed knowledge base articles to prevent hallucinations and cite official policies.
* **Automated Escalation Triggers**: Detects customer sentiment (frustrated, urgent, angry) or explicit human handoff requests (e.g., *"talk to human"*, *"outage"*, *"refund immediately"*) and automatically transfers the ticket to an active human agent.
* **CSAT Feedback Rating**: Built-in 5-star customer satisfaction rating prompt upon ticket resolution.
* **Simulation Testing Panel**: Quick preset queries for instant testing of billing, technical rate limits, SAML SSO, and emergency escalation.

### 2. 🛡️ Agent Workspace & Dashboard
* **Real-Time Ticket Queue**: Filter tickets by Status (*Open, In Progress, Escalated, Resolved, Closed*), Priority (*Urgent, High, Medium, Low*), or Category (*Billing, Technical, Account, General*).
* **AI Copilot Sidecar**: Human agents can click **Generate Copilot Suggestions** to instantly receive:
  * An empathetic, ready-to-send draft reply tailored to the customer conversation.
  * An executive issue summary.
  * An actionable checklist of steps to resolve the issue.
* **Public Replies vs. Internal Notes**: Support agents can switch to internal team note mode to coordinate without exposing internal remarks to the customer.
* **Live Re-assignment & Status Updates**: Assign tickets to specialists (Sarah Jenkins, Marcus Vance, Elena Gomez, David Kim) with automated status tracking.

### 3. 📚 Knowledge Base Management & Document Ingestion
* **Full In-App CRUD**: Create, view, edit, and delete knowledge base articles directly from the UI.
* **Document Upload & Parsing**: Upload `.md`, `.txt`, `.json`, or `.markdown` files. The system automatically parses headings for titles, categorizes content, and extracts high-frequency vector tokens for search.
* **Keyword & Semantic Search**: Fast search over knowledge base articles with real-time scoring.

### 4. 📊 Executive Telemetry & Analytics Dashboard
* **AI Autonomous Deflection Rate**: Tracks percentage of inquiries resolved without human intervention.
* **CSAT Average**: Continuous customer satisfaction rating scoring.
* **Sentiment Distribution Breakdown**: Visual telemetry for Positive, Neutral, Frustrated, and Urgent tickets.
* **Category Breakdown**: Proportions across Billing, Technical, Account, and General support issues.
* **Average Resolution Time**: Tracks hours to ticket closure.

### 5. 🔌 Hybrid AI Engine & Database Persistence
* **Dual-Engine AI**: Uses Google Gemini 1.5 Flash (`@google/generative-ai`) when an API key is provided, and automatically falls back to an intelligent deterministic RAG engine when running offline.
* **Persistent SQLite Database**: Built with Prisma ORM (`prisma/dev.db`), featuring auto-seeding on initial startup, relational integrity, and persistence across server restarts.

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React Server Components, Route Handlers, Turbopack support |
| **Language** | TypeScript 5.6 | Strict typing across API contracts, schemas, and components |
| **Database & ORM** | SQLite & Prisma 5.22 | Embedded, zero-configuration local database with Prisma ORM |
| **AI Integration** | Google Gemini 1.5 Flash | Large Language Model for chat streaming & agent copilot |
| **Styling** | Tailwind CSS 3.4 | Modern dark-mode interface with custom animations |
| **Icons** | Lucide React | Clean, responsive UI iconography |
| **Streaming** | Server-Sent Events (SSE) | Token-by-token streaming via standard Web Streams API |

---

## 📁 Project Directory Structure

```text
Ai_Customer_support_Platform/
├── prisma/
│   ├── dev.db                      # Embedded SQLite database file
│   └── schema.prisma               # Prisma data models (Agent, Ticket, ChatMessage, KnowledgeArticle)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   ├── route.ts        # Standard Chat API endpoint
│   │   │   │   └── stream/
│   │   │   │       └── route.ts    # SSE token-by-token streaming chat endpoint
│   │   │   ├── knowledge/
│   │   │   │   ├── route.ts        # Knowledge Base list & create endpoint
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # Single article GET, PATCH, DELETE endpoint
│   │   │   ├── metrics/
│   │   │   │   └── route.ts        # Analytics telemetry endpoint
│   │   │   └── tickets/
│   │   │       ├── route.ts        # Ticket queue & creation endpoint
│   │   │       └── [id]/
│   │   │           ├── route.ts    # Ticket status & metadata update endpoint
│   │   │           ├── copilot/
│   │   │           │   └── route.ts# AI Copilot suggestion generator
│   │   │           └── messages/
│   │   │               └── route.ts# Public reply & internal note posting
│   │   ├── globals.css             # Tailwind CSS styles & scrollbars
│   │   ├── layout.tsx              # App root layout & metadata
│   │   └── page.tsx                # Main view router & persistent tab manager
│   ├── components/
│   │   ├── AgentDashboard.tsx      # Comprehensive human agent ticketing workspace
│   │   ├── AnalyticsView.tsx       # Executive metrics & sentiment charts
│   │   ├── CustomerChatWidget.tsx  # Customer-facing chat with SSE streaming & presets
│   │   ├── KnowledgeBaseView.tsx   # RAG article viewer, CRUD modals & document upload
│   │   └── Navbar.tsx              # Navigation bar with real-time escalation badge
│   ├── lib/
│   │   ├── ai.ts                   # Gemini AI streaming & deterministic fallback engine
│   │   ├── knowledgeBase.ts        # SQLite article querying, vector extraction, and CRUD
│   │   ├── prisma.ts               # Global Prisma client singleton
│   │   ├── seed.ts                 # Database auto-seed script for demo data
│   │   └── store.ts                # Database query abstraction layer
│   └── types/
│       └── index.ts                # TypeScript interfaces (Ticket, Message, Agent, Article)
├── .env.example                    # Environment variable template
├── .env.local                      # Local environment configuration
├── package.json                    # Project metadata & dependencies
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Main documentation
├── SYNOPSIS.md                     # Executive project synopsis
└── PROJECT_REPORT.md               # Full academic & technical report
```

---

## 🚀 Quick Start Guide

### Prerequisites
* **Node.js** (v18.17.0 or higher recommended)
* **npm** (v9 or higher)

### Installation & Launch

1. **Clone or Navigate to the Repository**:
   ```bash
   cd Ai_Customer_support_Platform
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Initialization**:
   Prisma will initialize the SQLite database and generate the Prisma Client automatically:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Configure Environment Variables (Optional)**:
   The project works straight out of the box in offline mode. If you wish to enable Google Gemini API:
   * Open `.env.local`
   * Add your Gemini API key:
     ```ini
     AI_PROVIDER=gemini
     GEMINI_API_KEY="AIzaSy..."
     NEXT_PUBLIC_APP_NAME="OmniSupport AI"
     NEXT_PUBLIC_COMPANY_NAME="Nexus Cloud Technologies"
     ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

6. **Open in Browser**:
   Navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 💻 Running in Visual Studio Code

1. Launch VS Code and open the folder:
   ```powershell
   code "C:\Users\User\Desktop\Ai_Customer_support_Platform"
   ```
2. Open the terminal with <kbd>Ctrl</kbd> + <kbd>`</kbd>.
3. Run `npm run dev`.
4. (Optional) Run Prisma Studio in a second terminal to inspect database tables visually:
   ```powershell
   npx prisma studio
   ```
   Open **[http://localhost:5555](http://localhost:5555)** to view live tables.

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/chat` | `POST` | Process customer inquiry and return full JSON response |
| `/api/chat/stream` | `POST` | Process customer inquiry with Server-Sent Events (SSE) token streaming |
| `/api/tickets` | `GET` | List all tickets with optional `?status=`, `?category=`, `?priority=`, `?q=` |
| `/api/tickets` | `POST` | Create a new customer support ticket |
| `/api/tickets/[id]` | `GET` | Retrieve complete ticket timeline and details |
| `/api/tickets/[id]` | `PATCH` | Update ticket status, priority, category, or assignment |
| `/api/tickets/[id]/messages`| `POST` | Add customer message, agent reply, or private internal note |
| `/api/tickets/[id]/copilot` | `POST` | Generate AI Copilot suggested response, summary, and action items |
| `/api/knowledge` | `GET` | Search or list all indexed knowledge articles (`?q=query`) |
| `/api/knowledge` | `POST` | Add a new knowledge base article or ingest document |
| `/api/knowledge/[id]` | `GET` | Fetch single knowledge base article |
| `/api/knowledge/[id]` | `PATCH` | Edit knowledge base article |
| `/api/knowledge/[id]` | `DELETE`| Delete knowledge base article from database |
| `/api/metrics` | `GET` | Fetch live analytics (deflection rate, CSAT, sentiment breakdown) |

---

## 📄 License
This project is licensed under the MIT License.
