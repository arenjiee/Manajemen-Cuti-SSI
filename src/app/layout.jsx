import "./globals.css";

export const metadata = {
  title: "SMCK | Sistem Manajemen Cuti Karyawan",
  description: "Pengajuan dan persetujuan cuti karyawan PT SSI Cabang Makassar",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("smck-theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;if(d){r.classList.add("dark");r.classList.remove("light");r.setAttribute("data-theme","dark");r.style.colorScheme="dark";}else{r.classList.remove("dark");r.classList.add("light");r.setAttribute("data-theme","light");r.style.colorScheme="light";}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}
