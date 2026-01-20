import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Award, XCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '../src/lib/supabase';
import { Book, User } from '../types';
import { Button } from './Button';
import { generateCertificate } from './CertificateGenerator';

interface QuizComponentProps {
  book: Book;
  user: User;
  onClose: () => void;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({ book, user, onClose }) => {
  // --- PROTOCOLO DE SEGURANÇA (ANTI-CRASH) ---
  const rawData = book.quiz_data || [];

  // Mapeamento dinâmico para aceitar tanto 'q' quanto 'pergunta' do JSON
  const questions = Array.isArray(rawData)
    ? rawData.map((item: any) => ({
        q: item.q || item.pergunta || 'Questão sem texto',
        options: item.options || item.opcoes || [],
        correct:
          item.correct !== undefined
            ? item.correct
            : item.resposta_correta === 'A'
              ? 0
              : item.resposta_correta === 'B'
                ? 1
                : item.resposta_correta === 'C'
                  ? 2
                  : 3,
      }))
    : [];

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);

  // Trava de segurança: Se não houver perguntas, exibe aviso em vez de tela preta
  if (questions.length === 0) {
    return (
      <div className="p-8 text-center bg-graphite-800 rounded-2xl border border-amber-500/30 animate-fade-in">
        <AlertTriangle className="text-amber-500 mx-auto mb-4" size={48} />
        <h3 className="text-white font-bold uppercase mb-2 text-sm">Dados não localizados</h3>
        <p className="text-text-muted text-[10px] mb-6">
          Este manual ainda não possui um questionário tático configurado no Comando.
        </p>
        <Button onClick={onClose} variant="secondary">
          Voltar ao Manual
        </Button>
      </div>
    );
  }

  const handleAnswer = (optionIndex: number) => {
    if (loading) return; // evita clique durante sincronização

    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      void processResult(newAnswers);
    }
  };

  const processResult = async (finalAnswers: number[]) => {
    setLoading(true);

    let correctCount = 0;
    questions.forEach((q, index) => {
      if (q.correct === finalAnswers[index]) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 90;

    const certCode = passed
      ? `ATIV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      : null;

    // 1) Sempre grava o exame no banco (fonte da verdade)
    try {
      const { error: examError } = await supabase.from('user_exams').insert([
        {
          user_id: user.id,
          ebook_id: book.id,
          score: score,
          status: passed ? 'approved' : 'failed',
          cert_code: certCode,
        },
      ]);

      if (examError) throw examError;
    } catch (err) {
      console.error('[USER_EXAMS_INSERT_ERROR]', err);
      alert('ERRO: não foi possível registrar seu resultado no banco. Tente novamente.');
      setLoading(false);
      return;
    }

    // 2) Se aprovado, notifica e tenta gerar o certificado (sem impedir o exame já gravado)
    if (passed && certCode) {
      // 2.1 Notifica o comando (não bloqueia certificado se falhar)
      try {
        const { error: msgError } = await supabase.from('messages').insert([
          {
            full_name: 'SISTEMA DE INTELIGÊNCIA',
            email: user.email,
            subject: 'ALERTA: NOVA CERTIFICAÇÃO EMITIDA',
            content: `O Operador ${user.name} conquistou o Certificado de Elite no manual "${book.title}". Nota: ${score}%. Código: ${certCode}.`,
          },
        ]);

        if (msgError) throw msgError;
      } catch (err) {
        console.error('[MESSAGES_INSERT_ERROR]', err);
        // não interrompe
      }

      // 2.2 Gera certificado (agora com await, para capturar erro real)
      try {
        await generateCertificate(user, book, certCode, new Date().toISOString());
      } catch (err) {
        console.error('[CERTIFICATE_GENERATION_ERROR]', err);
        alert(
          'Seu exame foi aprovado e registrado, porém o certificado falhou ao gerar no navegador. ' +
            'Tente novamente ou me envie o erro do Console.'
        );
      }
    }

    setIsFinished(true);
    setLoading(false);
  };

  if (isFinished) {
    const correctCount = answers.filter((a, i) => a === questions[i].correct).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 90;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in bg-graphite-800 rounded-2xl border border-graphite-700">
        {passed ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-glow">
              <Award size={32} />
            </div>
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tighter">
              Certificação Aprovada
            </h2>
            <p className="text-text-secondary text-xs italic">
              O Comando foi notificado. Se o PDF não baixou, verifique o bloqueador de pop-up/download.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tighter">
              Reprovado ({score}%)
            </h2>
            <p className="text-text-secondary text-xs">O padrão de elite exige 90%. Estude o manual novamente.</p>
          </>
        )}
        <Button onClick={onClose} variant="secondary">
          Retornar ao Acervo
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto p-6 space-y-8 animate-fade-in-up bg-graphite-800 rounded-2xl border border-graphite-700 shadow-2xl">
      <div className="flex items-center justify-between border-b border-graphite-700 pb-4">
        <div className="flex items-center gap-2 text-amber-500 font-black text-[10px] uppercase">
          <Shield size={14} /> Questão {currentStep + 1} de {questions.length}
        </div>
        <div className="h-1.5 w-32 bg-graphite-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-lg md:text-xl font-bold text-text-primary leading-tight">
        {questions[currentStep].q}
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {questions[currentStep].options.map((option: string, index: number) => (
          <button
            key={index}
            disabled={loading}
            onClick={() => handleAnswer(index)}
            className="w-full text-left p-4 rounded-xl bg-black/40 border border-graphite-600 hover:border-amber-500 transition-all text-sm text-text-secondary hover:text-white flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{option}</span>
            <ArrowRight
              size={16}
              className="text-graphite-600 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all"
            />
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-amber-500 text-[10px] font-bold uppercase italic animate-pulse">
          <Loader2 size={14} className="animate-spin" /> Sincronizando com o Comando...
        </div>
      )}
    </div>
  );
};
