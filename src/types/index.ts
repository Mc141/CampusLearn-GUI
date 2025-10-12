export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor' | 'admin';
  studentNumber?: string;
  modules?: string[];
  profilePicture?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  module: string;
  createdBy: string;
  createdAt: Date;
  subscribers: string[];
  tutors: string[];
  isActive: boolean;
}

export interface Question {
  id: string;
  topicId: string;
  studentId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isAnonymous: boolean;
  status: 'open' | 'answered' | 'closed';
  upvotes: number;
  tags: string[];
}

export interface Answer {
  id: string;
  questionId: string;
  tutorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  isAccepted: boolean;
  upvotes: number;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link';
  url: string;
  size?: number;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  attachments?: Attachment[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'question' | 'answer' | 'message' | 'topic' | 'system';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  isAnonymous: boolean;
  createdAt: Date;
  upvotes: number;
  replies: ForumReply[];
  tags: string[];
  isModerated: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  content: string;
  authorId?: string;
  isAnonymous: boolean;
  createdAt: Date;
  upvotes: number;
  isModerated: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  isFromAI: boolean;
  timestamp: Date;
  suggestions?: string[];
}

export interface Module {
  id: string;
  name: string;
  code: string;
  description: string;
  level: 'BCom' | 'BIT' | 'Diploma';
}
