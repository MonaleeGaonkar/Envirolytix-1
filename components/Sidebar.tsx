import React from 'react';
import { Page } from '../types';
import { DashboardIcon, LogIcon, AchievementIcon, LeaderboardIcon, ResourcesIcon, LogoIcon, GameIcon, RouteIcon } from './ui/Icons';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  page: Page;
  currentPage: Page;
  onClick: (page: Page) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, page, currentPage, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      currentPage === page
        ? 'bg-blue-600 text-white font-semibold shadow-lg'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <Icon className="h-6 w-6" />
    <span className="text-sm">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setOpen }) => {
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    if(window.innerWidth < 1024) { // Close sidebar on mobile after navigation
      setOpen(false);
    }
  };

  const navItems = [
    { icon: DashboardIcon, label: 'Dashboard', page: 'dashboard' as Page },
    { icon: LogIcon, label: 'Log Activity', page: 'logActivity' as Page },
    { icon: RouteIcon, label: 'Trip Planner', page: 'tripPlanner' as Page },
    { icon: AchievementIcon, label: 'Achievements', page: 'achievements' as Page },
    { icon: LeaderboardIcon, label: 'Leaderboard', page: 'leaderboard' as Page },
    { icon: ResourcesIcon, label: 'Resources', page: 'resources' as Page },
    { icon: GameIcon, label: 'EcoQuiz', page: 'game' as Page },
  ];

  return (
    <>
      <div className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      <aside className={`fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        <div className="flex items-center justify-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-800 dark:text-gray-200">
            <LogoIcon className="h-10 w-10 text-blue-600" />
            <h1 className="text-2xl font-bold tracking-tight">ENVIRO-LYTIX</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.page} {...item} currentPage={currentPage} onClick={handleNavigation} />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">Transforming Insights into Impact</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;