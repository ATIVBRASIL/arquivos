import { Book, Category } from './types';

export const EXTERNAL_TRAINING_URL = "https://treinamentos.ativbrasil.com.br/";

const LOREM_HTML = `
  <div class="space-y-6">
    <h2 class="text-2xl font-display font-bold text-amber-500">1. Introdução Tática</h2>
    <p class="text-lg leading-relaxed text-text-secondary">
      A vigilância moderna exige mais do que presença física. Exige inteligência situacional.
      O operador deve estar ciente de cada variável no ambiente. A postura não é agressiva, é preparada.
    </p>
    <p class="text-lg leading-relaxed text-text-secondary">
      Neste módulo, abordaremos os três pilares da observação tática: Detecção, Análise e Resposta.
    </p>
    
    <h3 class="text-xl font-display font-semibold text-text-primary mt-8">1.1 O Perímetro</h3>
    <p class="text-lg leading-relaxed text-text-secondary">
      O perímetro não é apenas a cerca física. É a zona de influência visual. 
      Entender as zonas de sombra é crucial para a integridade da operação.
    </p>
    <ul class="list-disc pl-6 space-y-2 text-text-secondary">
      <li>Identificação de pontos cegos.</li>
      <li>Controle de acesso visual.</li>
      <li>Rotas de evasão primárias e secundárias.</li>
    </ul>
    
    <div class="bg-graphite-700 p-4 border-l-4 border-amber-500 my-6">
      <p class="text-text-primary font-medium">Nota Operacional:</p>
      <p class="text-text-secondary text-sm mt-1">Sempre mantenha contato visual com seu parceiro de turno durante rondas em áreas de risco elevado.</p>
    </div>
  </div>
`;

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'Protocolos de Segurança VIP',
    category: 'Proteção Executiva',
    description: 'Manual completo sobre escolta e proteção de dignitários em ambientes hostis.',
    coverUrl: 'https://picsum.photos/300/450?grayscale',
    tags: ['VIP', 'Escolta', 'Tático'],
    readTime: '45 min',
    content: LOREM_HTML
  },
  {
    id: '2',
    title: 'Inteligência e Contra-Vigilância',
    category: 'Inteligência',
    description: 'Técnicas para identificar e neutralizar ameaças antes que elas se materializem.',
    coverUrl: 'https://picsum.photos/301/450?grayscale',
    tags: ['Intel', 'Prevenção'],
    readTime: '1h 20min',
    content: LOREM_HTML
  },
  {
    id: '3',
    title: 'Primeiros Socorros em Combate',
    category: 'APH Tático',
    description: 'Protocolo MARC1 para operadores de segurança privada.',
    coverUrl: 'https://picsum.photos/302/450?grayscale',
    tags: ['Saúde', 'Emergência'],
    readTime: '30 min',
    content: LOREM_HTML
  },
  {
    id: '4',
    title: 'Defesa Pessoal Policial',
    category: 'Combate',
    description: 'Uso progressivo da força e técnicas de imobilização.',
    coverUrl: 'https://picsum.photos/303/450?grayscale',
    tags: ['Defesa', 'Físico'],
    readTime: '55 min',
    content: LOREM_HTML
  },
  {
    id: '5',
    title: 'Gerenciamento de Crises',
    category: 'Gestão',
    description: 'Como liderar equipes durante incidentes críticos.',
    coverUrl: 'https://picsum.photos/304/450?grayscale',
    tags: ['Liderança', 'Crise'],
    readTime: '2h',
    content: LOREM_HTML
  },
    {
    id: '6',
    title: 'Manual de Armamento e Tiro',
    category: 'Técnico',
    description: 'Fundamentos de tiro, manutenção e segurança.',
    coverUrl: 'https://picsum.photos/305/450?grayscale',
    tags: ['Armas', 'Técnico'],
    readTime: '1h 10min',
    content: LOREM_HTML
  }
];

export const CATEGORIES: Category[] = [
  {
    id: 'destaques',
    title: 'Destaques Editoriais',
    books: [MOCK_BOOKS[0], MOCK_BOOKS[1], MOCK_BOOKS[5]]
  },
  {
    id: 'tecnico',
    title: 'Manuais Técnicos',
    books: [MOCK_BOOKS[2], MOCK_BOOKS[3], MOCK_BOOKS[5], MOCK_BOOKS[0]]
  },
  {
    id: 'gestao',
    title: 'Gestão e Estratégia',
    books: [MOCK_BOOKS[4], MOCK_BOOKS[1]]
  }
];