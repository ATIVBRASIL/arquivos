import { jsPDF } from 'jspdf';
import { User, Book } from '../types';

// ASSINATURA REAL - TENENTE ALEX ANDREOLI DANTAS
const SIGNATURE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAD6CAYAAAB9LTkQAAAAtGVYSWZJSSoACAAAAAYAEgEDAAEAAAABAAAAGgEFAAEAAABWAAAAGwEFAAEAAABeAAAAKAEDAAEAAAACAAAAEwIDAAEAAAABAAAAaYcEAAEAAABmAAAAAAAAAC8ZAQDoAwAALxkBAOgDAAAGAACQBwAEAAAAMDIxMAGRBwAEAAAAAQIDAACgBwAEAAAAMDEwMAGgAwABAAAA//8AAAKgBAABAAAAWAIAAAOgBAABAAAA+gAAAAAAAAAmiyMGAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAE02lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI2LTAxLTIwPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dExtZD4zZGJjYmEyNC1lODQ4LTQ5MTgtOTI1Zi0xYzZmYTg5NWJlYTQ8L0F0dHJpYjpFeHRJZD4KICAgICA8QXR0cmliOkZiSWQ+NTI1MjY1OTE0MTc5NTgwPC9BdHRyaWI6RmJJZD4KICAgICA8QXR0cmliOlRvdWNoVHlwZT4yPC9BdHRyaWI6VG91Y2hUeXBlPjIKICAgIDwvcmRmOmxpPgogICA8L3JkZjpTZXE+CiAgPC9BdHRyaWI6QWRzPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpkaWM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjp saSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5BbGV4IEFuZHJlb2xpIERhbnRhcyAtIDE8L3JkZjp saT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNjcmlwdGlvbj4KPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KPD94cGFja2V0IGVuZD0ncid/Pg==';

type ImgFormat = 'PNG' | 'JPEG';

function assertBrowser() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('CertificateGenerator deve rodar no navegador (window/document ausentes).');
  }
}

function dataUrlToFormat(dataUrl: string): ImgFormat {
  const head = dataUrl.slice(0, 30).toLowerCase();
  if (head.includes('image/jpeg') || head.includes('image/jpg')) return 'JPEG';
  return 'PNG';
}

async function fetchAsDataURL(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Falha ao baixar imagem (HTTP ${res.status})`);
  const blob = await res.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao converter blob em base64.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

/**
 * Normaliza uma imagem (dataURL) via Canvas, re-exportando como PNG.
 * Isso remove metadados/segments que frequentemente causam CRC mismatch no jsPDF.
 */
async function normalizeToPngDataURL(sourceDataUrl: string): Promise<string> {
  assertBrowser();

  return await new Promise<string>((resolve, reject) => {
    const img = new Image();
    // Para dataURL, CORS não é problema. Para eventual URL remota convertida em dataURL, também não.
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D indisponível.');

        // fundo transparente mantido
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const clean = canvas.toDataURL('image/png');
        resolve(clean);
      } catch (e: any) {
        reject(new Error(`Falha ao normalizar imagem via canvas: ${e?.message || e}`));
      }
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem para normalização (img.onerror).'));
    img.src = sourceDataUrl;
  });
}

function safeText(value: unknown, fallback: string) {
  const s = String(value ?? '').trim();
  return s.length ? s : fallback;
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

    // 1) FUNDO
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');

    // MARCA D'ÁGUA (sem opacity)
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

    // 4) EMENTA / COMPETÊNCIAS
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

    // 5) ASSINATURA (NORMALIZADA VIA CANVAS)
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

    // 6) QR CODE (FETCH -> DATAURL -> NORMALIZA -> ADDIMAGE)
    // Observação: forçamos format=png na API e tratamos como PNG.
    const qrData = encodeURIComponent(`ATIV-VALID-${certCode}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&format=png&data=${qrData}`;

    const qrDataUrl = await fetchAsDataURL(qrUrl);
    const qrClean = await normalizeToPngDataURL(qrDataUrl);

    doc.addImage(qrClean, 'PNG', 20, 168, 28, 28);

    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text('ESCANEIE PARA VALIDAR', 20, 166);

    doc.setFontSize(8);
    doc.setTextColor(11, 13, 16);
    doc.text(`ID: ${certCode}`, 20, 200);

    // 7) DATA (opcional, mas útil)
    if (date) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`EMISSÃO: ${date}`, 277, 200, { align: 'right' });
    }

    // 8) FINALIZA
    doc.save(`Certificado_ATIV_${certCode}.pdf`);
  } catch (err: any) {
    // Erro claro para você (e também para o console)
    console.error('[CERTIFICATE_GENERATOR_ERROR]', err);
    throw new Error(`Falha ao gerar o certificado: ${err?.message || err}`);
  }
};
