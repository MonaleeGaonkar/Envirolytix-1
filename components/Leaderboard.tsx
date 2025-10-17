import React from 'react';
import { leaderboardData } from '../constants';
import Card from './ui/Card';

const Leaderboard: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">EcoFriends Leaderboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">See how you stack up against other eco-warriors.</p>
      </div>

      <Card>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {leaderboardData.sort((a,b) => b.ecoPoints - a.ecoPoints).map((user, index) => (
            <li key={user.id} className={`p-4 flex items-center space-x-4 ${user.name === 'You' ? 'bg-blue-50 dark:bg-blue-900/50 rounded-lg' : ''}`}>
              <span className="text-lg font-bold text-gray-500 dark:text-gray-400 w-6 text-center">{index + 1}</span>
              <img className="h-12 w-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600" src={user.avatarUrl} alt={user.name} />
              <div className="flex-1">
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.ecoPoints.toLocaleString()} EcoPoints</p>
              </div>
              {index < 3 && (
                <span className="text-3xl">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default Leaderboard;