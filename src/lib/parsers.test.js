import { test } from "node:test";
import assert from "node:assert/strict";
import { bool } from "./http.js";
import { parseJenis, parseHariLibur } from "./parsers.js";

test("bool: berbagai bentuk, nilai terakhir menang untuk array", () => {
  assert.equal(bool(true), true);
  assert.equal(bool("on"), true);
  assert.equal(bool("true"), true);
  assert.equal(bool("false"), false);
  assert.equal(bool(undefined), false);
  assert.equal(bool(["false", "on"]), true);
  assert.equal(bool("false"), false);
});

test("parseJenis: aktif default true bila tidak dikirim, false bila hidden false", () => {
  assert.equal(parseJenis({ nama: "X" }).aktif, true);
  assert.equal(parseJenis({ nama: "X", aktif: "false" }).aktif, false);
  assert.equal(parseJenis({ nama: "X", aktif: ["false", "on"] }).aktif, true);
});

test("parseJenis: angka dan flag", () => {
  const r = parseJenis({ nama: " Duka ", kuotaHari: "3", batasPengajuanHari: "", wajibLampiran: "on" });
  assert.equal(r.nama, "Duka");
  assert.equal(r.kuotaHari, 3);
  assert.ok(Number.isNaN(r.batasPengajuanHari));
  assert.equal(r.wajibLampiran, true);
  assert.equal(r.potongKuota, false);
  assert.equal(parseJenis({ kuotaHari: "" }).kuotaHari, null);
});

test("parseHariLibur: trim", () => {
  assert.deepEqual(parseHariLibur({ tanggal: " 2026-12-25 ", keterangan: "Natal", jenis: "nasional" }),
    { tanggal: "2026-12-25", keterangan: "Natal", jenis: "nasional" });
});
