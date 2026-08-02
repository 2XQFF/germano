"use client";

import { useEffect, useMemo, useState } from "react";

type WordMode = "전체" | "명사" | "동사";

type NounEntry = {
  type: "명사";
  ko: string[];
  german: string;
  article: "der" | "die" | "das";
  plural: string;
  example: string;
  note: string;
};

type VerbEntry = {
  type: "동사";
  ko: string[];
  german: string;
  past: string;
  participle: string;
  subjunctive2: string;
  example: string;
  note: string;
};

type WordEntry = NounEntry | VerbEntry;

const WORDS: WordEntry[] = [
  { type: "명사", ko: ["책", "도서"], german: "Buch", article: "das", plural: "Bücher", example: "Ich lese ein Buch.", note: "중성 명사이며 복수에서 움라우트가 생깁니다." },
  { type: "명사", ko: ["학교"], german: "Schule", article: "die", plural: "Schulen", example: "Die Schule beginnt um acht Uhr.", note: "-e로 끝나는 여성 명사는 복수 -n이 자주 붙습니다." },
  { type: "명사", ko: ["친구", "남자 친구"], german: "Freund", article: "der", plural: "Freunde", example: "Mein Freund kommt heute.", note: "여자 친구는 die Freundin, 복수는 Freundinnen입니다." },
  { type: "명사", ko: ["시간", "시각"], german: "Zeit", article: "die", plural: "Zeiten", example: "Ich habe keine Zeit.", note: "추상명사로 관용 표현에 자주 쓰입니다." },
  { type: "명사", ko: ["집", "가정"], german: "Haus", article: "das", plural: "Häuser", example: "Das Haus ist alt.", note: "복수형에서 au가 äu로 바뀝니다." },
  { type: "명사", ko: ["사람", "인간"], german: "Mensch", article: "der", plural: "Menschen", example: "Der Mensch lernt jeden Tag.", note: "약변화 명사라 여러 격에서 -en을 확인해야 합니다." },
  { type: "명사", ko: ["도시"], german: "Stadt", article: "die", plural: "Städte", example: "Berlin ist eine große Stadt.", note: "복수형에서 a가 ä로 바뀝니다." },
  { type: "명사", ko: ["언어", "말"], german: "Sprache", article: "die", plural: "Sprachen", example: "Deutsch ist eine schöne Sprache.", note: "여성 명사이며 복수는 -n입니다." },
  { type: "명사", ko: ["문장"], german: "Satz", article: "der", plural: "Sätze", example: "Der Satz ist richtig.", note: "복수형에서 a가 ä로 바뀝니다." },
  { type: "명사", ko: ["시험"], german: "Prüfung", article: "die", plural: "Prüfungen", example: "Die Prüfung ist morgen.", note: "-ung 명사는 거의 항상 여성입니다." },
  { type: "동사", ko: ["가다"], german: "gehen", past: "ging", participle: "ist gegangen", subjunctive2: "ginge", example: "Ich gehe zur Schule.", note: "이동 동사라 완료형에서 sein을 씁니다." },
  { type: "동사", ko: ["오다"], german: "kommen", past: "kam", participle: "ist gekommen", subjunctive2: "käme", example: "Er kommt aus Korea.", note: "불규칙 동사이며 접속법 2식에 움라우트가 생깁니다." },
  { type: "동사", ko: ["보다"], german: "sehen", past: "sah", participle: "hat gesehen", subjunctive2: "sähe", example: "Wir sehen einen Film.", note: "sehen + 4격 목적어 구조를 자주 확인하세요." },
  { type: "동사", ko: ["읽다"], german: "lesen", past: "las", participle: "hat gelesen", subjunctive2: "läse", example: "Sie liest ein Buch.", note: "du liest, er/sie/es liest처럼 현재형 어간 변화가 있습니다." },
  { type: "동사", ko: ["쓰다"], german: "schreiben", past: "schrieb", participle: "hat geschrieben", subjunctive2: "schriebe", example: "Ich schreibe einen Brief.", note: "강변화 동사지만 완료형 조동사는 haben입니다." },
  { type: "동사", ko: ["먹다"], german: "essen", past: "aß", participle: "hat gegessen", subjunctive2: "äße", example: "Wir essen zusammen.", note: "du isst, er/sie/es isst 형태를 함께 익히면 좋습니다." },
  { type: "동사", ko: ["마시다"], german: "trinken", past: "trank", participle: "hat getrunken", subjunctive2: "tränke", example: "Ich trinke Wasser.", note: "불규칙 변화: i-a-u 계열입니다." },
  { type: "동사", ko: ["하다", "만들다"], german: "machen", past: "machte", participle: "hat gemacht", subjunctive2: "machte", example: "Was machst du?", note: "규칙 동사라 과거와 접속법 2식 형태가 같습니다." },
  { type: "동사", ko: ["생각하다"], german: "denken", past: "dachte", participle: "hat gedacht", subjunctive2: "dächte", example: "Ich denke an dich.", note: "혼합변화 동사입니다." },
  { type: "동사", ko: ["알다", "지식으로 알다"], german: "wissen", past: "wusste", participle: "hat gewusst", subjunctive2: "wüsste", example: "Ich weiß die Antwort.", note: "kennen은 사람/장소를 안다는 뜻에 더 가깝습니다." },
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findWords(query: string, mode: WordMode) {
  const normalized = normalize(query);

  return WORDS.filter((entry) => {
    const typeMatch = mode === "전체" || entry.type === mode;
    if (!normalized) return typeMatch;

    const koMatch = entry.ko.some((meaning) => meaning.includes(normalized));
    const deMatch = entry.german.toLowerCase().includes(normalized);
    return typeMatch && (koMatch || deMatch);
  });
}

export default function Home() {
  const [wordQuery, setWordQuery] = useState("책");
  const [wordMode, setWordMode] = useState<WordMode>("전체");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const stored = window.localStorage.getItem("deutsch-dictionary-recent");
    if (stored) setRecentQueries(JSON.parse(stored));
  }, []);

  const wordResults = useMemo(() => findWords(wordQuery, wordMode), [wordQuery, wordMode]);
  const selectedWord = wordResults[0] ?? WORDS[0];
  const nounCount = WORDS.filter((word) => word.type === "명사").length;
  const verbCount = WORDS.filter((word) => word.type === "동사").length;

  function runSearch(nextQuery: string) {
    setWordQuery(nextQuery);
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    const nextRecent = [cleanQuery, ...recentQueries.filter((query) => query !== cleanQuery)].slice(0, 6);
    setRecentQueries(nextRecent);
    window.localStorage.setItem("deutsch-dictionary-recent", JSON.stringify(nextRecent));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Offline Deutsch Trainer</p>
          <h1>오프라인 단어사전</h1>
        </div>
        <div className="header-meta" aria-label="사전 상태">
          <span>명사 {nounCount}개</span>
          <span>동사 {verbCount}개</span>
          <span>인터넷 불필요</span>
        </div>
      </header>

      <section className="dictionary-shell">
        <aside className="dictionary-sidebar">
          <div className="sidebar-section">
            <p className="section-kicker">품사</p>
            <div className="mode-list" aria-label="품사 필터">
              {(["전체", "명사", "동사"] as const).map((mode) => (
                <button className={wordMode === mode ? "active" : ""} key={mode} onClick={() => setWordMode(mode)} type="button">
                  <span>{mode}</span>
                  <strong>{mode === "전체" ? WORDS.length : WORDS.filter((word) => word.type === mode).length}</strong>
                </button>
              ))}
            </div>
          </div>

          {recentQueries.length > 0 && (
            <div className="sidebar-section">
              <p className="section-kicker">최근 검색</p>
              <div className="recent-list">
                {recentQueries.map((query) => (
                  <button key={query} onClick={() => setWordQuery(query)} type="button">
                    {query}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="dictionary-main">
          <div className="search-panel">
            <div>
              <p className="section-kicker">검색</p>
              <h2>한국어 뜻이나 독일어 단어를 입력하세요</h2>
            </div>
            <label className="search-field">
              <span>검색어</span>
              <input
                value={wordQuery}
                onBlur={(event) => runSearch(event.target.value)}
                onChange={(event) => setWordQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") runSearch(event.currentTarget.value);
                }}
                placeholder="예: 책, 가다, Schule"
              />
            </label>
          </div>

          <div className="dictionary-content">
            <section className="result-list" aria-label="검색 결과">
              <div className="result-heading">
                <strong>검색 결과</strong>
                <span>{wordResults.length}개</span>
              </div>

              {wordResults.length > 0 ? (
                wordResults.map((entry) => (
                  <button className="word-row" key={`${entry.type}-${entry.german}`} onClick={() => runSearch(entry.ko[0])} type="button">
                    <span className={`badge ${entry.type === "명사" ? "noun" : "verb"}`}>{entry.type}</span>
                    <strong>{entry.type === "명사" ? `${entry.article} ${entry.german}` : entry.german}</strong>
                    <small>{entry.ko.join(", ")}</small>
                  </button>
                ))
              ) : (
                <div className="empty-state">
                  아직 내장 사전에 없는 항목입니다. 명사는 성과 복수형, 동사는 과거-과거분사-접속법 2식을 확인해 추가하면 됩니다.
                </div>
              )}
            </section>

            <article className="detail-card" aria-label="선택 단어 상세">
              <div className="detail-topline">
                <span className={`badge ${selectedWord.type === "명사" ? "noun" : "verb"}`}>{selectedWord.type}</span>
                <div>
                  <h2>{selectedWord.type === "명사" ? `${selectedWord.article} ${selectedWord.german}` : selectedWord.german}</h2>
                  <p>{selectedWord.ko.join(", ")}</p>
                </div>
              </div>

              {selectedWord.type === "명사" ? (
                <dl className="forms-grid">
                  <div><dt>성</dt><dd>{selectedWord.article}</dd></div>
                  <div><dt>복수형</dt><dd>{selectedWord.plural}</dd></div>
                </dl>
              ) : (
                <dl className="forms-grid">
                  <div><dt>과거</dt><dd>{selectedWord.past}</dd></div>
                  <div><dt>과거분사</dt><dd>{selectedWord.participle}</dd></div>
                  <div><dt>접속법 2식</dt><dd>{selectedWord.subjunctive2}</dd></div>
                </dl>
              )}

              <div className="example-block">
                <span>예문</span>
                <p>{selectedWord.example}</p>
              </div>
              <p className="note">{selectedWord.note}</p>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
