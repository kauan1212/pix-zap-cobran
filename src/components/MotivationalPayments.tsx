import React from "react";

type Payment = {
  id: string;
  name: string;
  value: number;
  dueDate: string;
};

interface MotivationalPaymentsProps {
  payments: Payment[];
  phraseIndex?: number; // novo prop opcional
}

const motivationalPhrases = [
  "Cada desafio vencido é uma batalha conquistada no caminho dos seus sonhos. Não desista, pois a vitória é construída com esforço e fé.",
  "Sua garra hoje é o alicerce do seu amanhã. Persevere, pois grandes conquistas exigem coragem.",
  "Lutar pelos seus objetivos é sinal de força e determinação. Continue firme, pois cada passo te aproxima do seu sonho.",
  "Não importa o tamanho do desafio, sua vontade de vencer é maior. Siga com esperança e confiança.",
  "As dificuldades existem para provar o quanto você é capaz de superá-las. Enfrente tudo com fé e coragem.",
  "A cada esforço, você se aproxima ainda mais da sua liberdade e realizações.",
  "Persistência hoje, tranquilidade amanhã. Cada conquista é uma vitória pessoal.",
  "Acredite: sua determinação em seguir em frente é o que constrói o seu sucesso.",
  "O caminho pode ser difícil, mas sua força de vontade é maior. Continue avançando.",
  "Cada atitude positiva é uma semente plantada para um futuro de conquistas.",
  "A disciplina de hoje é a prosperidade de amanhã. Siga firme!",
  "Você é mais forte do que qualquer desafio. Um passo de cada vez, você chega lá.",
  "Não desanime! Cada superação é motivo de orgulho e crescimento.",
  "A vitória é feita de pequenos passos. Cada conquista é um deles.",
  "Continue com fé e coragem, pois todo esforço será recompensado.",
  "A cada vitória, celebre sua garra e determinação.",
  "O sucesso é a soma de pequenas conquistas diárias. Parabéns por mais uma!",
  "A jornada pode ser longa, mas sua persistência te levará ao topo.",
  "Confie no seu potencial. Você está mais perto do que imagina.",
  "A cada desafio superado, sua história de vitória se fortalece.",
];

function getMotivationalPhrase(index: number) {
  return motivationalPhrases[index % motivationalPhrases.length];
}

export const MotivationalPayments: React.FC<MotivationalPaymentsProps> = ({ payments, phraseIndex }) => {
  if (payments.length === 0) {
    return <div className="text-green-600 font-bold text-lg">Parabéns! Nenhum pagamento pendente. Deus é bom.</div>;
  }

  return (
    <div>
      {payments.map((payment, idx) => {
        const index = phraseIndex !== undefined ? phraseIndex : idx;
        return (
          <div
            key={payment.id}
            className="bg-yellow-100 border-l-4 border-yellow-500 p-4 my-4 rounded shadow"
          >
            <div className="italic text-gray-700 mb-1">
              {getMotivationalPhrase(index)}
            </div>
            <div className="text-right font-semibold text-green-700">Deus é bom.</div>
          </div>
        );
      })}
    </div>
  );
}; 