'use client'

import { createClient } from '@/lib/supabase/client'

export default function AccountInvalidPage() {
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold">
          Account not fully set up
        </h1>

        <p className="text-muted-foreground">
          This account was created outside of Carly’s official signup process
          and does not have an assigned role.
        </p>

        <p className="text-muted-foreground">
          Please sign up through Carly or contact support if you believe this is an error.
        </p>

        <button
          onClick={handleSignOut}
          className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
