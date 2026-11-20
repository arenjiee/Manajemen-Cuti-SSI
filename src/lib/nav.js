const DASH = { label: "Dashboard", href: "/dashboard" };
const BERSAMA = [
  { label: "Riwayat", href: "/riwayat" },
  { label: "Notifikasi", href: "/notifikasi" },
  { label: "Profil", href: "/profil" },
];

const MENU = {
  admin: [
    DASH,
    { label: "Pengguna", href: "/admin/users" },
    { label: "Divisi", href: "/admin/divisi" },
    { label: "Jenis Cuti", href: "/admin/jenis-cuti" },
    { label: "Hari Libur", href: "/admin/hari-libur" },
    { label: "Kapasitas Tim", href: "/kapasitas" },
    { label: "Kuota Hangus", href: "/kuota-hangus" },
    ...BERSAMA,
  ],
  karyawan: [DASH, { label: "Ajukan Cuti", href: "/cuti/ajukan" }, { label: "Cuti Saya", href: "/cuti" }, ...BERSAMA],
  ketua_divisi: [
    DASH,
    { label: "Verifikasi", href: "/verifikasi" },
    { label: "Ajukan Cuti", href: "/cuti/ajukan" },
    { label: "Cuti Saya", href: "/cuti" },
    ...BERSAMA,
  ],
  hrd: [
    DASH,
    { label: "Persetujuan Final", href: "/persetujuan" },
    { label: "Kapasitas Tim", href: "/kapasitas" },
    { label: "Kuota Hangus", href: "/kuota-hangus" },
    ...BERSAMA,
  ],
};

export function menuUntukRole(role) {
  return MENU[role] ?? [];
}

export const NAMA_ROLE = { admin: "Admin", karyawan: "Karyawan", ketua_divisi: "Ketua Divisi", hrd: "HRD" };

// Admin tidak dapat ditambahkan atau dipilih lewat form: sistem hanya punya satu akun Admin.
export const ROLE_DAPAT_DIPILIH = Object.entries(NAMA_ROLE).filter(([v]) => v !== "admin");
export const ROLE_DAPAT_DIHAPUS = ["karyawan", "ketua_divisi", "hrd"];
