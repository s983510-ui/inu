// 질문과, 문서에서 찾은 관련 부분을 받아서 gpt-4o-mini에게 답을 받아 와요.
import { callOpenAI, errorResponse } from "@/lib/openai";

type Source = { name: string; page: number; text: string };
type Turn = { role: "user" | "assistant"; content: string };

const MAX_QUESTION_LENGTH = 2000;
const MAX_SOURCES_LENGTH = 40000;
const MAX_HISTORY = 6;

const SYSTEM_PROMPT = `당신은 사용자가 올린 문서를 바탕으로 질문에 답하는 친절한 선생님입니다.

규칙:
1. 반드시 아래 [문서 내용]에 적힌 내용만 근거로 답하세요. 문서에 없는 사실을 지어내거나 바깥 지식으로 채우지 마세요.
2. 문서에서 답을 찾을 수 없으면 "문서에 없습니다."라고만 답하세요. 일부만 있으면 있는 부분만 답하고, 없는 부분은 "그 부분은 문서에 없습니다."라고 밝히세요.
3. 항상 존댓말 한국어로 답하세요.
4. 초보자도 이해할 수 있게 쉬운 말로 풀어서 설명하되, 질문과 관련된 내용은 문서에 있는 것을 빠뜨리지 말고 모두 담으세요. 항목이 여러 개면 번호를 붙여 정리하세요.
5. 답의 근거가 된 문서 이름과 쪽 번호를 문장 끝에 (문서이름 p.쪽) 형식으로 붙이세요.`;

export async function POST(request: Request) {
  const { question, sources, history } = await request.json();

  if (typeof question !== "string" || question.trim() === "") {
    return Response.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }
  if (!Array.isArray(sources) || sources.length === 0) {
    return Response.json({ error: "먼저 문서를 올려 주세요." }, { status: 400 });
  }

  let context = "";
  for (const s of sources as Source[]) {
    const block = `[${s.name} p.${s.page}]\n${s.text}\n\n`;
    if (context.length + block.length > MAX_SOURCES_LENGTH) break;
    context += block;
  }

  const pastTurns = (Array.isArray(history) ? (history as Turn[]) : [])
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_QUESTION_LENGTH) }));

  try {
    const data = await callOpenAI<{ choices: { message: { content: string } }[] }>(
      "chat/completions",
      {
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\n[문서 내용]\n${context}` },
          ...pastTurns,
          { role: "user", content: question.slice(0, MAX_QUESTION_LENGTH) },
        ],
      },
    );
    return Response.json({ answer: data.choices[0].message.content });
  } catch (error) {
    return errorResponse(error);
  }
}
