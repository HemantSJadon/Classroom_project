export default function DashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Classrooms</h1>
        <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
          + New Classroom
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Placeholder classroom card */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="font-semibold text-gray-100">Quantum Mechanics</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">Active</span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2">
            Understanding quantum superposition, entanglement, and wave function collapse from first principles.
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>3 sessions</span>
            <span>·</span>
            <span>5 co-learners</span>
            <span>·</span>
            <span>Last active: 2 days ago</span>
          </div>
          <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            Join Session
          </button>
        </div>

        {/* New classroom CTA */}
        <button className="rounded-xl border-2 border-dashed border-gray-700 hover:border-indigo-500 p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-indigo-400 transition-colors min-h-[160px]">
          <span className="text-3xl font-light">+</span>
          <span className="text-sm font-medium">Start a new classroom</span>
        </button>
      </div>
    </div>
  );
}
