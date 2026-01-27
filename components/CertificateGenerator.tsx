import { jsPDF } from 'jspdf';
import QRCode from 'qrcode'; // Importação estática para garantir disponibilidade offline
import { User, Book } from '../types';

const DEBUG_CERT = true;
const DISABLE_QR = false;

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
 * Função crítica: Normaliza qualquer DataURL ou URL de imagem para PNG puro via Canvas.
 * Isso evita erros de compressão interna do jsPDF e garante transparência.
 */
async function normalizeToPngDataURL(sourceDataUrl: string): Promise<string> {
  assertBrowser();

  const res = await fetch(sourceDataUrl);
  if (!res.ok) throw new Error(`Falha ao ler dataURL via fetch: ${res.status}`);

  const blob = await res.blob();

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch (e: any) {
    throw new Error(`Falha ao decodificar imagem (createImageBitmap): ${e?.message || e}`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  // Fecha o bitmap para liberar memória
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }

  return canvas.toDataURL('image/png');
}

async function generateLocalQrPngDataURL(text: string): Promise<string> {
  assertBrowser();

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;

  // Geração do QR Code com nível médio de correção
  await QRCode.toCanvas(canvas, text, {
    width: 256,
    margin: 1,
    errorCorrectionLevel: 'M',
  });

  return canvas.toDataURL('image/png');
}

function formatPtBRDateTime(isoOrAny: string): string {
  const d = new Date(isoOrAny);
  if (Number.isNaN(d.getTime())) return safeText(isoOrAny, '');
  return d.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * MOTOR DE GERAÇÃO DO CERTIFICADO - ARSENAL ATIV
 */
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

    // ===== 1) FUNDO + MARCA D'ÁGUA ATUALIZADA (ARETÉ) =====
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');

    // Marca d'água atualizada para ARETÉ conforme nova diretriz
    doc.setTextColor(242, 242, 242);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(130); // Ajuste leve para acomodar o texto ARETÉ
    doc.text('ARETÉ', 148.5, 120, { align: 'center', angle: 45 });

    // Moldura Operacional Âmbar
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.5);
    doc.line(10, 10, 40, 10);
    doc.line(10, 10, 10, 40);
    doc.line(257, 200, 287, 200);
    doc.line(287, 170, 287, 200);

    // ===== 2) CABEÇALHO COM LOGO OFICIAL =====
    
    // Inserção da heráldica oficial centralizada
    try {
      const logoData = await normalizeToPngDataURL('/logo_ativ.png');
      doc.addImage(logoData, 'PNG', 148.5 - 15, 12, 30, 30);
    } catch (e) {
      console.warn('[CERT] Falha ao carregar logo oficial, usando backup textual.', e);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('ATIV BRASIL', 148.5, 25, { align: 'center' });
    }

    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    // Texto do cabeçalho posicionado abaixo da logo
    doc.text('ACADEMIA DE TÁTICAS E INTELIGÊNCIA DE VIGILÂNCIA', 148.5, 48, { align: 'center' });

    doc.setFontSize(32);
    doc.setTextColor(11, 13, 16);
    doc.text('CERTIFICADO DE APERFEIÇOAMENTO', 148.5, 62, { align: 'center' });

    // ===== 3) CORPO DO CERTIFICADO =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      'CERTIFICAMOS, PARA OS DEVIDOS FINS DE COMPROVAÇÃO DE COMPETÊNCIA TÉCNICA, QUE',
      148.5,
      75,
      { align: 'center' }
    );

    doc.setFontSize(44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 13, 16);
    doc.text(safeText(user?.name, 'AGENTE').toUpperCase(), 148.5, 95, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('CONCLUIU COM ÊXITO O CURSO DE APERFEIÇOAMENTO TÁTICO EM:', 148.5, 110, {
      align: 'center',
    });

    doc.setFontSize(22);
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(safeText(book?.title, 'INSTRUÇÃO TÉCNICA').toUpperCase(), 148.5, 125, {
      align: 'center',
      maxWidth: 220,
    });

    // ===== 4) EMENTA TÉCNICA E COMPETÊNCIAS =====
    doc.setFillColor(248, 249, 251);
    doc.rect(30, 138, 237, 22, 'F');

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('EMENTA TÉCNICA E COMPETÊNCIAS AVALIADAS:', 35, 144);

    const skills = safeText((book as any)?.technical_skills, 'Ementa não especificada.');
    doc.setTextColor(11, 13, 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(skills, 35, 152, { maxWidth: 225 });

    // ===== 5) ASSINATURA E VALIDAÇÃO DIGITAL =====
    const emittedAt = formatPtBRDateTime(date);
    const signatureLabel = `VALIDAÇÃO DIGITAL · CÓDIGO: ${certCode}${emittedAt ? ` · ${emittedAt}` : ''}`;

    const lineY = 180;
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.5);
    doc.line(98, lineY, 198, lineY);

    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    const textWidth = doc.getTextWidth(signatureLabel);
    const padding = 2.5;
    const boxW = Math.min(textWidth + padding * 2, 110);
    const boxH = 5.2;

    doc.setFillColor(255, 255, 255);
    doc.rect(148.5 - boxW / 2, lineY - boxH / 2, boxW, boxH, 'F');

    doc.setTextColor(40, 40, 40);
    doc.text(signatureLabel, 148.5, lineY + 1.2, { align: 'center', maxWidth: 180 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(11, 13, 16);
    doc.text('TENENTE ALEX ANDREOLI DANTAS', 148.5, 187, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text('RESPONSÁVEL PELA CERTIFICAÇÃO | RE: 953118-1', 148.5, 192, { align: 'center' });

    // ===== 6) QR CODE DE AUTENTICIDADE =====
    if (!DISABLE_QR) {
      const validateUrl = `https://arsenal.ativbrasil.com.br/validar?code=${encodeURIComponent(certCode)}`;

      if (DEBUG_CERT) console.log('[CERT] URL de Validação:', validateUrl);

      const qrDataUrl = await generateLocalQrPngDataURL(validateUrl);
      const qrClean = await normalizeToPngDataURL(qrDataUrl);

      doc.addImage(qrClean, 'PNG', 20, 168, 28, 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(120, 120, 120);
      doc.text(validateUrl, 20, 199, { maxWidth: 80 });
    }

    // ===== 7) FINALIZAÇÃO E DOWNLOAD =====
    doc.save(`Certificado_ATIV_${certCode}.pdf`);
    if (DEBUG_CERT) console.log('[CERT] Emissão concluída com sucesso.');

  } catch (err: any) {
    console.error('[CERTIFICATE_GENERATOR_ERROR]', err);
    throw new Error(`Erro na operação de emissão: ${err?.message || err}`);
  }
};