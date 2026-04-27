import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">AI Classroom</h1>
        <p className="text-gray-400 text-lg max-w-md">
          Your intelligent, adaptive co-learning environment. Deep learning, guided by AI,
          alongside curious co-learners.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-lg border border-gray-700 hover:border-gray-500 text-gray-200 font-medium transition-colors"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
