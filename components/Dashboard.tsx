import React, { useState } from 'react';
import { Activity, ActivityCategory } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, isWithinInterval, subDays, startOfDay } from 'date-fns';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, SparklesIcon, CalculatorIcon, EcoPointsIcon, StreakIcon, TargetIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from './ui/Icons';
import { calculateFootprint } from '../services/carbonService';
import { activityOptions, COLORS, CATEGORY_ICONS } from '../constants';
import DinoGame from './DinoGame';
import WeatherWidget from './WeatherWidget';

interface DashboardProps {
  activities: Activity[];
  dailyGoal: number;
  onGoalChange: (newGoal: number) => void;
}

const calculateStreak = (activities: Activity[]): number => {
    if (activities.length === 0) return 0;

    const sortedUniqueDays = [...new Set(activities.map(a => startOfDay(new Date(a.date)).getTime()))].sort((a, b) => b - a);

    if (sortedUniqueDays.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    if (sortedUniqueDays[0] < yesterday.getTime()) {
      return 0;
    }

    let streak = 0;
    let expectedDay = sortedUniqueDays[0];

    for (const dayTime of sortedUniqueDays) {
      if (dayTime === expectedDay) {
        streak++;
        expectedDay = startOfDay(subDays(new Date(expectedDay), 1)).getTime();
      } else {
        break; 
      }
    }
    return streak;
};


const Dashboard: React.FC<DashboardProps> = ({ activities, dailyGoal, onGoalChange }) => {
  const now = new Date();
  
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyGoal.toString());

  const handleSaveGoal = () => {
    const goalValue = parseFloat(newGoal);
    if (!isNaN(goalValue) && goalValue > 0) {
      onGoalChange(goalValue);
      setIsEditingGoal(false);
    } else {
      setNewGoal(dailyGoal.toString());
      alert("Please enter a valid, positive number for your goal.");
    }
  };
  
  const totalToday = activities
    .filter(a => new Date(a.date).toDateString() === now.toDateString())
    .reduce((sum, a) => sum + a.co2e, 0);

  const totalThisWeek = activities
    .filter(a => isWithinInterval(new Date(a.date), { start: subDays(now, 6), end: now }))
    .reduce((sum, a) => sum + a.co2e, 0);
  
  const totalAllTime = activities.reduce((sum, a) => sum + a.co2e, 0);
  const uniqueDays = new Set(activities.map(a => startOfDay(new Date(a.date)).toISOString()));
  const numberOfDaysWithLogs = uniqueDays.size > 0 ? uniqueDays.size : 1;
  const averageDailyEmissions = totalAllTime / numberOfDaysWithLogs;
  
  const totalEcoPoints = activities.reduce((sum, a) => sum + a.ecoPoints, 0);
  const currentStreak = calculateStreak(activities);
  const isGoalMet = totalToday <= dailyGoal;
  const goalProgress = Math.min((totalToday / dailyGoal) * 100, 100);

  const startOfLastWeek = subDays(now, 13);
  const endOfLastWeek = subDays(now, 7);
  const totalLastWeek = activities
    .filter(a => isWithinInterval(new Date(a.date), { start: startOfLastWeek, end: endOfLastWeek }))
    .reduce((sum, a) => sum + a.co2e, 0);

  let comparisonContent;
  if (totalLastWeek > 0) {
      const percentageChange = ((totalThisWeek - totalLastWeek) / totalLastWeek) * 100;
      comparisonContent = (
           <div className={`mt-2 flex items-center text-sm font-semibold ${percentageChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {percentageChange >= 0 ? <ArrowTrendingUpIcon className="h-5 w-5 mr-1" /> : <ArrowTrendingDownIcon className="h-5 w-5 mr-1" />}
              <span>{Math.abs(percentageChange).toFixed(0)}%</span>
              <span className="ml-1 font-normal text-gray-500 dark:text-gray-400">{percentageChange >=0 ? 'more' : 'less'} than last week</span>
          </div>
      );
  } else {
      comparisonContent = <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Log more for weekly trends.</p>;
  }

  const weeklyChartData = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(now, 6 - i);
    const dayActivities = activities.filter(a => new Date(a.date).toDateString() === day.toDateString());
    return {
      name: format(day, 'EEE'),
      date: format(day, 'MMM d'),
      CO2e: dayActivities.reduce((sum, a) => sum + a.co2e, 0),
    };
  });
  
  const categoryData = Object.values(ActivityCategory).map(category => ({
    name: category,
    value: activities
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + a.co2e, 0),
  })).filter(item => item.value > 0);

  const recentActivities = activities.slice(0, 5);

  const [calcCategory, setCalcCategory] = useState<ActivityCategory>(ActivityCategory.Transportation);
  const [calcType, setCalcType] = useState(activityOptions[calcCategory][0].value);
  const [calcValue, setCalcValue] = useState('');
  const [calcResult, setCalcResult] = useState<{description: string, co2e: number} | null>(null);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ActivityCategory;
    setCalcCategory(newCategory);
    setCalcType(activityOptions[newCategory][0].value);
    setCalcValue('');
    setCalcResult(null);
  };

  const handleCalculate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!calcValue || parseFloat(calcValue) <= 0) {
          setCalcResult(null);
          return;
      }
      const result = calculateFootprint(calcCategory, calcType, parseFloat(calcValue));
      setCalcResult(result);
  };

  const currentUnit = activityOptions[calcCategory].find(opt => opt.value === calcType)?.unit || '';
  const inputStyle = "mt-1 block w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="space-y-8">
      <DinoGame />
      <div>
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your progress, gamified. Stay motivated on your eco-journey!</p>
      </div>

      <WeatherWidget />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <Card className="flex flex-col justify-center">
              <div className="flex items-center gap-4">
                  <EcoPointsIcon className="h-10 w-10 text-blue-500" />
                  <div>
                      <h3 className="font-semibold text-sm">Total EcoPoints</h3>
                      <p className="text-2xl font-bold">{totalEcoPoints.toLocaleString()}</p>
                  </div>
              </div>
          </Card>
          <Card className="flex flex-col justify-center">
              <div className="flex items-center gap-4">
                  <StreakIcon className="h-10 w-10 text-orange-500" />
                  <div>
                      <h3 className="font-semibold text-sm">Current Streak</h3>
                      <p className="text-2xl font-bold">{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</p>
                  </div>
              </div>
          </Card>
          
          <Card>
            {isEditingGoal ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveGoal(); }} className="flex flex-col h-full">
                <div className="flex justify-between items-start min-h-[3rem]">
                  <div>
                    <h3 className="font-semibold text-sm">Set Daily Goal</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enter kg CO₂e.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="block w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                    step="0.1"
                  />
                  <Button type="submit" size="sm">Save</Button>
                  <Button onClick={() => setIsEditingGoal(false)} variant="secondary" size="sm" type="button">X</Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start min-h-[3rem]">
                  <div>
                    <h3 className="font-semibold text-sm">Daily Goal</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span className={`font-bold ${isGoalMet ? 'text-green-500' : 'text-red-500'}`}>
                        {totalToday.toFixed(2)}
                      </span> / {dailyGoal.toFixed(2)} kg
                    </p>
                  </div>
                  <Button onClick={() => { setIsEditingGoal(true); setNewGoal(dailyGoal.toString()); }} variant="ghost" size="sm" className="p-1.5">
                      <PencilIcon className="w-4 h-4" />
                  </Button>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-auto">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${goalProgress}%` }}></div>
                </div>
              </div>
            )}
          </Card>

           <Card className="flex flex-col justify-center">
              <h3 className="font-semibold text-sm">Today's Emissions</h3>
              <p className="text-2xl font-bold">{totalToday.toFixed(2)}</p>
              <span className="text-gray-500 dark:text-gray-400 text-xs">kg CO₂e</span>
            </Card>
            <Card className="flex flex-col justify-center">
              <h3 className="font-semibold text-sm">This Week</h3>
               <div className="flex items-baseline gap-1">
                <p className="text-2xl font-bold">{totalThisWeek.toFixed(2)}</p>
                <span className="text-gray-500 dark:text-gray-400 text-xs">kg</span>
              </div>
              {comparisonContent}
            </Card>
             <Card className="flex flex-col justify-center">
              <h3 className="font-semibold text-sm">Daily Average</h3>
              <p className="text-2xl font-bold">{averageDailyEmissions.toFixed(2)}</p>
              <span className="text-gray-500 dark:text-gray-400 text-xs">kg CO₂e</span>
            </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><CalculatorIcon className="w-6 h-6 text-blue-500"/> Quick Calculator</h3>
          <form onSubmit={handleCalculate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calc-category" className="block text-sm font-medium">Category</label>
                  <select id="calc-category" value={calcCategory} onChange={handleCategoryChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    {Object.values(ActivityCategory).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="calc-type" className="block text-sm font-medium">Type</label>
                  <select id="calc-type" value={calcType} onChange={e => setCalcType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                    {activityOptions[calcCategory].map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="calc-value" className="block text-sm font-medium">Amount ({currentUnit})</label>
                <input type="number" id="calc-value" value={calcValue} onChange={e => setCalcValue(e.target.value)} placeholder={`Enter ${currentUnit}`} min="0.1" step="0.1" className="mt-1 block w-full px-3 py-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
              <Button type="submit" className="w-full">
                  Calculate
              </Button>
          </form>
          {calcResult && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <p className="font-semibold text-blue-800 dark:text-blue-300">{calcResult.description}</p>
                  <p className="text-2xl font-bold">{calcResult.co2e.toFixed(2)} kg CO₂e</p>
              </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <h3 className="font-bold text-xl mb-4">Emissions by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                stroke="var(--card-bg)"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as ActivityCategory]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h3 className="font-bold text-xl mb-4">Weekly Emissions Trend (kg CO₂e)</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="currentColor" fontSize={12} />
                <YAxis stroke="currentColor" fontSize={12} />
                <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '0.5rem' }}
                    labelFormatter={(label, payload) => payload?.[0]?.payload.date || label}
                    formatter={(value: number) => [`${value.toFixed(2)} kg CO₂e`, 'CO2e']}
                />
                <Legend />
                <Bar dataKey="CO2e" name="CO2 Emissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 className="font-bold text-xl mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {recentActivities.length > 0 ? (
                recentActivities.map(activity => (
                  <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-semibold">{activity.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{format(new Date(activity.date), 'MMM d, yyyy')} - <span style={{color: COLORS[activity.category]}}>{activity.category}</span></p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{activity.co2e.toFixed(2)} kg</p>
                        <p className="text-xs text-green-600 font-semibold">+{activity.ecoPoints} EcoPoints</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Log an activity to see it here.</p>
              )}
            </div>
          </Card>
      </div>
    </div>
  );
};

export default Dashboard;
