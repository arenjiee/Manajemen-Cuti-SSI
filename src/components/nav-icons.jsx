import {
  LayoutDashboard, Users, Building2, ListChecks, CalendarDays, Gauge, Hourglass, History,
  Bell, UserRound, FilePlus2, CalendarCheck, ClipboardCheck, BadgeCheck, File,
} from "lucide-react";

// Ikon dipetakan dari href menu (komponen ikon tidak bisa dikirim dari Server Component).
const IKON = {
  "/dashboard": LayoutDashboard,
  "/admin/users": Users,
  "/admin/divisi": Building2,
  "/admin/jenis-cuti": ListChecks,
  "/admin/hari-libur": CalendarDays,
  "/kapasitas": Gauge,
  "/kuota-hangus": Hourglass,
  "/riwayat": History,
  "/notifikasi": Bell,
  "/profil": UserRound,
  "/cuti/ajukan": FilePlus2,
  "/cuti": CalendarCheck,
  "/verifikasi": ClipboardCheck,
  "/persetujuan": BadgeCheck,
};

export const ikonUntuk = (href) => IKON[href] ?? File;

export function IkonMenu({ href, ...props }) {
  const Ikon = IKON[href] ?? File;
  return <Ikon {...props} />;
}
