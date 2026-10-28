// 문서 조각(또는 질문)을 숫자 목록(임베딩)으로 바꿔 줘요.
// 숫자가 비슷한 조각일수록 뜻이 비슷해서, 질문과 관련 있는 부분을 찾을 때 써요.
import { callOpenAI, errorResponse } from "@/lib/openai";

const MAX_TEXTS = 100;
const MAX_TEXT_LENGTH = 2000;

export async function POST(request: Request) {
  const { texts } = await request.json();
  if (
    !Array.isArray(texts) ||
    texts.length === 0 ||
    texts.length > MAX_TEXTS ||
    !texts.every((t) => typeof t === "string" && t.trim() !== "")
  ) {
    return Response.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  try {
    const data = await callOpenAI<{ data: { index: number; embedding: number[] }[] }>(
      "embeddings",
      {
        model: "text-embedding-3-small",
        input: texts.map((t: string) => t.slice(0, MAX_TEXT_LENGTH)),
      },
    );
    const embeddings = data.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
    return Response.json({ embeddings });
  } catch (error) {
    return errorResponse(error);
  }
}
