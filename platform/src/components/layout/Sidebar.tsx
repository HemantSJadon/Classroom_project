'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import PreferencesPanel from './PreferencesPanel';

interface Props {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const [showPrefs, setShowPrefs] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside className={[
        'fixed inset-y-0 left-0 z-40 w-64 flex-shrink-0',
        'bg-gray-900 border-r border-gray-800 flex flex-col',
        'transition-transform duration-200 ease-in-out',
        'md:relative md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>

        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className="text-lg font-bold tracking-tight hover:text-indigo-400 transition-colors"
          >
            AI Classroom
          </Link>
          <button
            onClick={onMobileClose}
            className="md:hidden p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <Link
            href="/dashboard"
            onClick={onMobileClose}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
            }`}
          >
            Classrooms
          </Link>
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <button
            onClick={() => { setShowPrefs(true); onMobileClose(); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Preferences
          </button>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {showPrefs && <PreferencesPanel onClose={() => setShowPrefs(false)} />}
    </>
  );
}
