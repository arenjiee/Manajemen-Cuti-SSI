import { ArrowLeft, ArrowRight } from "lucide-react";

const ARAH = {
  kiri: ArrowLeft,
  kanan: ArrowRight,
};

export default function Panah({ arah = "kanan", className = "" }) {
  const Ikon = ARAH[arah] ?? ArrowRight;
  return <Ikon className={`h-3.5 w-3.5 shrink-0 ${className}`} strokeWidth={2} aria-hidden />;
}
