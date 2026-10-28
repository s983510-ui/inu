"use client";

// 챗봇 화면 구석에 사는 픽셀 게 캐릭터예요. (이 사이트를 위해 새로 그린 그림)
// 챗봇 상태(mood)에 따라 다른 동작을 하고, 오래 가만두면 잠들어요.
import { useEffect, useState } from "react";

export type CrabMood = "idle" | "reading" | "thinking" | "happy" | "error";

type Px = [x: number, y: number];
type Pixels = Px[];

// 20 x 14 칸짜리 도트 그림. [x, y] 좌표 목록이에요.
function rows(spec: Record<number, [from: number, to: number][]>): Pixels {
  const out: Pixels = [];
  for (const [y, spans] of Object.entries(spec)) {
    for (const [from, to] of spans) for (let x = from; x <= to; x++) out.push([x, Number(y)]);
  }
  return out;
}
const mirror = (pixels: Pixels): Pixels => pixels.map(([x, y]) => [19 - x, y]);

const BODY = rows({ 5: [[6, 13]], 6: [[5, 14]], 7: [[4, 15]], 8: [[4, 15]], 9: [[4, 15]], 10: [[5, 14]] });
const SHINE = rows({ 6: [[7, 8]], 7: [[6, 6]] });
const SHADOW = rows({ 10: [[6, 13]] });
const STALKS = rows({ 4: [[7, 7], [12, 12]] });
const EYE_FRAME = rows({
  0: [[6, 7], [12, 13]],
  1: [[5, 5], [8, 8], [11, 11], [14, 14]],
  2: [[5, 5], [8, 8], [11, 11], [14, 14]],
  3: [[6, 7], [12, 13]],
});
const EYES = rows({ 1: [[6, 7], [12, 13]], 2: [[6, 7], [12, 13]] });
const EYES_CLOSED = rows({ 2: [[6, 7], [12, 13]] });
const LEGS = rows({ 11: [[5, 5], [7, 7], [12, 12], [14, 14]], 12: [[4, 4], [6, 6], [13, 13], [15, 15]] });
const LEFT_CLAW = rows({ 3: [[0, 0], [2, 2]], 4: [[0, 2]], 5: [[1, 2]], 6: [[2, 2]], 7: [[3, 3]] });
const RIGHT_CLAW = mirror(LEFT_CLAW);
const BOOK = rows({ 8: [[7, 12]], 9: [[7, 12]], 10: [[7, 12]], 11: [[7, 12]] });
const BOOK_LINES = rows({ 9: [[8, 9], [11, 11]], 10: [[8, 8], [10, 11]] });

const MOUTHS: Record<CrabMood | "sleeping", Pixels> = {
  idle: rows({ 8: [[9, 10]] }),
  reading: [],
  thinking: rows({ 8: [[9, 10]], 9: [[9, 10]] }),
  happy: rows({ 8: [[8, 8], [11, 11]], 9: [[9, 10]] }),
  error: rows({ 9: [[8, 11]] }),
  sleeping: rows({ 9: [[9, 10]] }),
};

// 눈동자 위치: 상태마다 보는 방향이 달라요.
const PUPILS: Record<CrabMood, Pixels> = {
  idle: [[7, 2], [13, 2]],
  reading: [[6, 2], [12, 2]],
  thinking: [[7, 1], [13, 1]],
  happy: [[7, 2], [13, 2]],
  error: [[6, 1], [13, 1]],
};

const SPEECH: Record<CrabMood | "sleeping", string> = {
  idle: "문서를 올리고 질문해 보세요!",
  reading: "문서를 읽고 있어요...",
  thinking: "답을 찾는 중이에요...",
  happy: "답변 완료!",
  error: "앗, 문제가 생겼어요",
  sleeping: "쿨쿨...",
};

function Rects({ pixels, fill }: { pixels: Pixels; fill: string }) {
  return (
    <>
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />
      ))}
    </>
  );
}

const SLEEP_AFTER_MS = 45_000;

export default function PixelCrab({ mood, className = "" }: { mood: CrabMood; className?: string }) {
  const [sleeping, setSleeping] = useState(false);
  const [poked, setPoked] = useState(false);

  // 아무 조작이 없으면 잠들고, 마우스·키보드·터치가 있으면 깨어나요.
  useEffect(() => {
    let timer = window.setTimeout(() => setSleeping(true), SLEEP_AFTER_MS);
    const wake = () => {
      setSleeping(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setSleeping(true), SLEEP_AFTER_MS);
    };
    const events = ["pointermove", "pointerdown", "keydown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, []);

  useEffect(() => {
    if (!poked) return;
    const t = window.setTimeout(() => setPoked(false), 1200);
    return () => window.clearTimeout(t);
  }, [poked]);

  const isSleeping = sleeping && mood === "idle";
  const shown: CrabMood = poked && mood === "idle" ? "happy" : mood;
  const state = isSleeping ? "sleeping" : shown;
  const speech = poked && mood === "idle" ? "반가워요!" : SPEECH[state];

  return (
    <div className={`crab crab-${state} flex flex-col items-end gap-1 ${className}`}>
      <p className="crab-speech rounded-xl rounded-br-sm border border-brand-100 bg-white px-3 py-1.5 text-xs font-medium text-brand-800 shadow-sm" aria-live="polite">
        {speech}
      </p>
      <button
        type="button"
        onClick={() => setPoked(true)}
        className="crab-button relative h-[70px] w-[100px] cursor-pointer"
        aria-label="게 캐릭터 쓰다듬기"
      >
        {state === "thinking" && (
          <span className="crab-dots absolute -top-1 right-0 flex gap-1" aria-hidden>
            <i /><i /><i />
          </span>
        )}
        {state === "sleeping" && (
          <span className="crab-zzz absolute -top-2 right-1 text-xs font-bold text-brand-400" aria-hidden>
            Z<span className="text-[10px]">z</span>
          </span>
        )}
        <svg viewBox="0 0 20 14" shapeRendering="crispEdges" className="crab-svg h-full w-full overflow-visible" aria-hidden>
          <g className="crab-legs"><Rects pixels={LEGS} fill="var(--brand-800)" /></g>
          <g className="crab-body">
            <g className="crab-claw-left"><Rects pixels={LEFT_CLAW} fill="var(--brand-600)" /></g>
            <g className="crab-claw-right"><Rects pixels={RIGHT_CLAW} fill="var(--brand-600)" /></g>
            <Rects pixels={STALKS} fill="var(--brand-800)" />
            <Rects pixels={BODY} fill="var(--brand-600)" />
            <Rects pixels={SHADOW} fill="var(--brand-800)" />
            <Rects pixels={SHINE} fill="var(--brand-400)" />
            <g className="crab-eyes">
              <Rects pixels={EYE_FRAME} fill="var(--brand-800)" />
              {state === "sleeping" ? (
                <>
                  <Rects pixels={EYES} fill="var(--brand-600)" />
                  <Rects pixels={EYES_CLOSED} fill="var(--brand-950)" />
                </>
              ) : (
                <>
                  <Rects pixels={EYES} fill="#ffffff" />
                  <Rects pixels={PUPILS[shown]} fill="var(--brand-950)" />
                </>
              )}
            </g>
            <Rects pixels={MOUTHS[state]} fill="var(--brand-950)" />
            {state === "reading" && (
              <g className="crab-book">
                <Rects pixels={BOOK} fill="#ffffff" />
                <Rects pixels={BOOK_LINES} fill="var(--brand-400)" />
              </g>
            )}
            {state === "error" && <Rects pixels={[[16, 2], [16, 3]]} fill="var(--brand-400)" />}
          </g>
        </svg>
      </button>
    </div>
  );
}
