// 브라우저에서 PDF·워드 문서의 글자를 읽고, 잘게 나누고, 질문과 가까운 조각을 찾는 도구들이에요.

// loc: 문서 안의 위치 (PDF는 "p.3", 워드는 "부분 2")
export type Section = { loc: string; text: string };
export type Chunk = { docId: string; name: string; loc: string; text: string; embedding: number[] };

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;
const EMBED_BATCH = 64;
const DOCX_SECTION_SIZE = 2400;

export function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isDocx(file: File) {
  return file.name.toLowerCase().endsWith(".docx");
}

// PDF 파일에서 쪽마다 글자를 꺼내요. (pdf.js 사용, 설치 없이 브라우저 안에서 동작)
export async function readPdf(file: File): Promise<Section[]> {
  // legacy 빌드: 조금 오래된 브라우저(사내 PC, 삼성 인터넷 등)에서도 동작하는 버전이에요.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const task = pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
  const pdf = await task.promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : ""))
      .join("")
      .replace(/[ \t]+/g, " ")
      .trim();
    if (text) pages.push({ loc: `p.${i}`, text });
  }
  await task.destroy();
  return pages;
}

// 워드(.docx) 파일에서 글자를 꺼내요. 워드에는 쪽 번호 정보가 없어서
// 문단을 적당한 길이로 묶어 "부분 1", "부분 2"... 처럼 위치를 붙여요.
export async function readDocx(file: File): Promise<Section[]> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });

  const sections: Section[] = [];
  let current = "";
  for (const paragraph of value.split(/\n+/).map((p) => p.trim()).filter(Boolean)) {
    if (current && current.length + paragraph.length > DOCX_SECTION_SIZE) {
      sections.push({ loc: `부분 ${sections.length + 1}`, text: current });
      current = "";
    }
    current += (current ? "\n" : "") + paragraph;
  }
  if (current) sections.push({ loc: `부분 ${sections.length + 1}`, text: current });
  return sections;
}

// 긴 글을 앞뒤가 조금씩 겹치는 작은 조각으로 나눠요.
export function splitIntoChunks(name: string, sections: Section[]) {
  const chunks: Omit<Chunk, "docId" | "embedding">[] = [];
  for (const { loc, text } of sections) {
    for (let start = 0; start < text.length; start += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push({ name, loc, text: text.slice(start, start + CHUNK_SIZE) });
      if (start + CHUNK_SIZE >= text.length) break;
    }
  }
  return chunks;
}

// 서버(/api/embed)에 글을 보내 임베딩(숫자 목록)을 받아요.
export async function embed(texts: string[]): Promise<number[][]> {
  const result: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const res = await fetch("/api/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: texts.slice(i, i + EMBED_BATCH) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "임베딩 요청에 실패했어요.");
    result.push(...data.embeddings);
  }
  return result;
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// 질문과 가장 가까운 조각을 고르고, 문서·쪽 순서대로 정리해요.
// 문서 전체가 짧으면 빠뜨리는 내용이 없도록 전부 보내요.
export function pickRelevant(chunks: Chunk[], questionEmbedding: number[], topK = 20) {
  const totalLength = chunks.reduce((sum, c) => sum + c.text.length, 0);
  const picked =
    totalLength <= 20000
      ? chunks
      : chunks
          .map((c) => ({ c, score: cosine(c.embedding, questionEmbedding) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK)
          .map(({ c }) => c);
  return [...picked].sort((a, b) => chunks.indexOf(a) - chunks.indexOf(b));
}
