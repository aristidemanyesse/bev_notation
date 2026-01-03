import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="/modern-office-workspace-professional-team-collabor.jpg"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-background/60 to-green-600/30 backdrop-blur-sm" />
      </div>
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
