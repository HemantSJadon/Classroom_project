export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to your AI Classroom account</p>
        </div>
        <form className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Sign in
          </button>
        </form>
        <p className="text-center text-sm text-gray-400">
          No account?{' '}
          <a href="/signup" className="text-indigo-400 hover:text-indigo-300">Create one</a>
        </p>
      </div>
    </main>
  );
}
