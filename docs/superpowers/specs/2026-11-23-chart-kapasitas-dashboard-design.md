# Chart kapasitas divisi di dashboard HRD & Admin

Perubahan kecil. Disepakati lewat percakapan pada 2026-11-23.

## Tujuan
HRD dan Admin melihat sekilas divisi mana yang mendekati batas cuti bersamaan bulan ini, tanpa
membuka kalender `/kapasitas` satu per satu. Admin ikut karena ia menetapkan persen batas per divisi
(menu Kapasitas Tim) dan perlu menilai apakah batas itu pas.

## Non-tujuan
- Bukan pengganti peringatan kapasitas di halaman Persetujuan.
- Tidak ada chart di dashboard Karyawan/Ketua Divisi.
- Tidak menambah library chart.

## Pendekatan (pilihan saya, belum dibahas dengan pengguna)
Satu batang per divisi, panjang = puncak okupansi bulan ini / batas harian divisi itu (bukan jumlah
mentah antardivisi, karena ukuran divisi berbeda). Digambar dengan div + Tailwind di komponen server
`KapasitasChart`. Data dari `petaKapasitas()` yang sudah ada (tanpa query baru), diringkas oleh
`ringkasKapasitasDivisi()`.

Alternatif ditolak: grafik di halaman Persetujuan (nilai tinggi tapi mengubah halaman paling sensitif,
dan peringatan teksnya sudah ada); library chart (dependensi baru untuk satu grafik batang).

## Aturan
- Puncak = jumlah orang cuti terbanyak pada satu hari kerja (akhir pekan & libur diabaikan).
- Menghitung status Pending, Approved by Leader, dan Approved, sama dengan validasi kapasitas.
  Diberi catatan di UI karena kartu "Cuti bulan ini" hanya menghitung Approved.
- Status batang: penuh (puncak >= batas), hampir (puncak + 1 >= batas), lainnya aman. Status juga
  ditulis sebagai teks, tidak hanya warna.
- Urut: paling mepet dulu.

## Sekaligus
- Rincian role di kartu "Pengguna Aktif" dibuat angka di atas, label di bawah (pilihan A).
- Kartu "Belum Punya Divisi": bila 0, tulis "Semua sudah ditempatkan"; bila ada, rincian hanya yang > 0.

## Diserahkan ke pelaksana
Warna dan jarak persisnya, selama memakai token tema yang ada (ok/warn/bad/accent).
