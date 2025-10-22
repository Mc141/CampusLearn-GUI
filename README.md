# CampusLearn

A comprehensive peer-to-peer learning platform designed for Belgium Campus students, featuring AI-powered assistance, interactive quizzes, and collaborative learning tools.

## Features

### Core Learning Platform

- **Student Registration & Profiles**: Complete user management with academic background tracking and Belgium Campus email domain validation
- **Module Management**: Dynamic module selection from database with real-time updates
- **Topic Management**: Create and subscribe to learning topics with module-specific organization
- **Peer Tutoring System**: Connect students with qualified tutors for personalized assistance
- **Interactive Quizzes**: Create and take quizzes with multiple question types (multiple choice, true/false, fill-in-the-blank)
- **Resource Management**: Upload and organize learning materials including PDFs, videos, and documents

### Communication & Collaboration

- **Public Forum**: Anonymous academic discussions with moderation capabilities
- **Private Messaging**: One-on-one communication between students and tutors
- **Real-time Chat**: Instant messaging with file attachments and notifications
- **AI Chatbot Assistant**: 24/7 intelligent support with conversation context and escalation to human tutors

### Administrative Tools

- **User Management**: Admin controls for user roles, banning, and account management
- **Content Moderation**: Comprehensive moderation system for all platform content
- **Analytics Dashboard**: Track platform usage, user engagement, and learning outcomes
- **FAQ Management**: Dynamic FAQ system with view tracking and feedback collection
- **Module Administration**: Manage academic modules and program assignments

### Advanced Features

- **Smart Student Number Detection**: Automatic extraction of student numbers from email addresses
- **Password Strength Validation**: Comprehensive password security with real-time feedback
- **Chat Expiry System**: Automatic cleanup of inactive conversations after 7 days
- **Notification System**: Real-time notifications for messages, assignments, and updates
- **File Upload System**: Secure file handling with progress tracking and validation
- **Belgium Campus Branding**: Custom color palette and theme matching institutional identity
- **Mobile Responsive**: Optimized for all device sizes and screen resolutions

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI)** for component library with custom Belgium Campus theming
- **React Router** for navigation
- **Vite** for build tooling and development server

### Backend & Database

- **Supabase** for backend-as-a-service
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Storage** for file uploads and management
- **Supabase Realtime** for live updates and notifications

### AI & Automation

- **Microsoft Copilot Studio** for AI chatbot integration with conversation context
- **Supabase Edge Functions** for serverless automation
- **Scheduled Functions** for automated cleanup and maintenance

### Deployment & Infrastructure

- **Netlify** for frontend hosting
- **Supabase Cloud** for database and backend services
- **Render** for additional services

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git for version control

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Mc-141/CampusLearn-GUI.git
cd CampusLearn-GUI
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure Supabase:

   - Create a new Supabase project
   - Update environment variables with your Supabase URL and API keys
   - Run the database migrations
   - Import module data using the provided SQL scripts

5. Start the development server:

```bash
npm run dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

### Initial Data Import

1. Run the database cleanup script to reset tables:

```bash
psql -f database_cleanup.sql
```

2. Import Belgium Campus module data:

```bash
psql -f belgium_campus_modules.sql
```

### Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Student, tutor, and admin accounts with profile information
- **Modules**: Academic modules with codes, names, and program associations
- **Topics**: Learning subjects with module associations
- **Questions & Answers**: Q&A system with attachments and replies
- **Messages**: Private communication between users
- **Forum**: Public discussions with moderation
- **Quizzes**: Interactive exercises with multiple question types
- **Resources**: File uploads and learning materials
- **Notifications**: System alerts and updates
- **FAQ**: Frequently asked questions with interaction tracking
- **Tutor Applications**: Tutor application records with status tracking
- **Tutor Application Modules**: Junction table linking applications to modules
- **Topic Tutors**: Assignment of tutors to specific topics
- **Chatbot Conversations**: AI assistant conversation history
- **Chatbot Escalations**: Escalation records for human tutor intervention

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout with navigation
│   ├── PasswordStrengthIndicator.tsx  # Password validation component
│   └── ProfilePictureUpload.tsx       # Profile picture management
├── context/            # React context providers
│   ├── AuthContext.tsx # Authentication and user management
│   └── ThemeContext.tsx # Theme switching (light/dark mode)
├── hooks/              # Custom React hooks
├── lib/                # External library configurations
│   └── supabase.ts     # Supabase client configuration
├── pages/              # Page components
│   ├── LoginPage.tsx   # User authentication
│   ├── RegisterPage.tsx # User registration with module selection
│   ├── ProfilePage.tsx # User profile management
│   ├── ChatbotPage.tsx # AI assistant interface
│   └── AdminDashboard.tsx # Administrative controls
├── services/           # API and business logic
│   ├── modulesService.ts # Module management
│   ├── chatbotService.ts # AI chatbot integration
│   ├── userProfileService.ts # User profile operations
│   ├── tutorApplicationService.ts # Tutor application management
│   ├── tutorModuleAssignmentService.ts # Tutor module assignments
│   ├── tutorModuleService.ts # Tutor module information and status
│   └── tutorTopicAssignmentService.ts # Topic-tutor assignments
├── styles/             # Custom styling
│   └── belgium-campus-colors.css # Brand color variables
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    └── passwordValidation.ts # Password strength validation
```

## Key Features

### Authentication & User Management

- Role-based access control (Student, Tutor, Admin)
- Email-based registration with Belgium Campus domain validation (@belgiumcampus.ac.za, @student.belgiumcampus.ac.za)
- Smart student number auto-detection from email addresses
- Secure session management with automatic logout for banned users
- Password strength validation with real-time feedback

### Learning Management

- Dynamic module selection from database
- Topic creation and subscription system
- Tutor assignment and matching
- Interactive quiz creation and taking
- Resource upload and organization
- **Tutor Module Management**: Comprehensive system for tutor applications and module assignments

### Tutor Management System

- **Tutor Applications**: Multi-step application process with module selection
- **Module Assignment**: Admin-controlled assignment of approved tutors to specific modules
- **Application Status Tracking**: Real-time status updates (pending, approved, rejected)
- **Profile Integration**: Tutors can view both applied and assigned modules in their profile
- **Auto-Assignment**: Intelligent matching of tutors to topics based on module expertise
- **Escalation Management**: AI chatbot escalations automatically routed to qualified tutors

### Communication

- Real-time messaging with file attachments
- Public forum with moderation tools
- AI chatbot with conversation context and intelligent escalation
- Comprehensive notification system
- Message word limits to prevent abuse (300 words)

### Administration

- User management and role assignment
- Content moderation across all platform areas
- Analytics and reporting dashboard
- System maintenance and cleanup tools
- Module and program management
- **Tutor Application Management**: Review and approve/reject tutor applications
- **Module Assignment Control**: Assign approved tutors to specific modules
- **Escalation Oversight**: Monitor and manage AI chatbot escalations

### AI Chatbot Features

- Conversation context awareness
- User-specific information integration
- Intelligent escalation to human tutors
- Real-time conversation history
- Module-specific assistance
