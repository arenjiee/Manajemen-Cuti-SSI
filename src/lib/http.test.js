import { test } from "node:test";
import assert from "node:assert/strict";
import { s, num, ok, fail, readBody, parseIdList } from "./http.js";

const req = (body, type) =>
  new Request("http://x.test/", { method: "POST", body, headers: type ? { "content-type": type } : {} });

test("s dan num", () => {
  assert.equal(s("  a "), "a");
  assert.equal(s(null), "");
  assert.equal(num(""), null);
  assert.equal(num("12"), 12);
  assert.equal(num("abc"), null);
});

test("ok dan fail: bentuk respons seragam", async () => {
  const a = ok({ id: 3 }, 201);
  assert.equal(a.status, 201);
  assert.deepEqual(await a.json(), { ok: true, id: 3 });
  const b = fail("salah");
  assert.equal(b.status, 400);
  assert.deepEqual(await b.json(), { ok: false, message: "salah" });
});

test("readBody: JSON", async () => {
  const b = await readBody(req(JSON.stringify({ nama: "CIT" }), "application/json"));
  assert.deepEqual(b, { nama: "CIT" });
});

test("readBody: JSON rusak -> objek kosong", async () => {
  assert.deepEqual(await readBody(req("{x", "application/json")), {});
});

test("readBody: FormData, key berulang jadi array", async () => {
  const fd = new FormData();
  fd.append("nama", "FLM");
  fd.append("userId", "1");
  fd.append("userId", "2");
  const b = await readBody(req(fd));
  assert.equal(b.nama, "FLM");
  assert.deepEqual(b.userId, ["1", "2"]);
});

test("parseIdList: berbagai bentuk, buang tidak valid & duplikat", () => {
  assert.deepEqual(parseIdList("5"), [5]);
  assert.deepEqual(parseIdList(["1", "2", "2", "abc"]), [1, 2]);
  assert.deepEqual(parseIdList("1, 2,3"), [1, 2, 3]);
  assert.deepEqual(parseIdList(7), [7]);
  assert.deepEqual(parseIdList(null), []);
  assert.deepEqual(parseIdList("-1"), []);
});
