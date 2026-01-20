import React, { useState } from 'react';
// CORREÇÃO: Adicionado Shield nas importações
import { CheckCircle2, AlertTriangle, ArrowRight, Award, XCircle, Loader2, Shield } from 'lucide-react';
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
  const questions = Array.isArray(rawData) ? rawData.map((item: any) => ({
    q: item.q || item.pergunta || "Questão sem texto",
    options: item.options || item.opcoes || [],
    correct: item.correct !== undefined ? item.correct : 
             (item.resposta_correta === 'A' ? 0 : 
              item.resposta_correta === 'B' ? 1 : 
              item.resposta_correta === 'C' ? 2 : 3)
  })) : [];

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
        <p className="text-text-muted text-[10px] mb-6">Este manual ainda não possui um questionário tático configurado no Comando.</p>
        <Button onClick={onClose} variant="secondary">Voltar ao Manual</Button>
      </div>
    );
  }

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      processResult(newAnswers);
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

    try {
      const certCode = passed ? `ATIV-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null;

      const { error: examError } = await supabase.from('user_exams').insert([{
        user_id: user.id,
        ebook_id: book.id,
        score: score,
        status: passed ? 'approved' : 'failed',
        cert_code: certCode
      }]);

      if (examError) throw examError;

      if (passed && certCode) {
        await supabase.from('messages').insert([{
          full_name: "SISTEMA DE INTELIGÊNCIA",
          email: user.email,
          subject: "ALERTA: NOVA CERTIFICAÇÃO EMITIDA",
          content: `O Operador ${user.name} conquistou o Certificado de Elite no manual "${book.title}". Nota: ${score}%. Código: ${certCode}.`
        }]);

        generateCertificate(user, book, certCode, new Date().toISOString());
      }

      setIsFinished(true);
    } catch (err) {
      console.error(err);
      alert("ERRO DE CONEXÃO: O resultado não pôde ser enviado ao banco.");
    } finally {
      setLoading(false);
    }
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
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tighter">Certificação Aprovada</h2>
            <p className="text-text-secondary text-xs italic">O Comando foi notificado. Seu certificado foi baixado.</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <XCircle size={32} />
            </div>
            <h2 className="text-xl font-display font-bold text-white uppercase tracking-tighter">Reprovado ({score}%)</h2>
            <p className="text-text-secondary text-xs">O padrão de elite exige 90%. Estude o manual novamente.</p>
          </>
        )}
        <Button onClick={onClose} variant="secondary">Retornar ao Acervo</Button>
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
            className="w-full text-left p-4 rounded-xl bg-black/40 border border-graphite-600 hover:border-amber-500 transition-all text-sm text-text-secondary hover:text-white flex items-center justify-between group"
          >
            <span>{option}</span>
            <ArrowRight size={16} className="text-graphite-600 group-hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all" />
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