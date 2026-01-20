import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

export const generateCertificate = (user: User, book: Book, certCode: string, date: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 1. FUNDO E MOLDURA (ESTILO ACADEMIA DE POLÍCIA)
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');
  
  // Moldura em L e Bordas (Inspirado no modelo UPF)
  doc.setDrawColor(245, 158, 11); // Âmbar ATIV
  doc.setLineWidth(1.5);
  doc.line(10, 10, 50, 10); // Canto superior esquerdo
  doc.line(10, 10, 10, 50);
  doc.line(247, 200, 287, 200); // Canto inferior direito
  doc.line(287, 160, 287, 200);

  // 2. MARCA D'ÁGUA "ATIV" (CORREÇÃO DO ERRO DE OPACITY)
  // Usamos um cinza extremamente claro (245) para simular a marca d'água sem travar o código
  doc.setTextColor(245, 245, 245); 
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(120);
  doc.text('ATIV', 148.5, 115, { align: 'center', angle: 45 });

  // 3. CABEÇALHO INSTITUCIONAL
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('ATIV BRASIL', 148.5, 25, { align: 'center' });
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIA DE TÁTICAS E INTELIGÊNCIA DE VIGILÂNCIA', 148.5, 33, { align: 'center' });
  
  doc.setFontSize(32);
  doc.setTextColor(11, 13, 16);
  doc.text('CERTIFICADO DE APERFEIÇOAMENTO', 148.5, 55, { align: 'center' });

  // 4. CORPO DO DOCUMENTO
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('CERTIFICAMOS, PARA OS DEVIDOS FINS DE COMPROVAÇÃO DE COMPETÊNCIA TÉCNICA, QUE', 148.5, 75, { align: 'center' });
  
  // Nome do Operador (Destaque máximo)
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(11, 13, 16);
  doc.text(user.name.toUpperCase(), 148.5, 95, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('CONCLUIU COM ÊXITO O CURSO DE APERFEIÇOAMENTO TÁTICO EM:', 148.5, 110, { align: 'center' });
  
  // Título do Manual (Em Âmbar e Negrito)
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11);
  doc.text(book.title.toUpperCase(), 148.5, 128, { align: 'center' });

  // 5. RODAPÉ TÉCNICO
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const infoTxt = `MODALIDADE: ON-LINE  •  DATA: ${new Date(date).toLocaleDateString('pt-BR')}  •  CÓDIGO: ${certCode}`;
  doc.text(infoTxt, 148.5, 145, { align: 'center' });

  // 6. ASSINATURA DE COMANDO (CONFORME SOLICITADO)
  // Simulando a assinatura digital (Nome manuscrito)
  doc.setTextColor(20, 30, 50);
  doc.setFont('times', 'italic');
  doc.setFontSize(22);
  doc.text('Alex Andreoli Dantas', 148.5, 175, { align: 'center' });
  
  // Linha e Credenciais Oficiais
  doc.setDrawColor(11, 13, 16);
  doc.setLineWidth(0.5);
  doc.line(98, 180, 198, 180);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(11, 13, 16);
  doc.text('TENENTE ALEX ANDREOLI DANTAS', 148.5, 186, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('DIRETOR DE INSTRUÇÃO E TÁTICA', 148.5, 191, { align: 'center' });
  doc.text('RE: 953118-1', 148.5, 196, { align: 'center' }); // Registro Oficial adicionado

  // 7. SELO DE AUTENTICIDADE (QR CODE PLACEHOLDER)
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.2);
  doc.rect(250, 165, 25, 25);
  doc.setFontSize(6);
  doc.text('VALIDAÇÃO', 262.5, 163, { align: 'center' });

  doc.save(`Certificado_ATIV_${certCode}.pdf`);
};