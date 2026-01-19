// --- DEFINIÇÕES DE USUÁRIO E ACESSO (RBAC) ---

export type UserRole = 'user' | 'admin_master' | 'admin_op' | 'admin_content'; [cite: 16, 21, 29, 40]

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
  role: UserRole; [cite: 14, 21]
  expiresAt?: string | null; [cite: 65]
  lastLogin?: string; [cite: 66]
  lastActivity?: string; [cite: 67]
}

// --- DEFINIÇÕES DE CONTEÚDO (EBOOKS) ---

export type EbookStatus = 'draft' | 'published' | 'archived'; [cite: 87, 88, 89, 91]
export type EbookLevel = 'Básico' | 'Intermediário' | 'Avançado'; [cite: 86]

export interface Book {
  id: string;
  title: string; [cite: 81]
  description: string; [cite: 82]
  category: string; [cite: 83]
  coverUrl: string; [cite: 79]
  tags: string[]; [cite: 84]
  content: string; // HTML content
  readTime: string; [cite: 85]
  level: EbookLevel; [cite: 86]
  status: EbookStatus; [cite: 87]
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  title: string;
  books: Book[];
}

// --- DEFINIÇÕES DE COMUNICAÇÃO (INBOX) ---

export interface Message {
  id: string;
  title: string; [cite: 97]
  body: string; [cite: 97]
  senderId: string;
  receiverId?: string | null; // Se null, é para todos [cite: 99, 102]
  isRead: boolean; [cite: 110, 117]
  actionLink?: string; [cite: 97, 118]
  createdAt: string; [cite: 130]
}

// --- ESTADOS DE VISUALIZAÇÃO DO APP ---

export type ViewState = 'login' | 'home' | 'reader' | 'admin'; [cite: 7, 50]
// --- DEFINIÇÕES DE CERTIFICAÇÃO (PRD v1.1) ---

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