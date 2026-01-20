import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

function assertBrowser() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('CertificateGenerator deve rodar no navegador (window/document ausentes).');
  }
}

function safeText(value: unknown, fallback: string) {
  const s = String(value ?? '').trim();
  return s.length ? s : fallback;
}

/**
 * Normaliza um dataURL para PNG via:
 * fetch(dataURL) -> blob -> createImageBitmap -> canvas -> toDataURL(png)
 * (robusto e evita falhas do pipeline new Image()).
 */
async function normalizeToPngDataURL(sourceDataUrl: string): Promise<string> {
  assertBrowser();

  const res = await fetch(sourceDataUrl);
  const blob = await res.blob();

  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();

  return canvas.toDataURL('image/png');
}

/**
 * Gera QR Code localmente (sem internet) e devolve dataURL PNG.
 */
async function generateLocalQrPngDataURL(text: string): Promise<string> {
  assertBrowser();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  const QRCode = (await import('qrcode')).default;

  await QRCode.toCanvas(canvas, text, {
    width: 256,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return canvas.toDataURL('image/png');
}

/**
 * Converte a string "Competência 1. Competência 2. Competência 3."
 * em lista de itens (no mínimo 1, no máximo 5).
 */
function parseSkills(raw: string): string[] {
  const cleaned = String(raw ?? '').trim();
  if (!cleaned) return [];

  return cleaned
    .split('.')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

export const generateCertificate = async (
  user: User,
  book: Book,
  certCode: string,
  date: string
): Promise<void> => {
  try {
    assertBrowser();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Página A4 landscape: 297 x 210 mm
    const PAGE_W = 297;
    const PAGE_H = 210;

    // 1) FUNDO + MARCA D'ÁGUA
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

    doc.setTextColor(242, 242, 242);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(140);
    doc.text('ATIV', PAGE_W / 2, 120, { align: 'center', angle: 45 });

    // Moldura (cantos)
    doc.setDrawColor(245, 158, 11); // Âmbar ATIV
    doc.setLineWidth(1.5);
    doc.line(10, 10, 40, 10);
    doc.line(10, 10, 10, 40);
    doc.line(257, 200, 287, 200);
    doc.line(287, 170, 287, 200);

    // 2) CABEÇALHO
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ATIV BRASIL', PAGE_W / 2, 25, { align: 'center' });

    doc.setFontSize(18);
    doc.text('ACADEMIA DE TÁTICAS E INTELIGÊNCIA DE VIGILÂNCIA', PAGE_W / 2, 33, {
      align: 'center',
    });

    doc.setFontSize(34);
    doc.setTextColor(11, 13, 16);
    doc.text('CERTIFICADO DE APERFEIÇOAMENTO', PAGE_W / 2, 55, { align: 'center' });

    // 3) CORPO
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'CERTIFICAMOS, PARA OS DEVIDOS FINS DE COMPROVAÇÃO DE COMPETÊNCIA TÉCNICA, QUE',
      PAGE_W / 2,
      72,
      { align: 'center' }
    );

    // Nome
    doc.setFontSize(44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 13, 16);
    doc.text(safeText(user?.name, 'OPERADOR').toUpperCase(), PAGE_W / 2, 92, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(11, 13, 16);
    doc.text('CONCLUIU COM ÊXITO O CURSO DE APERFEIÇOAMENTO TÁTICO EM:', PAGE_W / 2, 108, {
      align: 'center',
    });

    // Curso
    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(book?.title, 'TREINAMENTO').toUpperCase(), PAGE_W / 2, 122, {
      align: 'center',
      maxWidth: 220,
    });

    // 4) EMENTA / COMPETÊNCIAS
    doc.setFillColor(248, 249, 251);
    doc.rect(30, 135, 237, 28, 'F');

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('EMENTA TÉCNICA E COMPETÊNCIAS AVALIADAS:', 35, 141);

    const rawSkills = safeText((book as any)?.technical_skills, 'Doutrina Operacional e Protocolos de Inteligência.');
    const skillsList = parseSkills(rawSkills);

    doc.setTextColor(11, 13, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);

    // Render em lista (3+ itens, separadas por ponto-final no cadastro)
    const startX = 35;
    let startY = 149;

    const items = skillsList.length ? skillsList : ['Doutrina Operacional e Protocolos de Inteligência'];

    items.slice(0, 5).forEach((item) => {
      doc.text(`• ${item}`.toUpperCase(), startX, startY, { maxWidth: 225 });
      startY += 5; // espaçamento entre linhas
    });

    // 5) “ASSINATURA DIGITAL” (sem imagem)
    // Linha
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(98, 178, 198, 178);

    // Nome do responsável
    doc.setFontSize(11);
    doc.setTextColor(11, 13, 16);
    doc.setFont('helvetica', 'bold');
    doc.text('TENENTE ALEX ANDREOLI DANTAS', PAGE_W / 2, 184, { align: 'center' });

    // Registro e título
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('RESPONSÁVEL PELA CERTIFICAÇÃO | RE: 953118-1', PAGE_W / 2, 189, { align: 'center' });

    // Carimbo de assinatura digital + vínculo com código
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`ASSINATURA DIGITAL • CÓDIGO: ${certCode}`, PAGE_W / 2, 194, { align: 'center' });

    // 6) QR CODE (URL pública de validação)
    const validationUrl = `https://arquivos.ativbrasil.com.br/validar?code=${encodeURIComponent(certCode)}`;

    const qrDataUrl = await generateLocalQrPngDataURL(validationUrl);
    const qrClean = await normalizeToPngDataURL(qrDataUrl);

    doc.addImage(qrClean, 'PNG', 20, 168, 28, 28);

    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('ESCANEIE PARA VALIDAR', 20, 166);

    doc.setFontSize(8);
    doc.setTextColor(11, 13, 16);
    doc.text(`ID: ${certCode}`, 20, 200);

    // Data de emissão (opcional)
    if (date) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`EMISSÃO: ${date}`, 287, 200, { align: 'right' });
    }

    // 7) FINALIZAÇÃO
    doc.save(`Certificado_ATIV_${certCode}.pdf`);
  } catch (err: any) {
    console.error('[CERTIFICATE_GENERATOR_ERROR]', err);
    throw new Error(`Falha ao gerar o certificado: ${err?.message || err}`);
  }
};
