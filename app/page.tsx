"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setReply("");
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        setReply(data.reply);
      } else {
        setError(data.error);
      }
    } catch {
      setError("서버에 연결하지 못했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-16">
      <h1 className="text-3xl font-bold">안녕하세요! 👋</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        궁금한 걸 적고 버튼을 누르면 AI가 대답해 줘요.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="예: 오늘 저녁 메뉴 추천해 줘"
          rows={4}
          className="rounded-lg border border-zinc-300 p-3 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={loading || message.trim() === ""}
          className="rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          {loading ? "생각하는 중..." : "물어보기"}
        </button>
      </form>

      {reply && (
        <div className="whitespace-pre-wrap rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
          {reply}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}
    </main>
  );
}
