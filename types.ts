export type EbookLevel = 'Básico' | 'Intermediário' | 'Avançado';
export type EbookStatus = 'draft' | 'published' | 'archived';

// Telas de navegação
export type ViewState = 'home' | 'tracks' | 'track' | 'reader' | 'admin';

export type UserRole = 'user' | 'admin' | 'editor';

// === NOVA INTERFACE: TURMA ===
export interface Cohort {
  id: string;
  name: string;
  validity_days: number; // <--- Adicione esta linha
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  
  // Controle de Acesso e Turmas
  cohort_id?: string;        // ID da Turma a qual pertence
  cohort_name?: string;      // Nome da Turma (para facilitar exibição)
  expires_at?: string | null; // Data de expiração do acesso (null = vitalício)

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

export interface UserProgress {
  opened: {
    [bookId: string]: {
      firstOpenedAt: string;
      lastOpenedAt: string;
      count: number;
    };
  };
}