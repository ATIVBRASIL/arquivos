export type EbookLevel = 'Básico' | 'Intermediário' | 'Avançado';
export type EbookStatus = 'draft' | 'published' | 'archived';

// ATUALIZADO: Novas telas 'tracks' e 'track' adicionadas
export type ViewState = 'home' | 'tracks' | 'track' | 'reader' | 'admin';

export type UserRole = 'user' | 'admin' | 'editor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  // Campos de Inteligência / Onboarding
  whatsapp?: string;
  occupation?: string;
  main_goal?: string;
  experience_level?: string;
}

export interface Book {
  id: string;
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  tags: string[];
  content: string;
  readTime: string;
  level: EbookLevel;
  status: EbookStatus;
  technical_skills?: string;
  quiz_data?: any;
}

// NOVO: Estrutura para salvar o progresso (MVP no LocalStorage)
export interface UserProgress {
  opened: {
    [bookId: string]: {
      firstOpenedAt: string;
      lastOpenedAt: string;
      count: number;
    };
  };
}