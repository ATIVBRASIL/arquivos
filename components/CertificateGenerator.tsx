import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

// ASSINATURA REAL - TENENTE ALEX ANDREOLI DANTAS (PNG BASE64)
const SIGNATURE_BASE64 =
  "data:image/png;base64,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";

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
 *
 * Isso evita completamente o caminho "new Image()" que está falhando com img.onerror.
 */
async function normalizeToPngDataURL(sourceDataUrl: string): Promise<string> {
  assertBrowser();

  // Converte dataURL em blob
  const res = await fetch(sourceDataUrl);
  const blob = await res.blob();

  // Decodifica com pipeline mais robusto do browser
  const bitmap = await createImageBitmap(blob);

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  // Importante: fecha o bitmap para liberar memória
  bitmap.close?.();

  return canvas.toDataURL('image/png');
}

/**
 * Gera QR Code localmente e devolve dataURL PNG.
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

    // 1) FUNDO + MARCA D'ÁGUA
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');

    doc.setTextColor(242, 242, 242);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(140);
    doc.text('ATIV', 148.5, 120, { align: 'center', angle: 45 });

    // Moldura
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.line(10, 10, 40, 10);
    doc.line(10, 10, 10, 40);
    doc.line(257, 200, 287, 200);
    doc.line(287, 170, 287, 200);

    // 2) CABEÇALHO
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.text('ATIV BRASIL', 148.5, 25, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ACADEMIA DE TÁTICAS E INTELIGÊNCIA DE VIGILÂNCIA', 148.5, 33, { align: 'center' });

    doc.setFontSize(34);
    doc.setTextColor(11, 13, 16);
    doc.text('CERTIFICADO DE APERFEIÇOAMENTO', 148.5, 55, { align: 'center' });

    // 3) CORPO
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'CERTIFICAMOS, PARA OS DEVIDOS FINS DE COMPROVAÇÃO DE COMPETÊNCIA TÉCNICA, QUE',
      148.5,
      72,
      { align: 'center' }
    );

    doc.setFontSize(44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 13, 16);
    doc.text(safeText(user?.name, 'OPERADOR').toUpperCase(), 148.5, 92, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('CONCLUIU COM ÊXITO O CURSO DE APERFEIÇOAMENTO TÁTICO EM:', 148.5, 108, {
      align: 'center',
    });

    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(book?.title, 'TREINAMENTO').toUpperCase(), 148.5, 122, {
      align: 'center',
      maxWidth: 220,
    });

    // 4) EMENTA
    doc.setFillColor(248, 249, 251);
    doc.rect(30, 135, 237, 20, 'F');

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('EMENTA TÉCNICA E COMPETÊNCIAS AVALIADAS:', 35, 140);

    const skills = safeText((book as any)?.technical_skills, 'Doutrina Operacional e Protocolos de Inteligência');
    doc.setTextColor(11, 13, 16);
    doc.setFont('helvetica', 'bold');
    doc.text(skills.toUpperCase(), 35, 149, { maxWidth: 225 });

    // 5) ASSINATURA (NORMALIZAÇÃO ROBUSTA)
    if (SIGNATURE_BASE64 && SIGNATURE_BASE64.length > 50) {
      const signatureClean = await normalizeToPngDataURL(SIGNATURE_BASE64);
      doc.addImage(signatureClean, 'PNG', 118, 153, 60, 25);
    }

    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(98, 178, 198, 178);

    doc.setFontSize(11);
    doc.setTextColor(11, 13, 16);
    doc.setFont('helvetica', 'bold');
    doc.text('TENENTE ALEX ANDREOLI DANTAS', 148.5, 184, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('DIRETOR DE INSTRUÇÃO E TÁTICA | RE: 953118-1', 148.5, 189, { align: 'center' });

    // 6) QR CODE LOCAL (SEM INTERNET)
    const qrText = `ATIV-VALID-${certCode}`;
    const qrDataUrl = await generateLocalQrPngDataURL(qrText);

    // Aqui a normalização é opcional, mas mantemos por consistência
    const qrClean = await normalizeToPngDataURL(qrDataUrl);
    doc.addImage(qrClean, 'PNG', 20, 168, 28, 28);

    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text('ESCANEIE PARA VALIDAR', 20, 166);

    doc.setFontSize(8);
    doc.setTextColor(11, 13, 16);
    doc.text(`ID: ${certCode}`, 20, 200);

    // Data
    if (date) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`EMISSÃO: ${date}`, 277, 200, { align: 'right' });
    }

    // 7) FINALIZAÇÃO
    doc.save(`Certificado_ATIV_${certCode}.pdf`);
  } catch (err: any) {
    console.error('[CERTIFICATE_GENERATOR_ERROR]', err);
    throw new Error(`Falha ao gerar o certificado: ${err?.message || err}`);
  }
};
