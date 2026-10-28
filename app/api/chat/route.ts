// 브라우저가 보낸 질문을 받아서 OpenAI에 대신 물어보고, 답을 돌려주는 서버 코드예요.
// API 키는 서버에서만 읽기 때문에 방문자에게 노출되지 않아요.
export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY 환경변수가 설정되지 않았어요." },
      { status: 500 },
    );
  }

  const { message } = await request.json();
  if (typeof message !== "string" || message.trim() === "") {
    return Response.json({ error: "질문을 입력해 주세요." }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      messages: [{ role: "user", content: message.slice(0, 2000) }],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return Response.json(
      { error: data.error?.message ?? "OpenAI 요청에 실패했어요." },
      { status: res.status },
    );
  }

  return Response.json({ reply: data.choices[0].message.content });
}
