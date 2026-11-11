import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI instance server-side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Helper to sanitize JSON response from Gemini
function cleanAndParseJSON<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error('Failed to parse JSON from AI output:', err, rawText);
    return fallback;
  }
}

// 1. Endpoint: Gerar Material de Estudo Estruturado
app.post('/api/ai/material', async (req: Request, res: Response) => {
  try {
    const { topic, depth = 'detalhado', focusArea = 'geral' } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'O tópico de estudo é obrigatório.' });
    }

    const systemPrompt = `Você é um professor renomado e designer instrucional sênior do Cognitio Studio.
Sua missão é produzir um material de estudo completo, de altíssimo rigor conceitual, didático e acionável em língua Portuguesa.
Você deve responder ESTRITAMENTE em formato JSON compatível com o schema definido.`;

    const userPrompt = `Gere um material de estudo aprofundado sobre o tema: "${topic}".
Nível de profundidade desejado: ${depth}.
Foco ou objetivo: ${focusArea}.

O JSON deve conter:
- title: Título elegante e instigante do material
- topic: Nome canônico do assunto
- overview: Resumo executivo de alto impacto (2 a 3 parágrafos claros)
- keyPoints: Array de 4 a 6 pontos essenciais, cada um com 'title' e 'explanation'
- mnemonics: Array de 2 a 3 analogias mentais ou mnemônicos poderosos para retenção duradoura
- comparisonTable: Objeto com 'headers' (array de strings) e 'rows' (array de arrays de strings) contrastando conceitos vitais do tema
- fixationQuestions: Array de 3 a 5 perguntas rápidas de verificação ativa com respostas curtas
- practicalApplication: Exemplo real de aplicação prática ou caso clínico/técnico
- nextStudyTopics: Array de 3 a 4 tópicos recomendados para aprofundar`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJSON(response.text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Falha ao processar material estruturado.' });
    }

    return res.json({ success: true, material: parsed });
  } catch (error: any) {
    console.error('Error generating material:', error);
    return res.status(500).json({
      error: error?.message || 'Erro interno ao conectar ao motor de IA.',
    });
  }
});

// 2. Endpoint: Gerar Simulado Inteligente (Quiz / Exam)
app.post('/api/ai/quiz', async (req: Request, res: Response) => {
  try {
    const {
      topic,
      sourceContent,
      questionCount = 5,
      difficulty = 'intermediario',
      questionType = 'mixed', // 'multiple_choice' | 'open_ended' | 'mixed'
    } = req.body;

    if (!topic && !sourceContent) {
      return res.status(400).json({ error: 'Forneça um tópico ou conteúdo de referência para o simulado.' });
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 2), 12);

    const systemPrompt = `Você é o examinador-chefe do Cognitio Studio, especialista em criar questões diagnósticas e avaliativas de alto padrão (nível concursos, vestibulares de ponta e certificações técnicas).
Crie questões desafiadoras, sem ambiguidades, com distratores inteligentes que testem a real compreensão do aluno e evitem memorização rasa.
Sua resposta deve ser ESTRITAMENTE em formato JSON.`;

    const userPrompt = `Crie um simulado de ${count} questões sobre o tópico: "${topic || 'Conteúdo Fornecido'}".
${sourceContent ? `Conteúdo base de referência:\n${sourceContent.slice(0, 3000)}\n` : ''}
Nível de dificuldade: ${difficulty} (iniciante, intermediario ou avancado).
Formato preferido: ${questionType}.

Estrutura JSON esperada:
{
  "title": "Título do Simulado",
  "topic": "${topic || 'Geral'}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice", // ou "open_ended"
      "prompt": "Enunciado claro e contextualizado da questão",
      "options": [
        { "id": "A", "text": "Texto da alternativa A", "isCorrect": false, "explanation": "Por que esta alternativa está incorreta" },
        { "id": "B", "text": "Texto da alternativa B", "isCorrect": true, "explanation": "Por que esta alternativa é a correta com justificativa lógica" },
        { "id": "C", "text": "Texto da alternativa C", "isCorrect": false, "explanation": "Por que esta alternativa é um distrator" },
        { "id": "D", "text": "Texto da alternativa D", "isCorrect": false, "explanation": "Por que esta alternativa está incorreta" }
      ],
      "correctOptionId": "B",
      "generalExplanation": "Explicação completa e aprofundada do conceito central abordado nesta questão.",
      "keyConcepts": ["Conceito 1", "Conceito 2"]
    }
  ]
}
Para questões do tipo "open_ended", options pode ser vazio, e inclua um campo "sampleModelAnswer" e "rubricKeyPoints" (array de critérios essenciais para pontuação cheia).`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJSON(response.text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Falha ao estruturar questões do simulado.' });
    }

    return res.json({ success: true, quiz: parsed });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return res.status(500).json({
      error: error?.message || 'Erro ao gerar simulado com IA.',
    });
  }
});

// 3. Endpoint: Avaliar Resposta Discursiva do Aluno (Correção Pedagógica)
app.post('/api/ai/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { questionPrompt, studentAnswer, rubricKeyPoints, sampleModelAnswer } = req.body;

    if (!questionPrompt || !studentAnswer) {
      return res.status(400).json({ error: 'Pergunta e resposta do aluno são obrigatórias.' });
    }

    const systemPrompt = `Você é um avaliador pedagógico rigoroso, empático e de alta precisão técnica do Cognitio Studio.
Você analisa a resposta dada por um estudante para uma questão discursiva, detectando acertos, omissões cruciais, imprecisões técnicas e equívocos conceituais.
Responda ESTRITAMENTE em formato JSON.`;

    const userPrompt = `Questão:
"${questionPrompt}"

${sampleModelAnswer ? `Resposta Modelo de Referência:\n"${sampleModelAnswer}"\n` : ''}
${rubricKeyPoints && rubricKeyPoints.length ? `Pontos essenciais esperados:\n- ${rubricKeyPoints.join('\n- ')}\n` : ''}

Resposta fornecida pelo aluno:
"${studentAnswer}"

Avalie a resposta e retorne o JSON no seguinte formato:
{
  "score": 85, // número de 0 a 100
  "verdict": "Excelente" | "Bom, com pequenas lacunas" | "Parcialmente correto" | "Insuficiente ou incorreto",
  "generalFeedback": "Análise global construtiva e encorajadora do raciocínio apresentado.",
  "strengths": ["Ponto forte 1 identificado", "Ponto forte 2"],
  "gapsOrMisconceptions": ["Conceito que faltou explicar com precisão", "Ponto impreciso"],
  "modelAnswerComparison": "Como esta resposta se compara com a melhor resposta teórica possível.",
  "suggestedReviewFocus": "O tópico exato que o aluno deve reler para fechar a lacuna."
}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJSON(response.text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Falha ao avaliar resposta.' });
    }

    return res.json({ success: true, evaluation: parsed });
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    return res.status(500).json({
      error: error?.message || 'Erro ao avaliar resposta com IA.',
    });
  }
});

// 4. Endpoint: Gerar Flashcards de Evocação Ativa
app.post('/api/ai/flashcards', async (req: Request, res: Response) => {
  try {
    const { topic, sourceText, count = 8, difficulty = 'misto' } = req.body;

    if (!topic && !sourceText) {
      return res.status(400).json({ error: 'Informe um tópico ou texto base para os flashcards.' });
    }

    const cardCount = Math.min(Math.max(Number(count) || 8, 3), 20);

    const systemPrompt = `Você é um especialista em Active Recall e Spaced Repetition (SRS) do Cognitio Studio.
Seus flashcards devem seguir os princípios de formulação de conhecimento do SuperMemo:
1. Princípio da atomicidade (uma pergunta clara, uma resposta concisa e inequívoca).
2. Sem perguntas vagas. Evite textos quilométricos no verso; vá direto ao cerne conceitual com dicas mnemônicas quando cabível.
Responda ESTRITAMENTE em formato JSON.`;

    const userPrompt = `Gere ${cardCount} flashcards de alta qualidade sobre: "${topic || 'Conteúdo Fornecido'}".
${sourceText ? `Texto base de referência:\n${sourceText.slice(0, 3000)}\n` : ''}
Nível de profundidade: ${difficulty}.

Formato JSON esperado:
{
  "deckTitle": "Título do Baralho",
  "topic": "${topic || 'Geral'}",
  "cards": [
    {
      "id": "c1",
      "front": "Pergunta de evocação ativa ou conceito a definir",
      "back": "Resposta clara, direta e objetiva com o fundamento essencial",
      "category": "Subtópico ou Tag",
      "difficulty": "easy" | "medium" | "hard",
      "mnemonicHint": "Dica mnemônica opcional para ajudar na retenção"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJSON(response.text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Falha ao gerar flashcards.' });
    }

    return res.json({ success: true, deck: parsed });
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return res.status(500).json({
      error: error?.message || 'Erro ao gerar flashcards com IA.',
    });
  }
});

// 5. Endpoint: Tutor Cognitivo / Chat Pedagógico
app.post('/api/ai/explain', async (req: Request, res: Response) => {
  try {
    const {
      persona = 'feynman', // 'feynman' | 'socratic' | 'academic'
      messages = [],
      topicContext = '',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Histórico de mensagens é obrigatório.' });
    }

    let personaInstruction = '';
    if (persona === 'feynman') {
      personaInstruction = `Você é o tutor no Método Richard Feynman do Cognitio Studio.
Sua regra de ouro: explique conceitos complexos usando analogias da vida real, linguagem cristalina e sem jargões desnecessários, como se estivesse explicando para alguém curioso de 12 anos. Quando identificar uma abstração complexa, desmonte-a em peças simples. Conclua incentivando o aluno a dar seu próprio exemplo.`;
    } else if (persona === 'socratic') {
      personaInstruction = `Você é o Professor Socrático do Cognitio Studio.
Você NUNCA entrega a resposta pronta de imediato. Em vez disso, você faz perguntas provocativas e reflexivas que conduzem o estudante a descobrir a resposta por si mesmo passo a passo. Faça perguntas indutivas, elogie insights corretos e aponte contradições lógicas amigavelmente.`;
    } else {
      personaInstruction = `Você é o Especialista Acadêmico e Científico do Cognitio Studio.
Forneça explicações de rigor técnico impecável, com definições formais, mecanismos moleculares/algorítmicos/jurídicos precisos, terminologia especializada e referências a padrões e convenções reconhecidas.`;
    }

    const systemPrompt = `${personaInstruction}
${topicContext ? `\nContexto da sessão de estudos atual do aluno: ${topicContext}\n` : ''}
Mantenha o tom profissional, focado no fluxo cognitivo e motivador. Formate com markdown elegante (tópicos com marcadores, código ou fórmulas se necessário).
No final de cada resposta, inclua uma seção breve chamada "**💡 Perguntas para testar seu entendimento:**" com 2 perguntas curtas e instigantes.`;

    // Construct conversation string for generateContent
    const formattedHistory = messages
      .map((m: any) => `${m.role === 'user' ? 'Aluno' : 'Tutor Cognitio'}: ${m.content}`)
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: formattedHistory,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const reply = response.text || 'Não consegui formular uma explicação no momento. Tente novamente.';
    return res.json({ success: true, reply });
  } catch (error: any) {
    console.error('Error in AI tutor explain:', error);
    return res.status(500).json({
      error: error?.message || 'Erro ao consultar o tutor cognitivo.',
    });
  }
});

// 6. Endpoint: Diagnóstico e Recomendações de Revisão Espaçada
app.post('/api/ai/recommendations', async (req: Request, res: Response) => {
  try {
    const { performanceHistory } = req.body;

    const systemPrompt = `Você é o diretor de inteligência pedagógica do Cognitio Studio.
Analise os dados de desempenho, taxas de acerto e histórico de simulados/cards do aluno e crie um plano de ação diagnóstico de alta eficiência para potencializar a retenção e sanar pontos fracos.
Responda ESTRITAMENTE em formato JSON.`;

    const userPrompt = `Histórico e métricas do aluno:
${JSON.stringify(performanceHistory || {}, null, 2)}

Gere um diagnóstico personalizado em JSON:
{
  "diagnosticSummary": "Resumo clínico-pedagógico do estágio atual do aluno (2 frases diretas)",
  "retentionScoreEstimate": 78, // Estimativa percentual de retenção geral
  "weakestTopics": [
    {
      "topic": "Nome do tópico com falha",
      "reason": "Por que o aluno tem errado ou precisa de atenção imediata",
      "recommendedAction": "Ação concreta (ex: fazer 5 flashcards ou rever resumo)",
      "urgency": "alta" | "media" | "baixa"
    }
  ],
  "strongTopics": ["Tópico dominado 1", "Tópico dominado 2"],
  "todayActionPlan": [
    {
      "task": "Descrição da tarefa",
      "timeMinutes": 15,
      "type": "simulado" | "flashcards" | "resumo" | "tutor"
    }
  ],
  "motivationalCognitiveTip": "Uma dica científica sobre memorização ativa ou descanso produtivo."
}`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const parsed = cleanAndParseJSON(response.text, null);
    if (!parsed) {
      return res.status(500).json({ error: 'Falha ao processar recomendações diagnósticas.' });
    }

    return res.json({ success: true, recommendations: parsed });
  } catch (error: any) {
    console.error('Error in recommendations:', error);
    return res.status(500).json({
      error: error?.message || 'Erro ao gerar recomendações diagnósticas.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cognitio Studio server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
