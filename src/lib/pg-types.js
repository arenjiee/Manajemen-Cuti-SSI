import pg from "pg";

// DATE tetap string "YYYY-MM-DD" (hindari pergeseran zona waktu); NUMERIC menjadi number.
pg.types.setTypeParser(1082, (v) => v);
pg.types.setTypeParser(1700, (v) => parseFloat(v));
