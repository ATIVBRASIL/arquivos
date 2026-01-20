// --- DEFINIÇÕES DE USUÁRIO E ACESSO (RBAC) ---

export type UserRole = 'user' | 'admin_master' | 'admin_op' | 'admin_content';

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  role: UserRole;
  expiresAt?: string | null;
  lastLogin?: string;
  lastActivity?: string;
}

// --- DEFINIÇÕES DE CONTEÚDO (EBOOKS) ---

export type EbookStatus = 'draft' | 'published' | 'archived';
export type EbookLevel = 'Básico' | 'Intermediário' | 'Avançado';

export interface Book {
  id: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  tags: string[];
  content: string; // HTML content
  readTime: string;
  level: EbookLevel;
  status: EbookStatus;
  createdAt: string;
  updatedAt: string;
  quiz_data?: any; // SISTEMA DE CERTIFICAÇÃO (PRD v1.1)
  technical_skills?: string; // NOVO: EMENTA TÉCNICA PARA O CERTIFICADO (PRD v1.2)
}

export interface Category {
  id: string;
  title: string;
  books: Book[];
}

// --- DEFINIÇÕES DE COMUNICAÇÃO (INBOX) ---

export interface Message {
  id: string;
  title: string;
  body: string;
  senderId: string;
  receiverId?: string | null; // Se null, é para todos
  isRead: boolean;
  actionLink?: string;
  createdAt: string;
}

// --- ESTADOS DE VISUALIZAÇÃO DO APP ---

export type ViewState = 'login' | 'home' | 'reader' | 'admin';

// --- DEFINIÇÕES DE CERTIFICAÇÃO (PRD v1.1 e v1.2) ---

export interface UserExam {
  id: string;
  user_id: string;
  ebook_id: string;
  score: number;
  status: 'approved' | 'failed';
  cert_code: string;
  created_at: string;
}

// Extensão do tipo Book para incluir carga horária se necessário
export interface BookWithStats extends Book {
  workload?: number; // Carga horária em horas
}