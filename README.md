# CampusLearn™ Frontend

A comprehensive peer-powered learning platform frontend built with React, TypeScript, and Material UI 3.

## Features

### 🎓 Multi-Role Support

- **Student Dashboard**: Profile management, topic subscription, question asking
- **Tutor Dashboard**: Topic management, question answering, student interaction
- **Admin Dashboard**: Platform management, user oversight, analytics

### 💬 Communication Systems

- **Public Forum**: Anonymous posting with moderation capabilities
- **Private Messaging**: One-on-one communication between students and tutors
- **AI Chatbot**: 24/7 AI assistant with Microsoft Copilot Studio integration
- **Notifications**: Multi-channel notifications (Email, SMS, WhatsApp)

### 📚 Learning Management

- **Topic Management**: Create, subscribe, and manage learning topics
- **Question & Answer System**: Ask questions, get answers from peer tutors
- **File Management**: Upload and share learning materials (PDFs, videos, audio)
- **Progress Tracking**: Monitor learning progress and engagement

### 🔧 Technical Features

- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live notifications and messaging
- **File Upload**: Drag-and-drop file upload with progress tracking
- **Search & Filter**: Advanced search and filtering capabilities
- **Role-based Access**: Secure access control based on user roles

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material UI 3 (MUI)
- **Routing**: React Router DOM
- **State Management**: React Context API
- **Build Tool**: Vite
- **File Upload**: React Dropzone
- **Charts**: Recharts
- **Forms**: React Hook Form + Yup validation

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd campuslearn-frontend
```

2. Install dependencies

```bash
npm install
```

3. Start the development server

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Demo Accounts

The application includes demo accounts for testing:

- **Student**: `student@belgiumcampus.ac.za` / `password`
- **Tutor**: `tutor@belgiumcampus.ac.za` / `password`
- **Admin**: `admin@belgiumcampus.ac.za` / `password`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── FileUpload.tsx  # File upload component
│   └── NotificationCenter.tsx # Notification system
├── pages/              # Page components
│   ├── LoginPage.tsx   # Authentication pages
│   ├── RegisterPage.tsx
│   ├── StudentDashboard.tsx
│   ├── TutorDashboard.tsx
│   ├── AdminDashboard.tsx
│   ├── ForumPage.tsx   # Public forum
│   ├── MessagesPage.tsx # Private messaging
│   ├── ProfilePage.tsx # User profile management
│   ├── TopicsPage.tsx  # Topic management
│   ├── QuestionsPage.tsx # Q&A system
│   └── ChatbotPage.tsx # AI assistant
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication context
├── data/               # Mock data and constants
│   └── mockData.ts     # Sample data for development
├── types/              # TypeScript type definitions
│   └── index.ts        # Application types
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Key Features Implementation

### Authentication System

- Role-based authentication (Student/Tutor/Admin)
- Email validation for @belgiumcampus.ac.za domain
- Persistent sessions with localStorage
- Protected routes based on user roles

### Dashboard System

- **Student**: View stats, recent questions, subscribed topics, notifications
- **Tutor**: Manage topics, answer questions, track responses, student interactions
- **Admin**: User management, platform analytics, system oversight

### Forum System

- Anonymous posting capabilities
- Moderation tools for admins
- Trending topics and popular tags
- Search and filtering functionality

### Messaging System

- Real-time chat interface
- File attachments support
- Conversation management
- Read/unread status tracking

### AI Chatbot

- Intelligent responses based on context
- Quick action buttons
- Suggestion system
- Feedback mechanism

### File Management

- Drag-and-drop upload
- Multiple file format support
- Progress tracking
- File type validation

### Notification System

- Multi-channel notifications (Email, SMS, WhatsApp)
- Real-time updates
- Notification center
- Mark as read functionality

## Responsive Design

The application is fully responsive and optimized for:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code linting
- Material UI for consistent design
- Responsive design principles

## Backend Integration

The frontend is designed to easily integrate with a backend API. Key integration points:

- Authentication endpoints
- User management
- File upload/storage
- Real-time messaging
- Notification services
- AI chatbot integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the CampusLearn™ platform for Belgium Campus.

## Support

For support and questions, please contact the development team.
