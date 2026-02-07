"use client"

import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const handleLogout = async () => {
  try {
    // This will trigger the sign-out process
    toast.success("Logged out!")    

    const res = await signOut({redirect: true,callbackUrl: "/", })


  } catch (err) {
    toast.error("Logout failed")
    console.error("Logout error:", err)
  }
}

export default function LogOutForm() {
  return (
    <div className="w-full max-w-md mx-auto mt-6 p-6 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Logout</h2>

      <Button onClick={handleLogout} variant="destructive" className="w-full">
        Logout
      </Button>
    </div>
  )
}
