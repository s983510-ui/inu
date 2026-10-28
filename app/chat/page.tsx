import type { Metadata } from "next";
import ChatApp from "./chat-app";

export const metadata: Metadata = {
  title: "RAG 챗봇 | 조인우",
  description: "PDF 문서를 올리고, 문서 내용을 바탕으로 질문하는 챗봇",
};

export default function ChatPage() {
  return <ChatApp />;
}
