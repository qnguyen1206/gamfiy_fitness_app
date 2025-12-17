import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Flame } from 'lucide-react';
import ExerciseDetector from './ExerciseDetector';

interface FitnessTestProps {
  onComplete: (stats: { strength: number; endurance: number }) => void;
  username: string;
}

type ExercisePhase = 'intro' | 'pushups' | 'situps' | 'squats' | 'plank' | 'lunges' | 'swordstrikes' | 'results';

const FitnessTest: React.FC<FitnessTestProps> = ({ onComplete, username }) => {
  const [phase, setPhase] = useState<ExercisePhase>('intro');
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes per exercise
  const [pushupCount, setPushupCount] = useState(0);
  const [situpCount, setSitupCount] = useState(0);
  const [squatCount, setSquatCount] = useState(0);
  const [plankCount, setPlankCount] = useState(0);
  const [lungeCount, setLungeCount] = useState(0);
  const [swordstrikeCount, setSwordstrikeCount] = useState(0);
  const [showDetector, setShowDetector] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (phase === 'intro' || phase === 'results') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Stop at 0 and wait for user to click Next
          setShowDetector(false);
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
    const totalReps = pushupCount + situpCount + squatCount + plankCount + lungeCount + swordstrikeCount;
    const strength = totalReps * 0.1;
    const endurance = Math.floor(totalReps / 10) * 0.1;
    return { strength, endurance };
  };

  const handleStartTest = () => {
    setPhase('pushups');
    setTimeRemaining(180);
    setShowDetector(true);
  };

  const handleExerciseFinish = (count: number) => {
    switch (phase) {
      case 'pushups':
        setPushupCount(prev => prev + count);
        break;
      case 'situps':
        setSitupCount(prev => prev + count);
        break;
      case 'squats':
        setSquatCount(prev => prev + count);
        break;
      case 'plank':
        setPlankCount(prev => prev + count);
        break;
      case 'lunges':
        setLungeCount(prev => prev + count);
        break;
      case 'swordstrikes':
        setSwordstrikeCount(prev => prev + count);
        break;
    }
    setShowDetector(false);
  };

  const getNextPhase = (currentPhase: ExercisePhase): ExercisePhase => {
    const phaseOrder: ExercisePhase[] = ['pushups', 'situps', 'squats', 'plank', 'lunges', 'swordstrikes', 'results'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    return phaseOrder[currentIndex + 1] || 'results';
  };

  const handleNextPhase = () => {
    const nextPhase = getNextPhase(phase);
    setPhase(nextPhase);
    if (nextPhase !== 'results') {
      setTimeRemaining(180); // Reset to 3 minutes for next exercise
      setShowDetector(true);
    }
  };

  const handleSkipExercise = () => {
    const nextPhase = getNextPhase(phase);
    setPhase(nextPhase);
    if (nextPhase !== 'results') {
      setTimeRemaining(180); // Reset to 3 minutes for next exercise
    }
  };

  const handleCompleteTest = () => {
    const stats = calculateStats();
    onComplete(stats);
  };

  const getExerciseType = (phase: ExercisePhase): 'pushup' | 'situp' | 'squat' | 'plank' | 'lunge' | 'swordstrike' | undefined => {
    switch (phase) {
      case 'pushups': return 'pushup';
      case 'situps': return 'situp';
      case 'squats': return 'squat';
      case 'plank': return 'plank';
      case 'lunges': return 'lunge';
      case 'swordstrikes': return 'swordstrike';
      default: return undefined;
    }
  };

  const getExerciseLabel = (phase: ExercisePhase): string => {
    switch (phase) {
      case 'pushups': return 'Push-ups';
      case 'situps': return 'Sit-ups';
      case 'squats': return 'Squats';
      case 'plank': return 'Plank';
      case 'lunges': return 'Lunges';
      case 'swordstrikes': return 'Sword Strikes';
      default: return '';
    }
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
                <span><strong>Duration:</strong> 3 minutes per exercise (18 minutes total)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Exercises:</strong> Push-ups, Sit-ups, Squats, Plank, Lunges, and Sword Strikes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Scoring:</strong> Each rep = +0.1 Strength, Every 10 reps = +0.1 Endurance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 font-bold">•</span>
                <span><strong>Navigation:</strong> Click "Next" after each exercise to continue</span>
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

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Push-ups</p>
              <p className="text-3xl font-bold text-blue-600">{pushupCount}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Sit-ups</p>
              <p className="text-3xl font-bold text-purple-600">{situpCount}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Squats</p>
              <p className="text-3xl font-bold text-green-600">{squatCount}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Plank</p>
              <p className="text-3xl font-bold text-yellow-600">{plankCount}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg border-2 border-pink-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Lunges</p>
              <p className="text-3xl font-bold text-pink-600">{lungeCount}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200 text-center">
              <p className="text-xs text-gray-600 mb-1">Strikes</p>
              <p className="text-3xl font-bold text-indigo-600">{swordstrikeCount}</p>
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

  // Exercise phase
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
                {getExerciseLabel(phase)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Push-ups</p>
              <p className="text-xl font-bold text-blue-600">{pushupCount}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Sit-ups</p>
              <p className="text-xl font-bold text-purple-600">{situpCount}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Squats</p>
              <p className="text-xl font-bold text-green-600">{squatCount}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Plank</p>
              <p className="text-xl font-bold text-yellow-600">{plankCount}</p>
            </div>
            <div className="bg-pink-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Lunges</p>
              <p className="text-xl font-bold text-pink-600">{lungeCount}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-center">
              <p className="text-xs text-gray-600">Strikes</p>
              <p className="text-xl font-bold text-indigo-600">{swordstrikeCount}</p>
            </div>
          </div>
        </div>

        {/* Exercise Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            {getExerciseLabel(phase)} Test
          </h2>
          <p className="text-gray-700 mb-4">
            Do as many {getExerciseLabel(phase).toLowerCase()} as you can in 3 minutes. 
            When time runs out, click "Next" to move to the next exercise.
          </p>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>⏰ Tip:</strong> You have 3 minutes for this exercise. Click "Next" when you're ready to move on, or wait for the timer to reach 0.
            </p>
          </div>

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
                  {phase === 'swordstrikes' ? 'Finish Test' : `Next: ${getExerciseLabel(getNextPhase(phase))}`}
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

      {showDetector && getExerciseType(phase) && (
        <ExerciseDetector
          exerciseType={getExerciseType(phase)!}
          onCountUpdate={() => {}}
          onFinish={handleExerciseFinish}
          onClose={() => setShowDetector(false)}
        />
      )}
    </div>
  );
};

export default FitnessTest;