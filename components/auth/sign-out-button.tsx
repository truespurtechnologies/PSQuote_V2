"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useAuth } from "./auth-context"

export function SignOutButton() {
  const { signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      // The auth context will handle the redirection and state updates
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  )
}
