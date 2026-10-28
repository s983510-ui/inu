// OpenAI API를 부르는 서버 전용 도우미예요.
// API 키는 여기(서버)에서만 읽기 때문에 화면(브라우저)에는 절대 전달되지 않아요.
import "server-only";

export class OpenAIError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function callOpenAI<T>(endpoint: string, body: unknown): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new OpenAIError("OPENAI_API_KEY 환경변수가 설정되지 않았어요.", 500);
  }

  const res = await fetch(`https://api.openai.com/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new OpenAIError(data.error?.message ?? "OpenAI 요청에 실패했어요.", res.status);
  }
  return data as T;
}

export function errorResponse(error: unknown) {
  if (error instanceof OpenAIError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "서버에서 오류가 났어요." }, { status: 500 });
}
