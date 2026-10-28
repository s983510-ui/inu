"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PixelCrab, { type CrabMood } from "@/components/pixel-crab";
import { embed, isDocx, isPdf, pickRelevant, readDocx, readPdf, splitIntoChunks, type Chunk } from "@/lib/rag";

type Doc = { id: string; name: string; status: "reading" | "ready" | "error"; detail: string };
type Message = { role: "user" | "assistant"; content: string; refs?: string[]; error?: boolean };

export default function ChatApp() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [flash, setFlash] = useState<{ mood: CrabMood; at: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const readyCount = docs.filter((d) => d.status === "ready").length;
  const busy = docs.some((d) => d.status === "reading");
  const crabMood: CrabMood = asking ? "thinking" : busy ? "reading" : flash ? flash.mood : "idle";

  // 답변 완료·오류 같은 순간 반응은 잠깐만 보여주고 다시 기본 상태로 돌아가요.
  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 3000);
    return () => window.clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, asking]);

  function updateDoc(id: string, patch: Partial<Doc>) {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      setDocs((prev) => [...prev, { id, name: file.name, status: "reading", detail: "글자를 읽는 중..." }]);

      try {
        let sections;
        if (isPdf(file)) {
          sections = await readPdf(file);
          if (sections.length === 0) {
            throw new Error("글자를 찾지 못했어요. 스캔한 이미지 PDF는 읽을 수 없어요.");
          }
        } else if (isDocx(file)) {
          sections = await readDocx(file);
          if (sections.length === 0) throw new Error("문서에서 글자를 찾지 못했어요.");
        } else if (file.name.toLowerCase().endsWith(".doc")) {
          throw new Error("옛날 워드 형식(.doc)은 읽을 수 없어요. 워드에서 .docx로 다시 저장해 올려 주세요.");
        } else {
          throw new Error("PDF 또는 워드(.docx) 파일만 올릴 수 있어요.");
        }
        const pieces = splitIntoChunks(file.name, sections);
        updateDoc(id, { detail: "내용을 정리하는 중..." });
        const embeddings = await embed(pieces.map((p) => p.text));
        setChunks((prev) => [...prev, ...pieces.map((p, i) => ({ ...p, docId: id, embedding: embeddings[i] }))]);
        setFlash({ mood: "happy", at: Date.now() });
        updateDoc(id, {
          status: "ready",
          detail: `문서 준비 완료 · ${isPdf(file) ? `${sections.length}쪽` : `${sections.length}부분`}`,
        });
      } catch (error) {
        setFlash({ mood: "error", at: Date.now() });
        updateDoc(id, {
          status: "error",
          detail: error instanceof Error ? error.message : "문서를 읽지 못했어요.",
        });
      }
    }
  }

  function removeDoc(doc: Doc) {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setChunks((prev) => prev.filter((c) => c.docId !== doc.id));
  }

  async function handleAsk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = question.trim();
    if (!q || asking || chunks.length === 0) return;

    const history = messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setAsking(true);

    try {
      const [questionEmbedding] = await embed([q]);
      const sources = pickRelevant(chunks, questionEmbedding).map(({ name, loc, text }) => ({ name, loc, text }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, sources, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "답변을 받지 못했어요.");
      const refs = [...new Set(sources.map((s) => `${s.name} ${s.loc}`))];
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, refs }]);
      setFlash({ mood: "happy", at: Date.now() });
    } catch (error) {
      setFlash({ mood: "error", at: Date.now() });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "답변을 받지 못했어요.",
          error: true,
        },
      ]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex items-center justify-between gap-3">
        <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
          프로필로
        </Link>
      </header>

      <section className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-6 text-white shadow-lg shadow-brand-800/20 sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">RAG 챗봇</h1>
        <div className="mt-3 h-0.5 w-10 bg-accent" />
        <p className="mt-3 text-sm leading-6 text-brand-100 sm:text-base">
          PDF나 워드 문서를 올리고 질문하면, 올린 문서의 내용만 바탕으로 답해 드려요.
        </p>
      </section>

      {/* 픽셀 게: 좁은 화면에서는 위쪽, 넓은 PC 화면에서는 오른쪽 아래 구석에 있어요 */}
      <PixelCrab mood={crabMood} className="-mt-2 lg:fixed lg:bottom-6 lg:right-6 lg:z-10 lg:mt-0" />

      {/* 문서 올리기 */}
      <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">1. 문서 올리기</h2>
        <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-brand-400/60 bg-brand-50 px-4 py-8 text-center transition-colors hover:border-brand-600 hover:bg-brand-100/60">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-brand-600" aria-hidden>
            <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
          </svg>
          <span className="font-semibold text-brand-800">PDF · 워드 파일 선택</span>
          <span className="text-sm text-muted">PDF, 워드(.docx) 파일을 여러 개 한 번에 올려도 돼요</span>
          <input
            type="file"
            accept="application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="sr-only"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {docs.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 rounded-lg bg-brand-50 px-4 py-3">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    doc.status === "ready" ? "bg-success" : doc.status === "error" ? "bg-accent" : "animate-pulse bg-brand-400"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{doc.name}</p>
                  <p className={`text-xs ${doc.status === "error" ? "text-accent" : doc.status === "ready" ? "text-success" : "text-muted"}`}>
                    {doc.detail}
                  </p>
                </div>
                {doc.status !== "reading" && (
                  <button type="button" onClick={() => removeDoc(doc)} className="text-xs text-muted hover:text-accent" aria-label={`${doc.name} 빼기`}>
                    빼기
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 대화 */}
      <section className="flex flex-col rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold text-brand-950">2. 질문하기</h2>

        <div className="mt-4 flex min-h-48 flex-col gap-3">
          {messages.length === 0 && !asking && (
            <p className="m-auto text-center text-sm leading-6 text-muted">
              {readyCount > 0 ? "문서에 대해 궁금한 점을 물어보세요." : "먼저 위에서 PDF나 워드 문서를 올려 주세요."}
            </p>
          )}
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="max-w-[85%] self-end whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-600 px-4 py-3 text-white">
                {m.content}
              </div>
            ) : (
              <div
                key={i}
                className={`max-w-[92%] self-start rounded-2xl rounded-bl-sm px-4 py-3 ${
                  m.error ? "bg-error-bg text-accent" : "bg-brand-50 text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap leading-7">{m.content}</p>
                {m.refs && m.refs.length > 0 && (
                  <details className="mt-2 text-xs text-muted">
                    <summary className="cursor-pointer">참고한 부분 {m.refs.length}곳</summary>
                    <p className="mt-1 leading-5">{m.refs.join(", ")}</p>
                  </details>
                )}
              </div>
            ),
          )}
          {asking && (
            <div className="self-start rounded-2xl rounded-bl-sm bg-brand-50 px-4 py-3 text-muted">
              문서를 살펴보는 중...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="mt-5 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={readyCount > 0 ? "질문을 입력하세요" : "문서를 먼저 올려 주세요"}
            disabled={readyCount === 0}
            maxLength={2000}
            className="min-w-0 flex-1 rounded-full border border-brand-100 bg-brand-50 px-4 py-3 outline-none focus:border-brand-600 focus:bg-white disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={asking || busy || readyCount === 0 || question.trim() === ""}
            className="shrink-0 rounded-full bg-brand-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-40"
          >
            보내기
          </button>
        </form>
        {busy && <p className="mt-2 text-xs text-muted">문서를 준비하는 동안 잠시만 기다려 주세요.</p>}
      </section>
    </main>
  );
}
