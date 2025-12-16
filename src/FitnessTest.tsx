import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Flame } from 'lucide-react';
import ExerciseDetector from './ExerciseDetector';

interface FitnessTestProps {
  onComplete: (stats: { strength: number; endurance: number }) => void;
  username: string;
}

const FitnessTest: React.FC<FitnessTestProps> = ({ onComplete, username }) => {
  const [phase, setPhase] = useState<'intro' | 'pushups' | 'situps' | 'results'>('intro');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [pushupCount, setPushupCount] = useState(0);
  const [situpCount, setSitupCount] = useState(0);
  const [showDetector, setShowDetector] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (phase === 'intro' || phase === 'results') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Move to results when time is up
          setShowDetector(false);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStats = () => {
    const totalReps = pushupCount + situpCount;
    const strength = totalReps * 0.1;
    const endurance = Math.floor(totalReps / 10) * 0.1;
    return { strength, endurance };
  };

  const handleStartTest = () => {
    setPhase('pushups');
    setTimeRemaining(300);
    setShowDetector(true);
  };

  const handlePushupFinish = (count: number) => {
    setPushupCount(prev => prev + count);
    setShowDetector(false);
  };

  const handleSitupFinish = (count: number) => {
    setSitupCount(prev => prev + count);
    setShowDetector(false);
  };

  const handleNextPhase = () => {
    if (phase === 'pushups') {
      setPhase('situps');
      setShowDetector(true);
    } else if (phase === 'situps') {
      setPhase('results');
    }
  };

  const handleSkipExercise = () => {
    if (phase === 'pushups') {
      setPhase('situps');
    } else if (phase === 'situps') {
      setPhase('results');
    }
  };

  const handleCompleteTest = () => {
    const stats = calculateStats();
    onComplete(stats);
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
              <Flame size={64} className="text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome, {username}!</h1>
            <h2 className="text-2xl font-semibold text-orange-600">Initial Fitness Test</h2>
          </div>

          <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Trophy size={24} className="text-orange-600" />
              Test Overview
            </h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Duration:</strong> 5 minutes total</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Exercises:</strong> Push-ups and Sit-ups</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Scoring:</strong> Each rep = +0.1 Strength, Every 10 reps = +0.1 Endurance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Goal:</strong> Determine your starting fitness level</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This test will set your initial stats. Do your best, but don't worry - 
              you can always improve through daily training!
            </p>
          </div>

          <button
            onClick={handleStartTest}
            className="w-full bg-orange-600 text-white py-4 rounded-lg hover:bg-orange-700 font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            <Flame size={24} />
            Start Fitness Test
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const stats = calculateStats();
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Trophy size={64} className="text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Test Complete!</h1>
            <p className="text-gray-600">Great work, {username}!</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 text-center">
              <p className="text-sm text-gray-600 mb-1">Push-ups</p>
              <p className="text-4xl font-bold text-blue-600">{pushupCount}</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200 text-center">
              <p className="text-sm text-gray-600 mb-1">Sit-ups</p>
              <p className="text-4xl font-bold text-purple-600">{situpCount}</p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-2 border-orange-200 mb-6">
            <h3 className="text-xl font-bold mb-4 text-center">Your Starting Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Strength</p>
                <p className="text-3xl font-bold text-red-600">{stats.strength.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Endurance</p>
                <p className="text-3xl font-bold text-green-600">{stats.endurance.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCompleteTest}
            className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 font-bold text-lg transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Push-ups or Sit-ups phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Timer and Progress */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock size={32} className="text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Time Remaining</p>
                <p className="text-3xl font-bold text-orange-600">{formatTime(timeRemaining)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Current Phase</p>
              <p className="text-xl font-bold text-blue-600">
                {phase === 'pushups' ? 'Push-ups' : 'Sit-ups'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">Push-ups</p>
              <p className="text-2xl font-bold text-blue-600">{pushupCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">Sit-ups</p>
              <p className="text-2xl font-bold text-purple-600">{situpCount}</p>
            </div>
          </div>
        </div>

        {/* Exercise Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            {phase === 'pushups' ? 'Push-up Test' : 'Sit-up Test'}
          </h2>
          <p className="text-gray-700 mb-4">
            Do as many {phase === 'pushups' ? 'push-ups' : 'sit-ups'} as you can. 
            Click "Start Detection" to begin, or skip if you want to move to the next exercise.
          </p>

          <div className="flex gap-4">
            {!showDetector && (
              <>
                <button
                  onClick={() => setShowDetector(true)}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Start Detection
                </button>
                <button
                  onClick={handleNextPhase}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
                >
                  {phase === 'pushups' ? 'Next: Sit-ups' : 'Finish Test'}
                </button>
                <button
                  onClick={handleSkipExercise}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
                >
                  Skip
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDetector && (
        <ExerciseDetector
          exerciseType={phase === 'pushups' ? 'pushup' : 'situp'}
          onCountUpdate={() => {}}
          onFinish={phase === 'pushups' ? handlePushupFinish : handleSitupFinish}
          onClose={() => setShowDetector(false)}
        />
      )}
    </div>
  );
};

export default FitnessTest;
