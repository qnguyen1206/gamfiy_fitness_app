import React, { useState, useEffect } from 'react';
import { Dumbbell, Brain, Heart, Camera, LogOut, Star } from 'lucide-react';
import ExerciseDetector from './ExerciseDetector';
import CharacterLogin from './CharacterLogin';
import DailyQuests from './DailyQuests';
import FitnessTest from './FitnessTest';
import { api } from './api';

interface Stats {
  strength: number;
  intelligence: number;
  endurance: number;
  exp: number;
  level: number;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  rewards: {
    exp: number;
    strength: number;
    endurance: number;
  };
}

interface DailyQuestData {
  userId: number;
  date: string;
  quests: Quest[];
}

interface User {
  id: number;
  username: string;
}

interface UserStats {
  userId: number;
  stats: Stats;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    strength: 0,
    intelligence: 0,
    endurance: 0,
    exp: 0,
    level: 1,
  });

  const [showDetector, setShowDetector] = useState<'pushup' | 'situp' | 'squat' | 'plank' | 'lunge' | 'swordstrike' | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [needsFitnessTest, setNeedsFitnessTest] = useState(false);

  // Calculate level from EXP
  const calculateLevel = (exp: number): number => {
    let level = 1;
    let totalExpNeeded = 0;
    
    while (true) {
      const expForNextLevel = level * 100;
      if (totalExpNeeded + expForNextLevel > exp) {
        break;
      }
      totalExpNeeded += expForNextLevel;
      level++;
    }
    
    return level;
  };

  // Get EXP needed for current level
  const getExpForLevel = (level: number): number => {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += i * 100;
    }
    return total;
  };

  // Get EXP needed for next level
  const getExpForNextLevel = (currentLevel: number): number => {
    return currentLevel * 100;
  };

  // Update level whenever exp changes
  useEffect(() => {
    const newLevel = calculateLevel(stats.exp);
    if (newLevel !== stats.level) {
      setStats(prev => ({ ...prev, level: newLevel }));
    }
  }, [stats.exp]);

  // Initialize daily quests
  const initializeDailyQuests = (): Quest[] => {
    return [
      {
        id: 'pushups',
        title: 'Push-up Master',
        description: 'Complete 100 push-ups today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      },
      {
        id: 'situps',
        title: 'Sit-up Champion',
        description: 'Complete 100 sit-ups today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      },
      {
        id: 'squats',
        title: 'Squat Master',
        description: 'Complete 100 squats today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      },
      {
        id: 'planks',
        title: 'Plank Champion',
        description: 'Hold plank for 100 seconds today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      },
      {
        id: 'lunges',
        title: 'Lunge Master',
        description: 'Complete 100 lunges today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      },
      {
        id: 'swordstrikes',
        title: 'Sword Strike Master',
        description: 'Complete 100 sword strikes today',
        target: 100,
        current: 0,
        completed: false,
        rewards: { exp: 1, strength: 1, endurance: 1 }
      }
    ];
  };

  // Load user stats and daily quests when user logs in
  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    try {
      // Load stats from API
      const statsData = await api.getStats(currentUser.id);
      setStats({
        strength: statsData.strength || 0,
        intelligence: statsData.intelligence || 0,
        endurance: statsData.endurance || 0,
        exp: statsData.exp || 0,
        level: statsData.level || 1
      });

      // Check if new user (no stats yet)
      if (statsData.strength === 0 && statsData.endurance === 0 && statsData.exp === 0) {
        setNeedsFitnessTest(true);
        return; // Don't load quests yet
      }

      // Load daily quests from API
      const questsData = await api.getQuests(currentUser.id);
      
      // Merge API data with quest definitions
      const questDefinitions = initializeDailyQuests();
      const mergedQuests = questDefinitions.map(def => {
        const savedQuest = questsData.find((q: any) => q.quest_id === def.id);
        if (savedQuest) {
          return {
            ...def,
            current: savedQuest.current_progress,
            completed: savedQuest.completed
          };
        }
        return def;
      });
      
      setDailyQuests(mergedQuests);
    } catch (error) {
      console.error('Error loading user data:', error);
      // Initialize with defaults on error
      setStats({ strength: 0, intelligence: 0, endurance: 0, exp: 0, level: 1 });
      setDailyQuests(initializeDailyQuests());
    }
  };

  // Save stats whenever they change
  useEffect(() => {
    if (currentUser && stats.level > 0) {
      api.updateStats(currentUser.id, stats).catch(err => {
        console.error('Failed to save stats:', err);
      });
    }
  }, [stats, currentUser]);

  // Save daily quests whenever they change
  useEffect(() => {
    if (currentUser && dailyQuests.length > 0) {
      dailyQuests.forEach(quest => {
        api.updateQuest(currentUser.id, quest.id, {
          currentProgress: quest.current,
          completed: quest.completed
        }).catch(err => {
          console.error('Failed to save quest:', err);
        });
      });
    }
  }, [dailyQuests, currentUser]);

  const handleExerciseFinish = (type: 'pushup' | 'situp' | 'squat' | 'plank' | 'lunge' | 'swordstrike', count: number) => {
    if (count > 0) {
      const strengthGain = count * 0.1;
      const enduranceGain = Math.floor(count / 10) * 0.1;
      
      // Update stats
      setStats(prev => ({
        ...prev,
        strength: prev.strength + strengthGain,
        endurance: prev.endurance + enduranceGain
      }));
      
      // Update daily quest progress
      const questIdMap: Record<string, string> = {
        'pushup': 'pushups',
        'situp': 'situps',
        'squat': 'squats',
        'plank': 'planks',
        'lunge': 'lunges',
        'swordstrike': 'swordstrikes'
      };
      const questId = questIdMap[type];
      setDailyQuests(prev => {
        return prev.map(quest => {
          if (quest.id === questId && !quest.completed) {
            const newCurrent = quest.current + count;
            const nowCompleted = newCurrent >= quest.target && !quest.completed;
            
            // Award quest rewards if just completed
            if (nowCompleted) {
              setStats(prevStats => ({
                ...prevStats,
                exp: prevStats.exp + quest.rewards.exp,
                strength: prevStats.strength + quest.rewards.strength,
                endurance: prevStats.endurance + quest.rewards.endurance
              }));
            }
            
            return {
              ...quest,
              current: newCurrent,
              completed: newCurrent >= quest.target
            };
          }
          return quest;
        });
      });
      
      const exerciseNameMap: Record<string, string> = {
        'pushup': 'push-ups',
        'situp': 'sit-ups',
        'squat': 'squats',
        'plank': 'seconds of plank',
        'lunge': 'lunges',
        'swordstrike': 'sword strikes'
      };
      const exerciseName = exerciseNameMap[type];
      const gains = [
        `+${strengthGain.toFixed(1)} Strength`,
        enduranceGain > 0 ? `+${enduranceGain.toFixed(1)} Endurance` : null
      ].filter(Boolean).join(', ');
      
      // Check if quest was just completed
      const quest = dailyQuests.find(q => q.id === questId);
      const questCompleted = quest && !quest.completed && (quest.current + count) >= quest.target;
      
      let message = `Great job! You completed ${count} ${exerciseName}!\n${gains}`;
      if (questCompleted) {
        message += `\n\n🎉 Quest Completed! +${quest.rewards.exp} EXP, +${quest.rewards.strength} STR, +${quest.rewards.endurance} END`;
      }
      
      alert(message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setStats({ strength: 0, intelligence: 0, endurance: 0, exp: 0, level: 1 });
    setDailyQuests([]);
    setNeedsFitnessTest(false);
  };

  const handleStartDetection = (questId: string) => {
    const detectorMap: Record<string, 'pushup' | 'situp' | 'squat' | 'plank' | 'lunge' | 'swordstrike'> = {
      'pushups': 'pushup',
      'situps': 'situp',
      'squats': 'squat',
      'planks': 'plank',
      'lunges': 'lunge',
      'swordstrikes': 'swordstrike'
    };
    const detector = detectorMap[questId];
    if (detector) {
      setShowDetector(detector);
    }
  };

  const handleFitnessTestComplete = async (testStats: { strength: number; endurance: number }) => {
    if (!currentUser) return;

    // Update stats with test results
    const newStats = {
      strength: testStats.strength,
      intelligence: 0,
      endurance: testStats.endurance,
      exp: 0,
      level: 1
    };

    setStats(newStats);
    
    // Save to database
    try {
      await api.updateStats(currentUser.id, newStats);
      setNeedsFitnessTest(false);
      // Now load quests
      const questsData = await api.getQuests(currentUser.id);
      const questDefinitions = initializeDailyQuests();
      const mergedQuests = questDefinitions.map(def => {
        const savedQuest = questsData.find((q: any) => q.quest_id === def.id);
        if (savedQuest) {
          return {
            ...def,
            current: savedQuest.current_progress,
            completed: savedQuest.completed
          };
        }
        return def;
      });
      setDailyQuests(mergedQuests);
    } catch (error) {
      console.error('Failed to save test results:', error);
    }
  };

  if (!currentUser) {
    return <CharacterLogin onLogin={setCurrentUser} />;
  }

  if (needsFitnessTest) {
    return (
      <FitnessTest
        onComplete={handleFitnessTestComplete}
        username={currentUser.username}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Sidebar - Character Info (Blue) */}
        <div className="lg:w-80 bg-blue-50 border-r-4 border-blue-300 p-6 space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-md border-2 border-blue-200">
            <h2 className="text-xl font-bold text-blue-800 mb-2">Character</h2>
            <p className="text-gray-700">
              <span className="font-semibold text-blue-600">{currentUser.username}</span>
            </p>
            <p className="text-sm text-gray-600">ID: {currentUser.id}</p>
          </div>

          {/* Level Progress */}
          <div className="bg-white rounded-lg p-4 shadow-md border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-purple-800">Level {stats.level}</h2>
              <span className="text-sm font-semibold text-purple-600">
                {stats.exp - getExpForLevel(stats.level)} / {getExpForNextLevel(stats.level)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{
                  width: `${((stats.exp - getExpForLevel(stats.level)) / getExpForNextLevel(stats.level)) * 100}%`
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {getExpForNextLevel(stats.level) - (stats.exp - getExpForLevel(stats.level))} EXP to Level {stats.level + 1}
            </p>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800">Stats</h3>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell size={20} className="text-red-500" />
                  <span className="font-semibold">Strength</span>
                </div>
                <span className="text-lg font-bold">{(stats.strength || 0).toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain size={20} className="text-purple-500" />
                  <span className="font-semibold">Intelligence</span>
                </div>
                <span className="text-lg font-bold">{(stats.intelligence || 0).toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={20} className="text-green-500" />
                  <span className="font-semibold">Endurance</span>
                </div>
                <span className="text-lg font-bold">{(stats.endurance || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Practice Mode */}
          <div className="bg-white rounded-lg p-4 shadow-md border-2 border-green-200">
            <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center gap-2">
              <Camera size={20} />
              Practice
            </h3>
            <button
              onClick={() => setShowExerciseModal(true)}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-semibold transition-colors"
            >
              Start Practice
            </button>
          </div>
        </div>

        {/* Main Content Area - Daily Quests (Red) */}
        <div className="flex-1 relative">
          {/* Logout Button (Yellow) */}
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors shadow-lg font-semibold border-2 border-yellow-600"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>

          <div className="p-8 pt-20 max-w-5xl mx-auto space-y-6">
            <h1 className="text-4xl font-bold text-gray-800">Fitness Tracker</h1>
            
            <DailyQuests quests={dailyQuests} onStartDetection={handleStartDetection} />
          </div>
        </div>
      </div>

      {showExerciseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Choose Exercise</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  setShowDetector('pushup');
                  setShowExerciseModal(false);
                }}
                className="bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">💪</span>
                <span>Push-ups</span>
              </button>
              <button
                onClick={() => {
                  setShowDetector('situp');
                  setShowExerciseModal(false);
                }}
                className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🧘</span>
                <span>Sit-ups</span>
              </button>
              <button
                onClick={() => {
                  setShowDetector('squat');
                  setShowExerciseModal(false);
                }}
                className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🦵</span>
                <span>Squats</span>
              </button>
              <button
                onClick={() => {
                  setShowDetector('plank');
                  setShowExerciseModal(false);
                }}
                className="bg-yellow-600 text-white px-6 py-4 rounded-lg hover:bg-yellow-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🏋️</span>
                <span>Plank</span>
              </button>
              <button
                onClick={() => {
                  setShowDetector('lunge');
                  setShowExerciseModal(false);
                }}
                className="bg-pink-600 text-white px-6 py-4 rounded-lg hover:bg-pink-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">🚶</span>
                <span>Lunges</span>
              </button>
              <button
                onClick={() => {
                  setShowDetector('swordstrike');
                  setShowExerciseModal(false);
                }}
                className="bg-red-600 text-white px-6 py-4 rounded-lg hover:bg-red-700 font-semibold transition-colors flex flex-col items-center gap-2"
              >
                <span className="text-2xl">⚔️</span>
                <span>Sword Strike</span>
              </button>
            </div>
            <button
              onClick={() => setShowExerciseModal(false)}
              className="mt-6 w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showDetector && (
        <ExerciseDetector
          exerciseType={showDetector}
          onCountUpdate={() => {}}
          onFinish={(count) => handleExerciseFinish(showDetector, count)}
          onClose={() => setShowDetector(null)}
        />
      )}
    </div>
  );
}

export default App;
