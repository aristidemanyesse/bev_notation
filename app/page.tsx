import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/actions/auth"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role?.code === "ADMIN") {
    redirect("/admin")
  }

  redirect("/dashboard")
}
