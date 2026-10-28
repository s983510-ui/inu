import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";

const profile = {
  name: "조인우",
  organization: "한국자산관리공사",
  tagline: "국유재산관리 실무자",
  duties: ["국유재산 관리1", "국유재산 관리2", "국유재산 관리3"],
  email: "s983510@gmail.com",
};

// public/logo.png 파일이 있을 때만 로고를 보여줘요.
const hasLogo = existsSync(path.join(process.cwd(), "public", "logo.png"));

const dutyIcons = [
  // 건물
  <svg key="building" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-5h6v5M9 10h.01M15 10h.01M9 13h.01M15 13h.01" />
  </svg>,
  // 서류
  <svg key="document" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>,
  // 지도 위치
  <svg key="map" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>,
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6 sm:py-16">
      {/* 1. 로고 */}
      {hasLogo && (
        <div className="flex justify-center">
          <Image src="/logo.png" alt={`${profile.organization} 로고`} width={160} height={64} className="h-12 w-auto sm:h-14" priority />
        </div>
      )}

      {/* 2. 명함 스타일 히어로 */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-7 text-white shadow-xl shadow-brand-800/20 sm:p-10">
        <div aria-hidden className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-600/40" />
        <div aria-hidden className="absolute -bottom-20 -right-4 h-40 w-40 rounded-full bg-brand-400/20" />
        <div className="relative">
          <p className="text-sm font-medium tracking-wide text-brand-100">{profile.organization}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{profile.name}</h1>
          <div className="mt-5 h-px w-12 bg-brand-400" />
          <p className="mt-5 text-lg text-brand-50 sm:text-xl">{profile.tagline}</p>
          <a href={`mailto:${profile.email}`} className="mt-6 inline-block text-sm text-brand-100 underline-offset-4 hover:underline">
            {profile.email}
          </a>
        </div>
      </section>

      {/* 3. 소개 */}
      <section>
        <h2 className="text-xl font-bold text-brand-950 sm:text-2xl">소개</h2>
        <p className="mt-4 text-base leading-8 text-muted sm:text-lg sm:leading-9">
          안녕하세요, {profile.organization}에서 국유재산관리 실무를 맡고 있는 {profile.name}입니다.
          현재 {profile.duties.join(", ")} 업무를 담당하고 있습니다.
          업무와 관련한 문의는 아래 이메일로 편하게 연락해 주세요.
        </p>
      </section>

      {/* 4. 담당 업무 카드 */}
      <section>
        <h2 className="text-xl font-bold text-brand-950 sm:text-2xl">담당 업무</h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-3">
          {profile.duties.map((duty, i) => (
            <li key={duty} className="flex items-center gap-4 rounded-xl border border-brand-100 bg-white p-5 shadow-sm sm:flex-col sm:items-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                {dutyIcons[i % dutyIcons.length]}
              </span>
              <span className="font-semibold text-ink">{duty}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 5. 연락처 */}
      <section className="rounded-2xl bg-brand-50 p-7 text-center sm:p-10">
        <h2 className="text-xl font-bold text-brand-950 sm:text-2xl">연락처</h2>
        <p className="mt-3 text-muted">궁금한 점이 있으면 이메일로 연락해 주세요.</p>
        <a
          href={`mailto:${profile.email}`}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-800 sm:w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
          이메일 보내기
        </a>
        <p className="mt-3 text-sm text-muted">{profile.email}</p>
      </section>

      <footer className="pb-4 text-center text-xs text-muted">
        © {profile.name}
      </footer>
    </main>
  );
}
