// PDF를 브라우저에서 읽는 데 필요한 pdf.js 파일들을 public/pdfjs 로 복사해요.
// npm run dev / npm run build 전에 자동으로 실행돼요.
import { cpSync, mkdirSync } from "node:fs";

const from = "node_modules/pdfjs-dist";
const to = "public/pdfjs";

mkdirSync(to, { recursive: true });
cpSync(`${from}/legacy/build/pdf.worker.min.mjs`, `${to}/pdf.worker.min.mjs`);
cpSync(`${from}/cmaps`, `${to}/cmaps`, { recursive: true });
cpSync(`${from}/standard_fonts`, `${to}/standard_fonts`, { recursive: true });
