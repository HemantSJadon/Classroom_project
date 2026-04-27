import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center space-y-4">
        <p className="text-6xl font-black text-gray-800">404</p>
        <h1 className="text-xl font-bold text-gray-200">Page not found</h1>
        <p className="text-gray-400 text-sm">The page you are looking for does not exist.</p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
