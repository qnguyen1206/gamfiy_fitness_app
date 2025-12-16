import React from 'react';
import { Trophy, Check, Camera } from 'lucide-react';

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

interface DailyQuestsProps {
  quests: Quest[];
  onStartDetection: (questId: string) => void;
}

const DailyQuests: React.FC<DailyQuestsProps> = ({ quests, onStartDetection }) => {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Trophy size={28} className="text-yellow-600" />
        Daily Quests
      </h2>
      <div className="space-y-4">
        {quests.map((quest) => {
          const progress = Math.min((quest.current / quest.target) * 100, 100);
          
          return (
            <div
              key={quest.id}
              className={`bg-white p-4 rounded-lg border-2 ${
                quest.completed ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{quest.title}</h3>
                    {quest.completed && (
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{quest.description}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">
                    {quest.current} / {quest.target}
                  </span>
                  <span className="text-gray-600">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quest.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Rewards */}
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-gray-700">Rewards:</span>
                <div className="flex gap-3">
                  <span className="text-purple-600 font-semibold">+{quest.rewards.exp} EXP</span>
                  <span className="text-red-600 font-semibold">+{quest.rewards.strength} STR</span>
                  <span className="text-green-600 font-semibold">+{quest.rewards.endurance} END</span>
                </div>
              </div>

              {/* Detection Button */}
              {!quest.completed && (
                <button
                  onClick={() => onStartDetection(quest.id)}
                  className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera size={18} />
                  Start AI Detection
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyQuests;
