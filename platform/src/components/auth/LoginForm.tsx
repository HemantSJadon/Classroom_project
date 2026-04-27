'use client';

import { useActionState } from 'react';
import { login, type AuthFormState } from '@/app/actions/auth';

const initial: AuthFormState = {};

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <div className="px-3 py-2 rounded-lg bg-red-900/40 border border-red-700 text-red-300 text-sm">
          {state.error}
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium text-gray-300">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-indigo-500 focus:outline-none text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
