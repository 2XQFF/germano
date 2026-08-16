"use client";

import { useEffect, useMemo, useState } from "react";
import WORD_DATA from "../dictionary-data.json";

type WordMode = "전체" | "명사" | "동사";
type ActiveView = "learn" | "dictionary";

type NounEntry = {
  type: "명사";
  ko: string[];
  german: string;
  article: "der" | "die" | "das";
  plural: string;
  note: string;
};

type VerbEntry = {
  type: "동사";
  ko: string[];
  german: string;
  past: string;
  participle: string;
  subjunctive2: string;
  note: string;
};

type WordEntry = NounEntry | VerbEntry;

const WORDS = WORD_DATA as WordEntry[];
const DAILY_GOAL = 8;

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findWords(query: string, mode: WordMode) {
  const normalized = normalize(query);
  return WORDS.filter((entry) => {
    const typeMatch = mode === "전체" || entry.type === mode;
    if (!normalized) return typeMatch;
    return typeMatch && (entry.ko.some((meaning) => meaning.includes(normalized)) || entry.german.toLowerCase().includes(normalized));
  });
}

function WordForms({ entry }: { entry: WordEntry }) {
  if (entry.type === "명사") {
    return (
      <dl className="forms-grid noun-forms">
        <div><dt>성</dt><dd>{entry.article}</dd></div>
        <div><dt>복수형</dt><dd>{entry.plural}</dd></div>
      </dl>
    );
  }

  return (
    <dl className="forms-grid">
      <div><dt>과거</dt><dd>{entry.past}</dd></div>
      <div><dt>과거분사</dt><dd>{entry.participle}</dd></div>
      <div><dt>접속법 2식</dt><dd>{entry.subjunctive2}</dd></div>
    </dl>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("learn");
  const [studyIndex, setStudyIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [wordQuery, setWordQuery] = useState("");
  const [wordMode, setWordMode] = useState<WordMode>("전체");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [selectedGerman, setSelectedGerman] = useState(WORDS[0].german);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const storedRecent = window.localStorage.getItem("deutsch-dictionary-recent");
    const storedLearned = window.localStorage.getItem("deutsch-learned-today");
    if (storedRecent) setRecentQueries(JSON.parse(storedRecent));
    if (storedLearned) setLearnedWords(JSON.parse(storedLearned));
  }, []);

  const wordResults = useMemo(() => findWords(wordQuery, wordMode), [wordQuery, wordMode]);
  const selectedWord = wordResults.find((entry) => entry.german === selectedGerman) ?? wordResults[0] ?? WORDS[0];
  const studyWord = WORDS[studyIndex % WORDS.length];
  const nounCount = WORDS.filter((word) => word.type === "명사").length;
  const verbCount = WORDS.filter((word) => word.type === "동사").length;
  const completedCount = Math.min(learnedWords.length, DAILY_GOAL);
  const progress = (completedCount / DAILY_GOAL) * 100;

  function runSearch(nextQuery: string) {
    setWordQuery(nextQuery);
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    const nextRecent = [cleanQuery, ...recentQueries.filter((query) => query !== cleanQuery)].slice(0, 6);
    setRecentQueries(nextRecent);
    window.localStorage.setItem("deutsch-dictionary-recent", JSON.stringify(nextRecent));
  }

  function moveToNextWord(markLearned: boolean) {
    if (markLearned && !learnedWords.includes(studyWord.german)) {
      const nextLearned = [...learnedWords, studyWord.german];
      setLearnedWords(nextLearned);
      window.localStorage.setItem("deutsch-learned-today", JSON.stringify(nextLearned));
    }

    setStudyIndex((index) => index + 1);
    setIsRevealed(false);
  }

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <button className="brand" onClick={() => setActiveView("learn")} type="button" aria-label="학습 홈으로 이동">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>WORTWEG</span>
        </button>

        <nav className="primary-nav" aria-label="주요 메뉴">
          <button className={activeView === "learn" ? "active" : ""} onClick={() => setActiveView("learn")} type="button">
            <span className="nav-dot learn-dot" aria-hidden="true" />학습
          </button>
          <button className={activeView === "dictionary" ? "active" : ""} onClick={() => setActiveView("dictionary")} type="button">
            <span className="nav-dot dictionary-dot" aria-hidden="true" />단어사전
          </button>
        </nav>

        <div className="rail-status">
          <p>오프라인 모드</p>
          <strong>내장 단어 {WORDS.length}개</strong>
          <span>인터넷 연결 없이 학습할 수 있어요.</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title"><span className="locale-chip">DE</span><p>독일어 단어 훈련</p></div>
          <div className="topbar-stats" aria-label="오늘의 학습 현황"><span>오늘 {completedCount}/{DAILY_GOAL}</span><span className="offline-dot">오프라인</span></div>
        </header>

        {activeView === "learn" ? (
          <section className="learn-view" aria-label="단어 학습">
            <div className="learn-heading">
              <div><p className="eyebrow">오늘의 단어</p><h1>한 단어씩, 확실하게.</h1></div>
              <div className="goal-progress" aria-label={`오늘의 목표 ${completedCount} / ${DAILY_GOAL}`}>
                <div className="progress-label"><span>오늘의 목표</span><strong>{completedCount}/{DAILY_GOAL}</strong></div>
                <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
              </div>
            </div>

            <section className="challenge-card">
              <div className="challenge-copy">
                <p className="prompt-label">이 뜻을 독일어로 말해보세요</p>
                <h2>{studyWord.ko[0]}</h2>
                {studyWord.ko.length > 1 && <p className="alternate-meaning">{studyWord.ko.slice(1).join(", ")}</p>}
              </div>
              <img className="guide-image" src="/blue-dragon-guide.png" alt="단어 학습을 돕는 파란 용" />

              {isRevealed ? (
                <div className="answer-area">
                  <div className="answer-word">
                    <span className={`type-chip ${studyWord.type === "명사" ? "noun" : "verb"}`}>{studyWord.type}</span>
                    <strong>{studyWord.type === "명사" ? `${studyWord.article} ${studyWord.german}` : studyWord.german}</strong>
                  </div>
                  <WordForms entry={studyWord} />
                  <p className="word-note">{studyWord.note}</p>
                  <div className="answer-actions">
                    <button className="secondary-button" onClick={() => moveToNextWord(false)} type="button">다시 보기</button>
                    <button className="primary-button" onClick={() => moveToNextWord(true)} type="button">알겠어요</button>
                  </div>
                </div>
              ) : <button className="primary-button reveal-button" onClick={() => setIsRevealed(true)} type="button">정답 보기</button>}
            </section>

            <section className="learn-footer" aria-label="학습 정보">
              <div><span>다음</span><strong>{WORDS[(studyIndex + 1) % WORDS.length].ko[0]}</strong></div>
              <div><span>명사</span><strong>{nounCount}개</strong></div>
              <div><span>동사</span><strong>{verbCount}개</strong></div>
            </section>
          </section>
        ) : (
          <section className="dictionary-view" aria-label="독일어 단어사전">
            <div className="dictionary-heading"><div><p className="eyebrow">내장 사전</p><h1>단어를 찾아보세요</h1></div><span>{WORDS.length}개 단어</span></div>
            <form className="dictionary-search" onSubmit={(event) => { event.preventDefault(); runSearch(wordQuery); }}>
              <label><span className="sr-only">검색어</span><input value={wordQuery} onChange={(event) => setWordQuery(event.target.value)} placeholder="한국어 뜻 또는 독일어 단어" /></label>
              <button className="primary-button" type="submit">검색</button>
            </form>

            <div className="filter-row" aria-label="품사 필터">
              {(["전체", "명사", "동사"] as const).map((mode) => (
                <button className={wordMode === mode ? "active" : ""} key={mode} onClick={() => setWordMode(mode)} type="button">
                  {mode} <span>{mode === "전체" ? WORDS.length : mode === "명사" ? nounCount : verbCount}</span>
                </button>
              ))}
            </div>

            {recentQueries.length > 0 && <div className="recent-row" aria-label="최근 검색"><span>최근 검색</span>{recentQueries.map((query) => <button key={query} onClick={() => setWordQuery(query)} type="button">{query}</button>)}</div>}

            <div className="dictionary-grid">
              <section className="result-list" aria-label="검색 결과">
                <div className="result-heading"><strong>검색 결과</strong><span>{wordResults.length}개</span></div>
                {wordResults.length > 0 ? wordResults.map((entry) => (
                  <button className={selectedWord.german === entry.german ? "word-row selected" : "word-row"} key={`${entry.type}-${entry.german}`} onClick={() => setSelectedGerman(entry.german)} type="button">
                    <span className={`type-chip ${entry.type === "명사" ? "noun" : "verb"}`}>{entry.type}</span>
                    <span><strong>{entry.type === "명사" ? `${entry.article} ${entry.german}` : entry.german}</strong><small>{entry.ko.join(", ")}</small></span>
                  </button>
                )) : <p className="empty-state">아직 이 단어는 내장 사전에 없습니다.</p>}
              </section>

              <article className="word-detail" aria-label="선택한 단어의 형태">
                <span className={`type-chip ${selectedWord.type === "명사" ? "noun" : "verb"}`}>{selectedWord.type}</span>
                <h2>{selectedWord.type === "명사" ? `${selectedWord.article} ${selectedWord.german}` : selectedWord.german}</h2>
                <p className="meaning">{selectedWord.ko.join(", ")}</p>
                <WordForms entry={selectedWord} />
                <p className="word-note">{selectedWord.note}</p>
              </article>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
