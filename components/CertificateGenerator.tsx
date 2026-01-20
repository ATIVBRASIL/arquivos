import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

export const generateCertificate = (user: User, book: Book, certCode: string, date: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // 1. FUNDO BRANCO E MOLDURA INSTITUCIONAL
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');
  
  // Moldura Tática Sóbria
  doc.setDrawColor(20, 24, 33); // Grafite escuro
  doc.setLineWidth(1);
  doc.rect(10, 10, 277, 190);
  doc.setDrawColor(245, 158, 11); // Linha detalhe em âmbar
  doc.setLineWidth(0.3);
  doc.rect(12, 12, 273, 186);

  // 2. MARCA D'ÁGUA "ATIV" (Fundo)
  doc.setTextColor(240, 240, 240); // Cinza muito claro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(120);
  doc.text('ATIV', 148.5, 115, { align: 'center', angle: 45, opacity: 0.1 });

  // 3. CABEÇALHO
  doc.setTextColor(11, 13, 16);
  doc.setFontSize(10);
  doc.text('ATIV BRASIL - INTELIGÊNCIA E TREINAMENTO TÁTICO', 148.5, 25, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text('CERTIFICADO DE APERFEIÇOAMENTO', 148.5, 45, { align: 'center' });

  // 4. TEXTO DE CERTIFICAÇÃO
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(80, 90, 110);
  doc.text('Certificamos para os devidos fins de direito que o operador:', 148.5, 70, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(11, 13, 16);
  doc.text(user.name.toUpperCase(), 148.5, 88, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(80, 90, 110);
  doc.text('concluiu com êxito o curso de aperfeiçoamento tático:', 148.5, 105, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(245, 158, 11);
  doc.text(book.title.toUpperCase(), 148.5, 118, { align: 'center' });

  // 5. GRADE DE COMPETÊNCIAS (Valor percebido)
  doc.setFillColor(248, 249, 251);
  doc.rect(40, 130, 217, 20, 'F');
  doc.setTextColor(100, 110, 130);
  doc.setFontSize(8);
  doc.text('COMPETÊNCIAS TÉCNICAS AVALIADAS:', 45, 135);
  doc.setTextColor(11, 13, 16);
  doc.setFontSize(10);
  const tags = book.tags.join(' • ') || 'Doutrina Operacional • Inteligência Situacional';
  doc.text(tags.toUpperCase(), 45, 143);

  // 6. ASSINATURA DIGITALIZADA
  doc.setTextColor(11, 13, 16);
  
  // Nome do Tenente (Fonte cursiva simulada ou Bold)
  doc.setFont('times', 'italic');
  doc.setFontSize(16);
  doc.text('Alex Andreoli Dantas', 210, 178, { align: 'center' });
  
  // Linha e Título
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('____________________________________', 210, 180, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('TENENTE ALEX ANDREOLI DANTAS', 210, 185, { align: 'center' });
  doc.setFontSize(8);
  doc.text('DIRETOR DE INSTRUÇÃO E TÁTICA', 210, 190, { align: 'center' });

  // 7. QR CODE E AUTENTICIDADE
  doc.setDrawColor(200, 200, 200);
  doc.rect(25, 165, 30, 30); // Espaço QR Code
  doc.setTextColor(128, 138, 163);
  doc.setFontSize(7);
  doc.text('VERIFICAÇÃO DE AUTENTICIDADE', 25, 163);
  doc.setFontSize(9);
  doc.setTextColor(11, 13, 16);
  doc.text(`CÓDIGO: ${certCode}`, 60, 182);
  doc.text(`EMISSÃO: ${new Date(date).toLocaleDateString('pt-BR')}`, 60, 188);
  doc.text('MODALIDADE: ON-LINE', 60, 194);

  // SALVAR
  doc.save(`Certificado_ATIV_${certCode}.pdf`);
};