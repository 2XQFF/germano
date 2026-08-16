import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the offline learning shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /WORTWEG/);
  assert.match(html, /학습 경로/);
  assert.match(html, /CHAPTER/);
  assert.match(html, /일상어/);
  assert.match(html, /음식/);
  assert.match(html, /명사/);
  assert.match(html, /동사/);
  assert.doesNotMatch(html, /문장별 체크|checkWriting|예문/);
  assert.doesNotMatch(html, /codex-preview|_sites-preview|react-loading-skeleton/);
});

test("keeps dictionary data and offline support inside the app", async () => {
  const [page, data, layout, serviceWorker, staticServiceWorker, staticPage, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../dictionary-data.json", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../sw.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /blue-dragon-guide\.png/);
  assert.match(data, /"article": "das"/);
  assert.match(data, /"german": "Bahnhof"/);
  assert.match(data, /"past": "ging"/);
  assert.match(data, /"participle": "hat gesehen"/);
  assert.match(data, /"subjunctive2": "ginge"/);
  assert.match(page, /deutsch-dictionary-recent/);
  assert.match(page, /EXERCISE_LABELS/);
  assert.match(page, /독일어 작문/);
  assert.match(page, /한국어 번역/);
  assert.match(page, /독일어 성 고르기/);
  assert.match(page, /독일어 단어 입력/);
  assert.match(page, /과거분사 고르기/);
  assert.doesNotMatch(data, /example:/);
  assert.doesNotMatch(page, /checkWriting|writing|예문/);
  assert.match(layout, /WORTWEG/);
  assert.match(serviceWorker, /offline-deutsch-dictionary-v4/);
  assert.match(serviceWorker, /event.request.mode === "navigate"/);
  assert.match(staticServiceWorker, /germano-static-v3/);
  assert.match(staticServiceWorker, /public\/blue-dragon-guide\.png/);
  assert.match(staticPage, /CHAPTER/);
  assert.match(staticPage, /EXERCISE_LABELS/);
  assert.match(staticPage, /독일어 성 고르기/);
  assert.match(staticPage, /독일어 단어 입력/);
  assert.match(staticPage, /\.\/public\/blue-dragon-guide\.png/);
  assert.match(staticPage, /dictionary-data\.json/);
  assert.doesNotMatch(staticPage, /example-block|예문/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.doesNotThrow(() => JSON.parse(data));
});
