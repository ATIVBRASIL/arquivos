export interface Book {
  id: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  tags: string[];
  content: string; // HTML content
  readTime: string;
}

export interface Category {
  id: string;
  title: string;
  books: Book[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: 'active' | 'expired' | 'none';
}

export type ViewState = 'login' | 'home' | 'reader';