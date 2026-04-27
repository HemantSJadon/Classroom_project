import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-400 text-sm">Sign in to your AI Classroom account</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-gray-400">
          No account?{' '}
          <a href="/signup" className="text-indigo-400 hover:text-indigo-300">Create one</a>
        </p>
      </div>
    </main>
  );
}
