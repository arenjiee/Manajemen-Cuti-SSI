"use client";

export default function TombolKonfirmasi({ action, fields = {}, label, pesan = "Yakin?", konfirmasi = 1, className }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        for (let i = 0; i < konfirmasi; i++) {
          const teks = i === 0 ? pesan : "Konfirmasi sekali lagi: tindakan ini tidak dapat dibatalkan. Lanjutkan?";
          if (!confirm(teks)) return e.preventDefault();
        }
      }}
    >
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}
