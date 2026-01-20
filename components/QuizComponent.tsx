import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight, Award, XCircle, Loader2 } from 'lucide-react';
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
  const questions = book.quiz_data || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(false);

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
    
    questions.forEach((q: any, index: number) => {
      if (q.correct === finalAnswers[index]) correctCount++;
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= 90; // Critério de Elite: 90%

    try {
      const certCode = passed ? `ATIV-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null;

      // 1. Gravação do Exame no Banco
      const { error: examError } = await supabase.from('user_exams').insert([{
        user_id: user.id,
        ebook_id: book.id,
        score: score,
        status: passed ? 'approved' : 'failed',
        cert_code: certCode
      }]);

      if (examError) throw examError;

      // 2. Reporte Automático ao Comando (Fase Delta)
      if (passed && certCode) {
        await supabase.from('messages').insert([{
          full_name: "SISTEMA DE INTELIGÊNCIA",
          email: user.email,
          subject: "ALERTA: NOVA CERTIFICAÇÃO EMITIDA",
          content: `O Operador ${user.name} conquistou o Certificado de Elite no manual "${book.title}". Nota: ${score}%. Código de Autenticidade: ${certCode}.`
        }]);

        // 3. Download do PDF para o Operador
        generateCertificate(user, book, certCode, new Date().toISOString());
      }

      setIsFinished(true);
    } catch (err) {
      console.error(err);
      alert("FALHA NA COMUNICAÇÃO: O reporte não pôde ser enviado ao Comando.");
    } finally {
      setLoading(false);
    }
  };

  if (isFinished) {
    const score = Math.round((answers.filter((a, i) => a === questions[i].correct).length / questions.length) * 100);
    const passed = score >= 90;

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fade-in">
        {passed ? (
          <>
            <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
              <Award size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">Certificação Aprovada</h2>
            <p className="text-text-secondary text-sm">O Comando foi notificado de sua conquista. Seu certificado foi baixado.</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tighter">Pontuação Insuficiente</h2>
            <p className="text-text-secondary text-sm">A nota {score}% está abaixo do padrão de elite (90%). Revise o protocolo e tente novamente.</p>
          </>
        )}
        <Button onClick={onClose} variant="secondary">Voltar ao Acervo</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full mx-auto p-6 space-y-8 animate-fade-in-up">
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
            className="w-full text-left p-4 rounded-xl bg-graphite-800 border border-graphite-700 hover:border-amber-500/50 hover:bg-graphite-700 transition-all flex items-center justify-between group"
          >
            <span className="text-sm text-text-secondary group-hover:text-text-primary">{option}</span>
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