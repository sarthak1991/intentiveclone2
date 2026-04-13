import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Welcome to FocusFlow
        </h1>
        <p className="mt-4 text-xl text-gray-700 mb-8">
          Focus rooms for people with ADHD — Complete focused work sessions through community accountability and structured 45-minute Pomodoro intervals
        </p>

        <div className="flex gap-4 justify-center items-center mt-8">
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Sign Up
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-600">
          <p>Join focus rooms, set goals, and build momentum with community support</p>
        </div>
      </div>
    </main>
  )
}
