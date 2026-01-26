import { Book } from '../../types';

// Definição Oficial das Trilhas (Conforme validado no PRD)
export const TRACKS = [
  { id: 'mindset', title: 'Mindset do Guerreiro', description: 'Fortalecimento mental e filosofia tática.' },
  { id: 'doutrina', title: 'Doutrina Operacional', description: 'Técnicas, táticas e procedimentos padrão.' },
  { id: 'psicologia', title: 'Psicologia do Confronto', description: 'Leitura comportamental e gestão do estresse.' },
  { id: 'comando', title: 'Liderança & Comando', description: 'Gestão de equipes e tomada de decisão sob pressão.' },
  { id: 'sobrevivencia', title: 'Sobrevivência & Resiliência', description: 'Manutenção da vida e adaptação a cenários hostis.' },
] as const;

export type TrackId = typeof TRACKS[number]['id'];

// Função Inteligente: Descobre a trilha do livro automaticamente
export function getBookTrack(book: Book): TrackId | 'outros' {
  const cat = book.category?.toLowerCase() || '';
  const tags = book.tags?.map(t => t.toLowerCase()) || [];

  // 1. Tenta pela Categoria (Prioridade Máxima)
  if (cat.includes('mindset') || cat.includes('guerreiro')) return 'mindset';
  if (cat.includes('doutrina') || cat.includes('operacional')) return 'doutrina';
  if (cat.includes('psicologia') || cat.includes('comportamento') || cat.includes('fbi')) return 'psicologia';
  if (cat.includes('liderança') || cat.includes('comando') || cat.includes('gestão')) return 'comando';
  if (cat.includes('sobrevivencia') || cat.includes('resiliência') || cat.includes('aph')) return 'sobrevivencia';

  // 2. Tenta pelas Tags (Fallback - Plano B)
  if (tags.some(t => t.includes('mindset') || t.includes('estoicismo'))) return 'mindset';
  if (tags.some(t => t.includes('tática') || t.includes('cqb'))) return 'doutrina';
  if (tags.some(t => t.includes('linguagem corporal') || t.includes('medo'))) return 'psicologia';
  if (tags.some(t => t.includes('lider') || t.includes('chefe'))) return 'comando';
  
  // 3. Sem classificação definida (Vai para "Outros")
  return 'outros';
}

// Agrupa os livros para exibição nas telas de Trilha
export function groupBooksByTrack(books: Book[]) {
  const groups: Record<string, Book[]> = {
    mindset: [],
    doutrina: [],
    psicologia: [],
    comando: [],
    sobrevivencia: [],
    outros: []
  };

  books.forEach(book => {
    const trackId = getBookTrack(book);
    if (groups[trackId]) {
      groups[trackId].push(book);
    } else {
      groups.outros.push(book);
    }
  });

  return groups;
}