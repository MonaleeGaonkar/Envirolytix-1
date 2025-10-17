import React, { useState, useCallback, useEffect } from 'react';
import { Activity, Page } from '../types';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import ActivityLog from '../components/ActivityLog';
import Achievements from '../components/Achievements';
import Leaderboard from '../components/Leaderboard';
import Resources from '../components/Resources';
import Game from '../components/Game';
import TripPlanner from '../components/TripPlanner';
import { sampleActivities } from '../constants';
import { LogoIcon, GameIcon } from '../components/ui/Icons';
import ChatWidget from '../components/ChatWidget';
import ThemeToggle from '../components/ThemeToggle';
import Button from '../components/ui/Button';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [activities, setActivities] = useState<Activity[]>(sampleActivities);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState<number>(5.0); // Default goal in kg CO2e
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme') as Theme;
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const addActivity = useCallback((activity: Activity) => {
    setActivities(prev => [...prev, activity].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    if (activity.description.includes('EcoQuiz')) {
       setCurrentPage('game');
    } else {
       setCurrentPage('logActivity');
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard activities={activities} dailyGoal={dailyGoal} onGoalChange={setDailyGoal} />;
      case 'logActivity':
        return <ActivityLog onAddActivity={addActivity} activities={activities} />;
      case 'achievements':
        return <Achievements activities={activities} />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'resources':
        return <Resources />;
      case 'game':
        return <Game onQuizComplete={addActivity} />;
      case 'tripPlanner':
        return <TripPlanner />;
      default:
        return <Dashboard activities={activities} dailyGoal={dailyGoal} onGoalChange={setDailyGoal} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:justify-end sticky top-0 z-20">
           <div className="flex items-center gap-2 lg:hidden text-gray-800 dark:text-gray-200">
              <LogoIcon className="h-8 w-8" />
              <h1 className="text-xl font-bold">ENVIRO-LYTIX</h1>
            </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              onClick={() => setCurrentPage('game')} 
              aria-label="Play EcoQuiz"
            >
              <GameIcon className="h-6 w-6" />
            </Button>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <Button variant="ghost" onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>
      
      <ChatWidget activities={activities} dailyGoal={dailyGoal} />
    </div>
  );
};

export default App;