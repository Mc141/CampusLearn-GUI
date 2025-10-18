export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'tutor' | 'admin';
  studentNumber?: string;
  modules?: string[];
  profilePicture?: string;
  githubUsername?: string;
  githubProfileUrl?: string;
  githubBio?: string;
  githubLocation?: string;
  githubWebsite?: string;
  githubCompany?: string;
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
  replies?: AnswerReply[];
}

export interface AnswerReply {
  id: string;
  answerId: string;
  content: string;
  authorId?: string;
  isAnonymous: boolean;
  upvotes: number;
  isModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorName?: string;
  attachments?: AnswerReplyAttachment[];
}

export interface AnswerReplyAttachment {
  id: string;
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'link' | 'document';
  url: string;
  fileName: string;
  filePath: string;
  replyId: string;
  uploadedBy?: string;
  size: number;
  downloads: number;
  tags: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  parentReplyId?: string;
  depth: number;
  threadPath: string;
  replies?: ForumReply[];
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
