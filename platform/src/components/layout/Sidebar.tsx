'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight hover:text-indigo-400 transition-colors">
          AI Classroom
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/dashboard'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
          }`}
        >
          Classrooms
        </Link>
      </nav>

      <div className="p-3 border-t border-gray-800">
        <div className="px-3 py-2 text-xs text-gray-500">
          Classrooms will appear here
        </div>
      </div>
    </aside>
  );
}
