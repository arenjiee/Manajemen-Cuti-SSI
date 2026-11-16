const MAKS_ENTRI = 10000;

export function buatPembatas({ maks, jendelaMs, sekarang = Date.now }) {
  const data = new Map();

  function pangkas(t) {
    for (const [k, v] of data) if (v.reset <= t) data.delete(k);
    while (data.size >= MAKS_ENTRI) data.delete(data.keys().next().value);
  }

  return {
    sisaTungguMs(key) {
      const t = sekarang();
      const v = data.get(key);
      if (!v || v.reset <= t || v.n < maks) return 0;
      return v.reset - t;
    },
    catatGagal(key) {
      const t = sekarang();
      let v = data.get(key);
      if (!v || v.reset <= t) {
        if (data.size >= MAKS_ENTRI) pangkas(t);
        v = { n: 0, reset: t + jendelaMs };
        data.set(key, v);
      }
      v.n += 1;
    },
    hapus(key) {
      data.delete(key);
    },
  };
}
