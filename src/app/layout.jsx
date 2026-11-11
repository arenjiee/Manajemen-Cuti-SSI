import "./globals.css";

export const metadata = {
  title: "SMCK | Sistem Manajemen Cuti Karyawan",
  description: "Pengajuan dan persetujuan cuti karyawan PT SSI Cabang Makassar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
