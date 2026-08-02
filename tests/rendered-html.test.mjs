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

test("server-renders the offline dictionary shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /오프라인 단어사전/);
  assert.match(html, /검색 결과/);
  assert.match(html, /명사/);
  assert.match(html, /동사/);
  assert.doesNotMatch(html, /작문|문장별 체크|checkWriting/);
  assert.doesNotMatch(html, /codex-preview|_sites-preview|react-loading-skeleton/);
});

test("keeps dictionary data and offline support inside the app", async () => {
  const [page, layout, serviceWorker, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /article: "das"/);
  assert.match(page, /past: "ging"/);
  assert.match(page, /subjunctive2: "ginge"/);
  assert.match(page, /deutsch-dictionary-recent/);
  assert.doesNotMatch(page, /checkWriting|writing|작문/);
  assert.match(layout, /오프라인 독일어 단어사전/);
  assert.match(serviceWorker, /offline-deutsch-dictionary-v2/);
  assert.match(serviceWorker, /event.request.mode === "navigate"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
