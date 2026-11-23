import { redirect } from "next/navigation";
import { getUser } from "@/lib/guard";
import MercuryLogin from "./MercuryLogin";

export const metadata = { title: "Masuk | LeaveSync" };

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");
  return <MercuryLogin />;
}
