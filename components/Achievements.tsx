import React, { useState } from 'react';
import { Activity, Badge } from '../types';
import { badges } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { ShareIcon } from './ui/Icons';

interface AchievementsProps {
  activities: Activity[];
}

const Achievements: React.FC<AchievementsProps> = ({ activities }) => {
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);
  const unlockedBadges = badges.filter(badge => badge.isUnlocked(activities));
  const lockedBadges = badges.filter(badge => !badge.isUnlocked(activities));

  const handleShare = async (badge: Badge) => {
    const shareText = `I just unlocked the "${badge.name}" badge on Enviro-Lytix for ${badge.description.toLowerCase()}! Join me in reducing our carbon footprint. #EnviroLytix #ClimateAction`;
    const shareData = {
      title: 'My Enviro-Lytix Achievement!',
      text: shareText,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing badge:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedBadgeId(badge.id);
        setTimeout(() => setCopiedBadgeId(null), 2000); // Reset after 2 seconds
      } catch (error) {
        console.error('Failed to copy text:', error);
        alert('Sharing is not supported on this browser. Failed to copy to clipboard.');
      }
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Achievements</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Celebrate your eco-friendly milestones!</p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Unlocked ({unlockedBadges.length})</h2>
          {unlockedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {unlockedBadges.map(badge => (
                <Card key={badge.id} className="text-center items-center flex flex-col justify-between border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                  <div>
                    <div className="p-4 bg-green-100 dark:bg-green-500/20 rounded-full mb-4 inline-block">
                      <badge.icon className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-bold text-lg">{badge.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
                  </div>
                  <div className="mt-4 w-full pt-4 border-t border-green-200 dark:border-green-800">
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(badge)}
                        className="!text-green-600 dark:!text-green-400 hover:!bg-green-100 dark:hover:!bg-green-500/20"
                        aria-label={`Share ${badge.name} achievement`}
                      >
                        {copiedBadgeId === badge.id ? 'Copied!' : (
                          <>
                            <ShareIcon className="w-4 h-4 mr-2" />
                            <span>Share</span>
                          </>
                        )}
                      </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
             <p className="text-center text-gray-500 dark:text-gray-400 py-4">No badges unlocked yet. Keep logging your activities!</p>
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Locked ({lockedBadges.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {lockedBadges.map(badge => (
              <Card key={badge.id} className="text-center items-center flex flex-col filter grayscale opacity-60">
                <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                  <badge.icon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="font-bold text-lg">{badge.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{badge.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;