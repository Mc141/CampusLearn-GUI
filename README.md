# CampusLearn

A comprehensive peer-to-peer learning platform designed for Belgium Campus students, featuring AI-powered assistance, interactive quizzes, and collaborative learning tools.

## Features

### Core Learning Platform

- **Student Registration & Profiles**: Complete user management with academic background tracking
- **Topic Management**: Create and subscribe to learning topics with module-specific organization
- **Peer Tutoring System**: Connect students with qualified tutors for personalized assistance
- **Interactive Quizzes**: Create and take quizzes with multiple question types (multiple choice, true/false, fill-in-the-blank)
- **Resource Management**: Upload and organize learning materials including PDFs, videos, and documents

### Communication & Collaboration

- **Public Forum**: Anonymous academic discussions with moderation capabilities
- **Private Messaging**: One-on-one communication between students and tutors
- **Real-time Chat**: Instant messaging with file attachments and notifications
- **AI Chatbot Assistant**: 24/7 intelligent support with escalation to human tutors

### Administrative Tools

- **User Management**: Admin controls for user roles, banning, and account management
- **Content Moderation**: Comprehensive moderation system for all platform content
- **Analytics Dashboard**: Track platform usage, user engagement, and learning outcomes
- **FAQ Management**: Dynamic FAQ system with view tracking and feedback collection

### Advanced Features

- **Chat Expiry System**: Automatic cleanup of inactive conversations after 7 days
- **Notification System**: Real-time notifications for messages, assignments, and updates
- **File Upload System**: Secure file handling with progress tracking and validation
- **Theme Support**: Light and dark mode with responsive design
- **Mobile Responsive**: Optimized for all device sizes and screen resolutions

## Technology Stack

### Frontend

- **React 18** with TypeScript
- **Material-UI (MUI)** for component library
- **React Router** for navigation
- **Vite** for build tooling and development server

### Backend & Database

- **Supabase** for backend-as-a-service
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Storage** for file uploads and management
- **Supabase Realtime** for live updates and notifications

### AI & Automation

- **Microsoft Copilot Studio** for AI chatbot integration
- **Supabase Edge Functions** for serverless automation
- **Scheduled Functions** for automated cleanup and maintenance

### Deployment & Infrastructure

- **Netlify** for frontend hosting
- **Supabase Cloud** for database and backend services
- **GitHub Actions** for CI/CD pipeline
- **Render** for additional services

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git for version control

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/CampusLearn-GUI.git
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

## Project Structure

```
src/
├── components/          # Reusable UI components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # External library configurations
├── pages/              # Page components
├── services/           # API and business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Authentication

- Role-based access control (Student, Tutor, Admin)
- Email-based registration with Belgium Campus domain validation
- Secure session management with automatic logout for banned users

### Learning Management

- Topic creation and subscription system
- Tutor assignment and matching
- Interactive quiz creation and taking
- Resource upload and organization

### Communication

- Real-time messaging with file attachments
- Public forum with moderation tools
- AI chatbot with intelligent escalation
- Comprehensive notification system

### Administration

- User management and role assignment
- Content moderation across all platform areas
- Analytics and reporting dashboard
- System maintenance and cleanup tools

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Student, tutor, and admin accounts with profile information
- **Topics**: Learning subjects with module associations
- **Questions & Answers**: Q&A system with attachments and replies
- **Messages**: Private communication between users
- **Forum**: Public discussions with moderation
- **Quizzes**: Interactive exercises with multiple question types
- **Resources**: File uploads and learning materials
- **Notifications**: System alerts and updates

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

## Acknowledgments

- Belgium Campus for providing the project requirements and hosting support
- Supabase for backend infrastructure
- Material-UI for the component library
- The React community for excellent documentation and tools
