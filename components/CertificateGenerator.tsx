import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

export const generateCertificate = (user: User, book: Book, certCode: string, date: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Estilização Básica (Simulando o Layout Oficial)
  doc.setFillColor(11, 13, 16); // Fundo Graphite Black
  doc.rect(0, 0, 297, 210, 'F');
  
  doc.setDrawColor(245, 158, 11); // Borda Amber
  doc.setLineWidth(2);
  doc.rect(5, 5, 287, 200);

  // Cabeçalho - Identidade Visual
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('CERTIFICADO DE APERFEIÇOAMENTO', 148.5, 40, { align: 'center' });

  // Dados do Operador [PRD 3.2]
  doc.setTextColor(230, 234, 242);
  doc.setFontSize(16);
  doc.text('Certificamos para os devidos fins que o operador:', 148.5, 70, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text(user.name.toUpperCase(), 148.5, 85, { align: 'center' });

  // Dados Técnicos [PRD 3.2]
  doc.setFontSize(16);
  doc.setTextColor(230, 234, 242);
  doc.text(`Concluiu com êxito o treinamento tático:`, 148.5, 110, { align: 'center' });
  
  doc.setTextColor(245, 158, 11);
  doc.setFontSize(20);
  doc.text(book.title.toUpperCase(), 148.5, 125, { align: 'center' });

  // Rodapé e Autenticidade [PRD 3.2]
  doc.setFontSize(10);
  doc.setTextColor(128, 138, 163);
  doc.text(`Código de Autenticidade: ${certCode}`, 20, 185);
  doc.text(`Data de Emissão: ${new Date(date).toLocaleDateString('pt-BR')}`, 20, 192);
  doc.text('Modalidade: On-line', 20, 199);

  // Assinatura Digital [PRD 3.2]
  doc.setTextColor(230, 234, 242);
  doc.text('____________________________________', 200, 185);
  doc.text('DIRETOR DE INSTRUÇÃO E TÁTICA', 215, 192);
  doc.text('ATIV BRASIL - REGISTRO OFICIAL', 218, 199);

  // Salvar o arquivo
  doc.save(`Certificado_ATIV_${certCode}.pdf`);
};