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

type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  words: string[];
};

type SentencePrompt = {
  ko: string;
  de: string;
};

type ExerciseKind = "ko-de" | "de-ko" | "type-de" | "article" | "plural" | "past" | "participle" | "write-de" | "translate-ko";

type Exercise = {
  kind: ExerciseKind;
  prompt: string;
  expected: string;
  choices?: string[];
  entry?: WordEntry;
};

const WORDS = WORD_DATA as WordEntry[];
const DAILY_GOAL = 8;

const LESSONS: Lesson[] = [
  { id: "daily", title: "일상어", subtitle: "시간과 가장 가까운 단어", words: ["Buch", "Schule", "Freund", "Familie", "Zeit", "Tag", "Woche", "Name"] },
  { id: "food", title: "음식", subtitle: "먹고 마시고 주문하기", words: ["Wasser", "Brot", "Apfel", "Essen", "Kaffee", "Tee", "essen", "trinken", "kochen", "bestellen", "bezahlen"] },
  { id: "nature", title: "자연물", subtitle: "날씨와 풍경 말하기", words: ["Wetter", "Sonne", "Regen", "Meer", "Berg", "Wald", "Nacht", "laufen", "sehen"] },
  { id: "travel", title: "이동과 여행", subtitle: "도시에서 공항까지", words: ["Stadt", "Bahnhof", "Zug", "Auto", "Straße", "Flughafen", "gehen", "kommen", "fahren", "ankommen", "aussteigen", "einsteigen", "fliegen", "reisen"] },
  { id: "people", title: "사람과 대화", subtitle: "소개하고 묻고 답하기", words: ["Lehrer", "Frau", "Mann", "Mutter", "Vater", "Sprache", "Frage", "Antwort", "sprechen", "fragen", "antworten", "heißen"] },
  { id: "home", title: "집과 공간", subtitle: "물건과 위치 설명하기", words: ["Haus", "Zimmer", "Tisch", "Fenster", "Tür", "Kopf", "Herz", "öffnen", "schließen", "sitzen", "stehen", "liegen"] },
  { id: "shopping", title: "쇼핑과 취미", subtitle: "원하고 고르고 사기", words: ["Markt", "Supermarkt", "Geld", "Karte", "Kleidung", "Hemd", "Jacke", "Schuh", "Hobby", "kaufen", "verkaufen", "wählen", "lieben", "mögen"] },
  { id: "verbs", title: "핵심 동사", subtitle: "문장을 만드는 필수 변화", words: ["sein", "haben", "werden", "können", "müssen", "dürfen", "wollen", "sollen", "lesen", "schreiben", "finden", "nehmen", "geben", "vergessen"] },
];

const LESSON_SENTENCES: Record<string, SentencePrompt> = {
  daily: { ko: "나는 학교에 간다.", de: "Ich gehe zur Schule." },
  food: { ko: "우리는 빵을 주문한다.", de: "Wir bestellen Brot." },
  nature: { ko: "오늘 날씨가 좋다.", de: "Das Wetter ist heute gut." },
  travel: { ko: "기차가 역에 도착한다.", de: "Der Zug kommt am Bahnhof an." },
  people: { ko: "선생님이 질문에 답한다.", de: "Der Lehrer antwortet auf die Frage." },
  home: { ko: "나는 창문을 연다.", de: "Ich öffne das Fenster." },
  shopping: { ko: "나는 카드로 지불한다.", de: "Ich bezahle mit Karte." },
  verbs: { ko: "나는 독일어를 배울 수 있다.", de: "Ich kann Deutsch lernen." },
};

const EXERCISE_LABELS: Record<ExerciseKind, string> = {
  "ko-de": "한국어 > 독일어",
  "de-ko": "독일어 > 한국어",
  "type-de": "독일어 단어 입력",
  article: "독일어 성 고르기",
  plural: "복수형 고르기",
  past: "과거형 고르기",
  participle: "과거분사 고르기",
  "write-de": "독일어 작문",
  "translate-ko": "한국어 번역",
};

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

function displayGerman(entry: WordEntry) {
  return entry.type === "명사" ? `${entry.article} ${entry.german}` : entry.german;
}

function rotate<T>(items: T[], amount: number) {
  const offset = amount % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function choiceSet(correct: string, distractors: string[], index: number) {
  return rotate([...new Set([correct, ...distractors])].slice(0, 4), index);
}

function exerciseHint(kind: ExerciseKind) {
  if (kind === "write-de") return "한국어 문장을 독일어로 직접 쓰세요.";
  if (kind === "translate-ko") return "독일어 문장을 한국어로 옮기세요.";
  if (kind === "type-de") return "관사까지 포함해 독일어 단어를 직접 입력하세요.";
  if (kind === "article") return "성에 맞는 관사를 고르세요.";
  if (kind === "plural") return "알맞은 복수형을 고르세요.";
  if (kind === "past" || kind === "participle") return "동사 변화형을 고르세요.";
  return "가장 알맞은 답을 고르세요.";
}

function answerPlaceholder(kind: ExerciseKind) {
  return kind === "translate-ko" ? "한국어로 입력" : "독일어로 입력";
}

function createExercises(lesson: Lesson): Exercise[] {
  const entries = lesson.words.map((german) => WORDS.find((entry) => entry.german === german)).filter((entry): entry is WordEntry => Boolean(entry));
  const sentence = LESSON_SENTENCES[lesson.id];
  const nouns = entries.filter((entry): entry is NounEntry => entry.type === "명사");
  const verbs = entries.filter((entry): entry is VerbEntry => entry.type === "동사");
  const entryAt = (index: number) => entries[index % entries.length];
  const choiceOptions = (entry: WordEntry, direction: "de" | "ko", index: number) => {
    const label = (item: WordEntry) => direction === "de" ? displayGerman(item) : item.ko[0];
    const candidates = entries.filter((item) => item.german !== entry.german).map(label);
    return choiceSet(label(entry), candidates, index);
  };

  const koToDe = (index: number): Exercise => {
    const entry = entryAt(index);
    return { kind: "ko-de", prompt: entry.ko[0], expected: displayGerman(entry), choices: choiceOptions(entry, "de", index), entry };
  };
  const deToKo = (index: number): Exercise => {
    const entry = entryAt(index);
    return { kind: "de-ko", prompt: displayGerman(entry), expected: entry.ko[0], choices: choiceOptions(entry, "ko", index), entry };
  };
  const typeGerman = (index: number): Exercise => {
    const entry = entryAt(index);
    return { kind: "type-de", prompt: entry.ko[0], expected: displayGerman(entry), entry };
  };
  const articleQuestion = (entry: NounEntry, index: number): Exercise => {
    const expected = `${entry.article} ${entry.german}`;
    const alternatives = ["der", "die", "das"].map((article) => `${article} ${entry.german}`);
    return { kind: "article", prompt: `${entry.german}의 알맞은 성을 고르세요.`, expected, choices: choiceSet(expected, alternatives, index), entry };
  };
  const pluralQuestion = (entry: NounEntry, index: number): Exercise => {
    const alternatives = [entry.german, ...nouns.filter((noun) => noun.german !== entry.german).map((noun) => noun.plural)];
    return { kind: "plural", prompt: `${entry.german}의 복수형을 고르세요.`, expected: entry.plural, choices: choiceSet(entry.plural, alternatives, index), entry };
  };
  const verbFormQuestion = (entry: VerbEntry, kind: "past" | "participle", index: number): Exercise => {
    const expected = kind === "past" ? entry.past : entry.participle;
    const alternatives = [entry.german, ...verbs.filter((verb) => verb.german !== entry.german).map((verb) => kind === "past" ? verb.past : verb.participle)];
    const label = kind === "past" ? "과거형" : "과거분사";
    const particle = kind === "past" ? "을" : "를";
    return { kind, prompt: `${entry.german}의 ${label}${particle} 고르세요.`, expected, choices: choiceSet(expected, alternatives, index), entry };
  };

  const nounForArticle = nouns[Math.min(2, nouns.length - 1)];
  const nounForPlural = nouns[0];
  const verbForForms = verbs[0];

  return [
    koToDe(0),
    deToKo(1),
    typeGerman(2),
    ...(nounForArticle ? [articleQuestion(nounForArticle, 3), pluralQuestion(nounForPlural, 4)] : []),
    ...(verbForForms ? [verbFormQuestion(verbForForms, "past", 5), verbFormQuestion(verbForForms, "participle", 6)] : []),
    { kind: "write-de", prompt: sentence.ko, expected: sentence.de },
    { kind: "translate-ko", prompt: sentence.de, expected: sentence.ko },
    koToDe(7),
  ];
}

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.!?]/g, "").replace(/\s+/g, " ");
}

function WordForms({ entry }: { entry: WordEntry }) {
  if (entry.type === "명사") {
    return <dl className="forms-grid noun-forms"><div><dt>성</dt><dd>{entry.article}</dd></div><div><dt>복수형</dt><dd>{entry.plural}</dd></div></dl>;
  }

  return <dl className="forms-grid"><div><dt>과거</dt><dd>{entry.past}</dd></div><div><dt>과거분사</dt><dd>{entry.participle}</dd></div><div><dt>접속법 2식</dt><dd>{entry.subjunctive2}</dd></div></dl>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("learn");
  const [activeLessonIndex, setActiveLessonIndex] = useState<number | null>(null);
  const [lessonWordIndex, setLessonWordIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [wordQuery, setWordQuery] = useState("");
  const [wordMode, setWordMode] = useState<WordMode>("전체");
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [selectedGerman, setSelectedGerman] = useState(WORDS[0].german);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);

    const storedRecent = window.localStorage.getItem("deutsch-dictionary-recent");
    const storedLearned = window.localStorage.getItem("deutsch-learned-today");
    const storedLessons = window.localStorage.getItem("deutsch-completed-lessons");
    if (storedRecent) setRecentQueries(JSON.parse(storedRecent));
    if (storedLearned) setLearnedWords(JSON.parse(storedLearned));
    if (storedLessons) setCompletedLessons(JSON.parse(storedLessons));
  }, []);

  const wordResults = useMemo(() => findWords(wordQuery, wordMode), [wordQuery, wordMode]);
  const selectedWord = wordResults.find((entry) => entry.german === selectedGerman) ?? wordResults[0] ?? WORDS[0];
  const activeLesson = activeLessonIndex === null ? null : LESSONS[activeLessonIndex];
  const exercises = activeLesson ? createExercises(activeLesson) : [];
  const activeExercise = exercises[lessonWordIndex] ?? exercises[0];
  const nounCount = WORDS.filter((word) => word.type === "명사").length;
  const verbCount = WORDS.filter((word) => word.type === "동사").length;
  const completedCount = Math.min(learnedWords.length, DAILY_GOAL);
  const dailyProgress = (completedCount / DAILY_GOAL) * 100;

  function runSearch(nextQuery: string) {
    setWordQuery(nextQuery);
    const cleanQuery = nextQuery.trim();
    if (!cleanQuery) return;

    const nextRecent = [cleanQuery, ...recentQueries.filter((query) => query !== cleanQuery)].slice(0, 6);
    setRecentQueries(nextRecent);
    window.localStorage.setItem("deutsch-dictionary-recent", JSON.stringify(nextRecent));
  }

  function startLesson(index: number) {
    const previousLesson = LESSONS[index - 1];
    if (index > 0 && !completedLessons.includes(previousLesson.id)) return;
    setActiveLessonIndex(index);
    setLessonWordIndex(0);
    setSelectedChoice("");
    setTypedAnswer("");
    setAnswerChecked(false);
    setAnswerCorrect(false);
  }

  function checkAnswer() {
    if (!activeExercise) return;
    const answer = activeExercise.choices ? selectedChoice : typedAnswer;
    if (!answer) return;
    setAnswerCorrect(normalizeAnswer(answer) === normalizeAnswer(activeExercise.expected));
    setAnswerChecked(true);
  }

  function moveToNextExercise() {
    if (!activeLesson || !activeExercise || exercises.length === 0) return;

    if (answerCorrect && activeExercise.entry && !learnedWords.includes(activeExercise.entry.german)) {
      const nextLearned = [...learnedWords, activeExercise.entry.german];
      setLearnedWords(nextLearned);
      window.localStorage.setItem("deutsch-learned-today", JSON.stringify(nextLearned));
    }

    const isFinalExercise = lessonWordIndex === exercises.length - 1;
    if (isFinalExercise) {
      if (!completedLessons.includes(activeLesson.id)) {
        const nextCompleted = [...completedLessons, activeLesson.id];
        setCompletedLessons(nextCompleted);
        window.localStorage.setItem("deutsch-completed-lessons", JSON.stringify(nextCompleted));
      }
      setActiveLessonIndex(null);
      setLessonWordIndex(0);
    } else {
      setLessonWordIndex((index) => index + 1);
    }
    setSelectedChoice("");
    setTypedAnswer("");
    setAnswerChecked(false);
    setAnswerCorrect(false);
  }

  return (
    <main className="app-shell">
      <aside className="side-rail">
        <button className="brand" onClick={() => { setActiveView("learn"); setActiveLessonIndex(null); }} type="button" aria-label="학습 경로로 이동"><span className="brand-mark" aria-hidden="true">W</span><span>WORTWEG</span></button>
        <nav className="primary-nav" aria-label="주요 메뉴">
          <button className={activeView === "learn" ? "active" : ""} onClick={() => setActiveView("learn")} type="button"><span className="nav-dot learn-dot" aria-hidden="true" />학습 경로</button>
          <button className={activeView === "dictionary" ? "active" : ""} onClick={() => setActiveView("dictionary")} type="button"><span className="nav-dot dictionary-dot" aria-hidden="true" />단어사전</button>
        </nav>
        <div className="rail-status"><p>오프라인 모드</p><strong>내장 단어 {WORDS.length}개</strong><span>인터넷 연결 없이 레슨을 이어갈 수 있어요.</span></div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title"><span className="locale-chip">DE</span><p>독일어 단어 훈련</p></div>
          <div className="topbar-stats" aria-label="학습 현황"><span>학습 단어 {completedCount}/{DAILY_GOAL}</span><span className="offline-dot">오프라인</span></div>
        </header>

        {activeView === "learn" ? (
          activeLesson ? (
            <section className="lesson-session" aria-label={`${activeLesson.title} 레슨`}>
              <div className="session-heading">
                <button className="back-button" onClick={() => setActiveLessonIndex(null)} type="button">학습 경로</button>
                <div><p className="eyebrow">주제 레슨</p><h1>{activeLesson.title}</h1><p>{activeLesson.subtitle}</p></div>
                <div className="goal-progress" aria-label={`레슨 진행 ${lessonWordIndex + 1} / ${exercises.length}`}>
                  <div className="progress-label"><span>레슨 진행</span><strong>{lessonWordIndex + 1}/{exercises.length}</strong></div>
                  <div className="progress-track"><span style={{ width: `${((lessonWordIndex + 1) / exercises.length) * 100}%` }} /></div>
                </div>
              </div>

              <section className="challenge-card quiz-card">
                <div className="challenge-copy"><p className="prompt-label">{activeExercise && EXERCISE_LABELS[activeExercise.kind]}</p><h2>{activeExercise?.prompt}</h2><p className="alternate-meaning">{activeExercise && exerciseHint(activeExercise.kind)}</p></div>
                <img className="guide-image" src="/blue-dragon-guide.png" alt="단어 학습을 돕는 파란 용" />
                {activeExercise && <div className="quiz-body">
                  {activeExercise.choices ? (
                    <div className="answer-choices">
                      {activeExercise.choices.map((choice) => <button className={selectedChoice === choice ? "choice-button selected" : "choice-button"} disabled={answerChecked} key={choice} onClick={() => setSelectedChoice(choice)} type="button">{choice}</button>)}
                    </div>
                  ) : (
                    <label className="answer-input"><span className="sr-only">답안</span><input disabled={answerChecked} onChange={(event) => setTypedAnswer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") checkAnswer(); }} placeholder={answerPlaceholder(activeExercise.kind)} value={typedAnswer} /></label>
                  )}
                  {answerChecked && <div className={answerCorrect ? "answer-feedback correct" : "answer-feedback incorrect"}><strong>{answerCorrect ? "정답이에요" : "다시 확인해보세요"}</strong><p>정답: {activeExercise.expected}</p>{activeExercise.entry && <><WordForms entry={activeExercise.entry} /><p className="word-note">{activeExercise.entry.note}</p></>}</div>}
                  {answerChecked ? <button className="primary-button quiz-submit" onClick={moveToNextExercise} type="button">다음</button> : <button className="primary-button quiz-submit" disabled={activeExercise.choices ? !selectedChoice : !typedAnswer.trim()} onClick={checkAnswer} type="button">확인</button>}
                </div>}
              </section>
            </section>
          ) : (
            <section className="journey-view" aria-label="독일어 학습 경로">
              <div className="journey-intro">
                <div><p className="eyebrow">학습 경로</p><h1>챕터 길을 따라 배우세요.</h1><p>일상어부터 핵심 동사까지, 한 챕터씩 순서대로 완성합니다.</p></div>
                <img className="journey-guide" src="/blue-dragon-guide.png" alt="단어 학습을 돕는 파란 용" />
                <div className="goal-progress" aria-label={`학습 단어 ${completedCount} / ${DAILY_GOAL}`}><div className="progress-label"><span>오늘의 목표</span><strong>{completedCount}/{DAILY_GOAL}</strong></div><div className="progress-track"><span style={{ width: `${dailyProgress}%` }} /></div></div>
              </div>

              <div className="topic-path">
                {LESSONS.map((lesson, index) => {
                  const complete = completedLessons.includes(lesson.id);
                  const unlocked = index === 0 || completedLessons.includes(LESSONS[index - 1].id);
                  const status = complete ? "complete" : unlocked ? "current" : "locked";
                  return <div className={`lesson-step ${status}`} key={lesson.id}>
                    {index > 0 && <span className="path-connector" aria-hidden="true" />}
                    <button className="topic-node" disabled={!unlocked} onClick={() => startLesson(index)} type="button">
                      <span className="lesson-orb">{complete ? "완료" : index + 1}</span>
                      <span className="lesson-copy"><small>CHAPTER {index + 1}</small><strong>{lesson.title}</strong><em>{lesson.subtitle}</em></span>
                      <span className="lesson-count">{lesson.words.length} 단어</span>
                    </button>
                  </div>;
                })}
              </div>
            </section>
          )
        ) : (
          <section className="dictionary-view" aria-label="독일어 단어사전">
            <div className="dictionary-heading"><div><p className="eyebrow">내장 사전</p><h1>단어를 찾아보세요</h1></div><span>{WORDS.length}개 단어</span></div>
            <form className="dictionary-search" onSubmit={(event) => { event.preventDefault(); runSearch(wordQuery); }}><label><span className="sr-only">검색어</span><input value={wordQuery} onChange={(event) => setWordQuery(event.target.value)} placeholder="한국어 뜻 또는 독일어 단어" /></label><button className="primary-button" type="submit">검색</button></form>
            <div className="filter-row" aria-label="품사 필터">{(["전체", "명사", "동사"] as const).map((mode) => <button className={wordMode === mode ? "active" : ""} key={mode} onClick={() => setWordMode(mode)} type="button">{mode} <span>{mode === "전체" ? WORDS.length : mode === "명사" ? nounCount : verbCount}</span></button>)}</div>
            {recentQueries.length > 0 && <div className="recent-row" aria-label="최근 검색"><span>최근 검색</span>{recentQueries.map((query) => <button key={query} onClick={() => setWordQuery(query)} type="button">{query}</button>)}</div>}
            <div className="dictionary-grid">
              <section className="result-list" aria-label="검색 결과"><div className="result-heading"><strong>검색 결과</strong><span>{wordResults.length}개</span></div>{wordResults.length > 0 ? wordResults.map((entry) => <button className={selectedWord.german === entry.german ? "word-row selected" : "word-row"} key={`${entry.type}-${entry.german}`} onClick={() => setSelectedGerman(entry.german)} type="button"><span className={`type-chip ${entry.type === "명사" ? "noun" : "verb"}`}>{entry.type}</span><span><strong>{entry.type === "명사" ? `${entry.article} ${entry.german}` : entry.german}</strong><small>{entry.ko.join(", ")}</small></span></button>) : <p className="empty-state">아직 이 단어는 내장 사전에 없습니다.</p>}</section>
              <article className="word-detail" aria-label="선택한 단어의 형태"><span className={`type-chip ${selectedWord.type === "명사" ? "noun" : "verb"}`}>{selectedWord.type}</span><h2>{selectedWord.type === "명사" ? `${selectedWord.article} ${selectedWord.german}` : selectedWord.german}</h2><p className="meaning">{selectedWord.ko.join(", ")}</p><WordForms entry={selectedWord} /><p className="word-note">{selectedWord.note}</p></article>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
