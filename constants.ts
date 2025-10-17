import React from 'react';
import { Activity, ActivityCategory, User, Badge, QuizQuestion } from './types';
import { LeafIcon, CarIcon, BoltIcon, ShoppingCartIcon, PlaneIcon, FirstTimerIcon, StreakIcon } from './components/ui/Icons';
import { subDays, formatISO, startOfDay } from 'date-fns';

// Simplified emission factors (kg CO2e per unit)
export const EMISSION_FACTORS = {
  // Transportation (per km)
  car_petrol: 0.192,
  car_electric: 0.05,
  bus: 0.105,
  train: 0.04,
  flight_short: 0.255,
  bike: 0,
  
  // Energy (per kWh)
  electricity: 0.475,
  
  // Food (per meal)
  meal_vegan: 0.5,
  meal_vegetarian: 1.0,
  meal_meat: 3.0,

  // Goods & Services (per item/purchase)
  electronics: 50,
  fashion: 10,
};

export const activityOptions = {
    [ActivityCategory.Transportation]: [
        { value: 'car_petrol', label: 'Petrol Car', unit: 'km' },
        { value: 'car_electric', label: 'Electric Car', unit: 'km' },
        { value: 'bus', label: 'Bus', unit: 'km' },
        { value: 'train', label: 'Train', unit: 'km' },
        { value: 'flight_short', label: 'Short Flight', unit: 'km' },
        { value: 'bike', label: 'Bicycle / Walk', unit: 'km' },
    ],
    [ActivityCategory.Energy]: [
        { value: 'electricity', label: 'Electricity Usage', unit: 'kWh' },
    ],
    [ActivityCategory.Food]: [
        { value: 'meal_vegan', label: 'Vegan Meal', unit: 'meals' },
        { value: 'meal_vegetarian', label: 'Vegetarian Meal', unit: 'meals' },
        { value: 'meal_meat', label: 'Meat-based Meal', unit: 'meals' },
    ],
    [ActivityCategory.GoodsServices]: [
        { value: 'electronics', label: 'Electronics Purchase', unit: 'items' },
        { value: 'fashion', label: 'Fashion Purchase', unit: 'items' },
    ],
};

export const sampleActivities: Activity[] = [
  { id: '1', category: ActivityCategory.Transportation, description: 'Commute by petrol car (15 km)', co2e: 15 * EMISSION_FACTORS.car_petrol, date: formatISO(subDays(new Date(), 1)), ecoPoints: 10 },
  { id: '2', category: ActivityCategory.Food, description: 'Lunch (Meat)', co2e: EMISSION_FACTORS.meal_meat, date: formatISO(subDays(new Date(), 1)), ecoPoints: 10 },
  { id: '3', category: ActivityCategory.Energy, description: 'Home electricity (5 kWh)', co2e: 5 * EMISSION_FACTORS.electricity, date: formatISO(subDays(new Date(), 2)), ecoPoints: 10 },
  { id: '4', category: ActivityCategory.Transportation, description: 'Cycled to shops (5 km)', co2e: 0, date: formatISO(subDays(new Date(), 3)), ecoPoints: 50 },
  { id: '5', category: ActivityCategory.Food, description: 'Dinner (Vegan)', co2e: EMISSION_FACTORS.meal_vegan, date: formatISO(subDays(new Date(), 4)), ecoPoints: 25 },
  { id: '6', category: ActivityCategory.GoodsServices, description: 'Bought new headphones', co2e: EMISSION_FACTORS.electronics, date: formatISO(subDays(new Date(), 5)), ecoPoints: 10},
  { id: '7', category: ActivityCategory.Transportation, description: 'Bus ride (10 km)', co2e: 10 * EMISSION_FACTORS.bus, date: formatISO(subDays(new Date(), 6)), ecoPoints: 10 },
];

export const leaderboardData: User[] = [
  { id: '1', name: 'Alex Green', avatarUrl: 'https://picsum.photos/id/1005/100/100', ecoPoints: 15200 },
  { id: '2', name: 'Brenda Eco', avatarUrl: 'https://picsum.photos/id/1011/100/100', ecoPoints: 14500 },
  { id: '3', name: 'You', avatarUrl: 'https://picsum.photos/id/1025/100/100', ecoPoints: 13900 },
  { id: '4', name: 'Charlie Leaf', avatarUrl: 'https://picsum.photos/id/1027/100/100', ecoPoints: 12800 },
  { id: '5', name: 'Diana Soil', avatarUrl: 'https://picsum.photos/id/1028/100/100', ecoPoints: 11500 },
];

export const COLORS: { [key in ActivityCategory]: string } = {
  [ActivityCategory.Transportation]: '#3b82f6', // blue-500
  [ActivityCategory.Energy]: '#f97316', // orange-500
  [ActivityCategory.Food]: '#10b981', // emerald-500
  [ActivityCategory.GoodsServices]: '#8b5cf6', // violet-500
};

export const CATEGORY_ICONS: { [key in ActivityCategory]: React.FC<{className?: string}> } = {
  [ActivityCategory.Transportation]: CarIcon,
  [ActivityCategory.Energy]: BoltIcon,
  [ActivityCategory.Food]: LeafIcon,
  [ActivityCategory.GoodsServices]: ShoppingCartIcon,
};


const calculateStreak = (activities: Activity[]): number => {
    if (activities.length === 0) return 0;

    const sortedUniqueDays = [...new Set(activities.map(a => startOfDay(new Date(a.date)).getTime()))].sort((a, b) => b - a);

    if (sortedUniqueDays.length === 0) return 0;
    
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));

    // A streak is only current if the last log was today or yesterday.
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
        break; // Gap found, streak ends
      }
    }
    return streak;
};


export const badges: Badge[] = [
  {
    id: 'first_log',
    name: 'First Step',
    description: 'Log your very first activity.',
    icon: FirstTimerIcon,
    isUnlocked: (activities) => activities.length > 0,
  },
  {
    id: 'eco_commuter',
    name: 'Eco-Commuter',
    description: 'Log a zero-emission commute (e.g., biking).',
    icon: CarIcon,
    isUnlocked: (activities) => activities.some(a => a.category === ActivityCategory.Transportation && a.co2e === 0),
  },
  {
    id: 'plant_power',
    name: 'Plant Power',
    description: 'Log 5 vegan meals.',
    icon: LeafIcon,
    isUnlocked: (activities) => activities.filter(a => a.category === ActivityCategory.Food && a.description.toLowerCase().includes('vegan')).length >= 5,
  },
  {
    id: 'energy_saver',
    name: 'Energy Saver',
    description: 'Log an energy usage below 2 kg CO2e.',
    icon: BoltIcon,
    isUnlocked: (activities) => activities.some(a => a.category === ActivityCategory.Energy && a.co2e < 2),
  },
  {
    id: 'conscious_consumer',
    name: 'Conscious Consumer',
    description: 'Log an activity in Goods & Services.',
    icon: ShoppingCartIcon,
    isUnlocked: (activities) => activities.some(a => a.category === ActivityCategory.GoodsServices),
  },
  {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'You logged a flight. Consider offsetting!',
    icon: PlaneIcon,
    isUnlocked: (activities) => activities.some(a => a.description.toLowerCase().includes('flight')),
  },
  {
    id: 'streak_3',
    name: 'On a Roll',
    description: 'Log an activity for 3 days in a row.',
    icon: StreakIcon,
    isUnlocked: (activities) => calculateStreak(activities) >= 3,
  },
  {
    id: 'streak_7',
    name: 'Habit Builder',
    description: 'Log an activity for 7 days in a row.',
    icon: StreakIcon,
    isUnlocked: (activities) => calculateStreak(activities) >= 7,
  }
];

export const quizQuestions: QuizQuestion[] = [
  {
    question: "Which of the following is NOT a renewable energy source?",
    options: ["Solar", "Wind", "Natural Gas", "Hydroelectric"],
    correctAnswerIndex: 2,
    explanation: "Natural gas is a fossil fuel, a non-renewable source of energy. Solar, wind, and hydroelectric power are all renewable."
  },
  {
    question: "What does the term 'composting' refer to?",
    options: ["Recycling plastics", "Reducing water usage", "Decomposing organic waste", "Creating energy from waste"],
    correctAnswerIndex: 2,
    explanation: "Composting is the natural process of recycling organic matter, such as leaves and food scraps, into a valuable fertilizer."
  },
  {
    question: "Approximately how long does it take for a plastic bottle to decompose?",
    options: ["10 years", "50 years", "100 years", "450 years"],
    correctAnswerIndex: 3,
    explanation: "It takes around 450 years for a typical plastic bottle to decompose, which is why reducing plastic use and recycling is so important."
  },
  {
    question: "Which of these foods has the highest carbon footprint per kilogram?",
    options: ["Lentils", "Chicken", "Beef", "Potatoes"],
    correctAnswerIndex: 2,
    explanation: "Beef has a significantly higher carbon footprint compared to other foods due to methane emissions from cattle and land use for grazing."
  },
  {
    question: "What is 'fast fashion'?",
    options: ["A style of clothing", "Inexpensive clothing produced rapidly", "Custom-made clothing", "Athletic wear"],
    correctAnswerIndex: 1,
    explanation: "Fast fashion refers to the business model of replicating recent catwalk trends and high-fashion designs, mass-producing them at low cost, and bringing them to retail stores quickly."
  },
  {
    question: "Which of these actions helps conserve water at home?",
    options: ["Taking longer showers", "Fixing leaky faucets", "Watering the lawn daily", "Washing small loads of laundry"],
    correctAnswerIndex: 1,
    explanation: "A small drip from a leaky faucet can waste gallons of water every day. Fixing it is a simple and effective way to conserve water."
  },
  {
    question: "What is the main benefit of using LED light bulbs over incandescent bulbs?",
    options: ["They are cheaper to buy", "They produce more heat", "They use significantly less energy", "They come in more colors"],
    correctAnswerIndex: 2,
    explanation: "LED bulbs are highly energy-efficient, using up to 85% less energy and lasting much longer than traditional incandescent bulbs."
  },
  {
    question: "What do the three arrows in the recycling symbol represent?",
    options: ["Reduce, Reuse, Recycle", "Air, Water, Land", "Plastics, Paper, Glass", "Past, Present, Future"],
    correctAnswerIndex: 0,
    explanation: "The three arrows represent the three key principles of sustainability: Reduce the amount of waste you create, Reuse items when possible, and Recycle materials."
  },
  {
    question: "What is carbon offsetting?",
    options: ["A way to measure your carbon footprint", "A tax on carbon emissions", "Compensating for your emissions by funding an equivalent CO2 saving elsewhere", "Ignoring your carbon emissions"],
    correctAnswerIndex: 2,
    explanation: "Carbon offsetting is a mechanism to compensate for your carbon footprint by investing in projects that reduce greenhouse gas emissions, such as reforestation or renewable energy."
  },
  {
    question: "Which of these is a major cause of deforestation?",
    options: ["Building national parks", "Sustainable logging", "Urban gardening", "Clearing land for agriculture"],
    correctAnswerIndex: 3,
    explanation: "A primary driver of deforestation is clearing forests to make space for crops and livestock grazing, particularly for products like palm oil and beef."
  }
];