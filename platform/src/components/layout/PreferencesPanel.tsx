'use client';

import { useEffect, useState } from 'react';

interface Prefs {
  preferred_depth: string;
  colearner_intensity: string;
  language_style: string;
  learning_pace: string;
}

const FIELDS: Array<{ key: keyof Prefs; label: string; options: string[] }> = [
  { key: 'preferred_depth', label: 'Default explanation depth', options: ['eli5', 'simple', 'intermediate', 'advanced', 'expert'] },
  { key: 'colearner_intensity', label: 'Co-learner activity', options: ['off', 'low', 'medium', 'high'] },
  { key: 'language_style', label: 'Language style', options: ['formal', 'conversational', 'socratic'] },
  { key: 'learning_pace', label: 'Learning pace', options: ['slow', 'medium', 'fast'] },
];

interface Props { onClose: () => void; }

export default function PreferencesPanel({ onClose }: Props) {
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/user/preferences').then((r) => r.json()).then((d) => setPrefs(d.preferences));
  }, []);

  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    await fetch('/api/user/preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-gray-100">Learning Preferences</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        {!prefs ? (
          <div className="p-6 text-center text-gray-500 text-sm animate-pulse">Loading…</div>
        ) : (
          <div className="p-5 space-y-5">
            {FIELDS.map(({ key, label, options }) => (
              <div key={key} className="space-y-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
                <div className="flex flex-wrap gap-2">
                  {options.map((opt) => (
                    <button key={opt} onClick={() => setPrefs((p) => p ? { ...p, [key]: opt } : p)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border capitalize transition-colors ${
                        prefs[key] === opt
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button onClick={handleSave} disabled={saving}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
