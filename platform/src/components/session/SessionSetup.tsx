'use client';

import { useState } from 'react';
import DurationPicker from './DurationPicker';
import RecapDisplay from './RecapDisplay';

interface PreviousSession {
  id: string;
  recap_content: string | null;
  recap_shown: boolean;
  ended_at: string | null;
}

interface Props {
  classroomId: string;
  classroomTitle: string;
  previousSession: PreviousSession | null;
  onStart: (durationMinutes: number | null) => void;
}

type Step = 'pick' | 'recap';

export default function SessionSetup({ classroomTitle, previousSession, onStart }: Props) {
  const [duration, setDuration] = useState<number | null>(30);
  const [step, setStep] = useState<Step>(() => {
    // Show recap if there was a previous completed session
    if (previousSession?.ended_at) return 'recap';
    return 'pick';
  });
  const [starting, setStarting] = useState(false);

  function handleStart() {
    setStarting(true);
    onStart(duration);
  }

  if (step === 'recap' && previousSession) {
    return (
      <RecapDisplay
        sessionId={previousSession.id}
        onContinue={() => setStep('pick')}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8 max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-100">{classroomTitle}</h1>
        <p className="text-gray-400 text-sm">Choose a session duration, then start learning.</p>
      </div>

      <div className="w-full space-y-6">
        <DurationPicker value={duration} onChange={setDuration} />

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors"
        >
          {starting ? 'Starting…' : 'Start Session'}
        </button>
      </div>

      {previousSession?.ended_at && (
        <button
          onClick={() => setStep('recap')}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          View recap from last session
        </button>
      )}
    </div>
  );
}
