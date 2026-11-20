import Link from "next/link";
import Panah from "@/components/Panah";
import { linkCls } from "@/components/ui";

export default function TautanDetail({ href, label = "Detail", className = "" }) {
  return (
    <Link href={href} className={`${linkCls} text-sm ${className}`}>
      <span>{label}</span>
      <Panah arah="kanan" />
    </Link>
  );
}
