import React, { useState, useCallback } from 'react';
import { ActivityCategory, TripCalculation } from '../types';
import { calculateFootprint } from '../services/carbonService';
import { generateTripSuggestion } from '../services/geminiService';
import Card from './ui/Card';
import Button from './ui/Button';
import { SparklesIcon, CarIcon, BoltIcon, BusIcon, TrainIcon, PlaneIcon, TrophyIcon } from './ui/Icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList, Label } from 'recharts';

// In a real app, this would use a mapping API. Here, we mock it.
const estimateDistance = (origin: string, destination: string): number => {
  if (!origin.trim() || !destination.trim()) return 0;
  const clampedLength = Math.max(5, Math.min(origin.length + destination.length, 50));
  const distance = clampedLength * 25 + Math.floor(Math.random() * 200);
  return Math.max(10, distance); // ensure a minimum distance
};

const transportOptions = [
    { value: 'car_petrol', label: 'Petrol Car', icon: CarIcon },
    { value: 'car_electric', label: 'Electric Car', icon: BoltIcon },
    { value: 'bus', label: 'Bus', icon: BusIcon },
    { value: 'train', label: 'Train', icon: TrainIcon },
    { value: 'flight_short', label: 'Short Flight', icon: PlaneIcon },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const Icon = data.icon;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
            <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <p className="font-bold text-gray-800 dark:text-gray-200">{label}</p>
        </div>
        <p className="text-blue-500 font-semibold">{`Emissions: ${data.co2e.toFixed(2)} kg CO₂e`}</p>
      </div>
    );
  }
  return null;
};

const CustomYAxisTick = ({ x, y, payload, allTripOptions }: any) => {
    const { value } = payload;
    const optionData = allTripOptions.find((opt: TripCalculation) => opt.mode === value);
    if (!optionData) return null;

    const Icon = optionData.icon;
    const isBest = allTripOptions.length > 0 && allTripOptions[0].type === optionData.type;
    
    return (
        <g transform={`translate(${x},${y})`}>
            <foreignObject x={-95} y={-12} width={90} height={24}>
                <div className="flex items-center justify-end gap-2 text-right w-full h-full">
                    {isBest && <TrophyIcon className="w-4 h-4 text-yellow-400" />}
                    <span className="text-sm truncate font-medium text-gray-700 dark:text-gray-300">{value}</span>
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
            </foreignObject>
        </g>
    );
};


const TripPlanner: React.FC = () => {
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [mode, setMode] = useState('car_petrol');
    const [allTripOptions, setAllTripOptions] = useState<TripCalculation[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<TripCalculation | null>(null);
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCalculate = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!origin || !destination) {
            alert("Please enter both an origin and a destination.");
            return;
        }
        setIsLoading(true);
        setAllTripOptions([]);
        setSelectedTrip(null);
        setSuggestion('');

        await new Promise(resolve => setTimeout(resolve, 500));

        const distance = estimateDistance(origin, destination);
        
        const calculatedOptions: TripCalculation[] = transportOptions.map(opt => {
            const { co2e } = calculateFootprint(ActivityCategory.Transportation, opt.value, distance);
            return { mode: opt.label, distance, co2e, type: opt.value, icon: opt.icon };
        });

        const selectedOption = calculatedOptions.find(opt => opt.type === mode);
        setSelectedTrip(selectedOption || null);
        
        calculatedOptions.sort((a, b) => b.co2e - a.co2e); // Sort descending for vertical bar chart
        setAllTripOptions(calculatedOptions);

        const bestOption = calculatedOptions.reduce((prev, current) => (prev.co2e < current.co2e) ? prev : current);

        if (selectedOption && bestOption) {
            let streamedText = '';
            const suggestionStream = generateTripSuggestion(selectedOption, bestOption, calculatedOptions);
            for await (const chunk of suggestionStream) {
                streamedText += chunk;
                setSuggestion(streamedText);
            }
        }
        
        setIsLoading(false);
    }, [origin, destination, mode]);
    
    const bestOption = allTripOptions.length > 0 ? allTripOptions.reduce((prev, current) => (prev.co2e < current.co2e) ? prev : current) : null;

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="text-center">
                <h1 className="text-4xl font-bold">Trip Planner</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Estimate your travel footprint and find greener routes.</p>
            </div>
            
            <Card>
                <form onSubmit={handleCalculate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="origin" className="block text-sm font-medium">From</label>
                            <input type="text" id="origin" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g., London" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium">To</label>
                            <input type="text" id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g., Paris" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="mode" className="block text-sm font-medium">Mode</label>
                        <select id="mode" value={mode} onChange={e => setMode(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            {transportOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Calculating...' : 'Calculate Trip'}
                    </Button>
                </form>
            </Card>

            {isLoading && (
                 <div className="text-center py-8">
                    <div role="status">
                        <svg aria-hidden="true" className="inline w-10 h-10 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                        </svg>
                        <span className="sr-only">Loading...</span>
                    </div>
                 </div>
            )}
            
            {selectedTrip && bestOption && !isLoading && (
                <Card>
                    <div className="mb-4">
                        <h2 className="text-xl font-bold">Trip Results: <span className="text-blue-600 dark:text-blue-400">{origin} to {destination}</span></h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Estimated distance: ~{selectedTrip.distance} km</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-3">
                            <h3 className="font-semibold mb-2 text-center lg:text-left">Emissions Comparison</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={allTripOptions} layout="vertical" margin={{ top: 5, right: 50, left: 40, bottom: 20 }}>
                                    <XAxis type="number" stroke="currentColor" fontSize={12} domain={[0, 'dataMax + 10']}>
                                        <Label value="kg CO₂e" offset={-15} position="insideBottom" />
                                    </XAxis>
                                    <YAxis type="category" dataKey="mode" stroke="currentColor" width={100} interval={0} tick={<CustomYAxisTick allTripOptions={allTripOptions} />} />
                                    <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} content={<CustomTooltip />} />
                                    <Bar dataKey="co2e" radius={[0, 4, 4, 0]}>
                                        {allTripOptions.map((entry, index) => {
                                            const isSelected = entry.type === mode;
                                            const isBest = bestOption && entry.type === bestOption.type;
                                            let color = '#9ca3af'; // gray-400
                                            if (isSelected) color = '#3b82f6'; // blue-500
                                            if (isBest) color = '#22c55e'; // green-500
                                            if (isSelected && isBest) color = '#10b981'; // emerald-500
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                        <LabelList 
                                            dataKey="co2e" 
                                            position="right" 
                                            formatter={(value: number) => value.toFixed(2)} 
                                            className="font-semibold text-sm fill-gray-700 dark:fill-gray-300"
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="lg:col-span-2 space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Summary</h3>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-blue-500">
                                        <div className="flex items-center gap-2">
                                            <selectedTrip.icon className="w-6 h-6 text-blue-500" />
                                            <p className="font-bold">{selectedTrip.mode}</p>
                                        </div>
                                        <p className="text-right text-lg font-bold mt-1">{selectedTrip.co2e.toFixed(2)} <span className="text-sm font-normal">kg CO₂e</span></p>
                                        <p className="text-right text-xs text-gray-500 dark:text-gray-400">Your Choice</p>
                                    </div>
                                    
                                    {selectedTrip.type !== bestOption.type && (
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-green-500">
                                            <div className="flex items-center gap-2">
                                                <TrophyIcon className="w-6 h-6 text-yellow-400" />
                                                <p className="font-bold">{bestOption.mode}</p>
                                            </div>
                                            <p className="text-right text-lg font-bold mt-1">{bestOption.co2e.toFixed(2)} <span className="text-sm font-normal">kg CO₂e</span></p>
                                            <p className="text-right text-xs text-green-600 font-semibold">Greenest Choice (-{(selectedTrip.co2e - bestOption.co2e).toFixed(2)} kg)</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {suggestion && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <SparklesIcon className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="font-bold text-blue-800 dark:text-blue-300">Green Coach Tip</h3>
                                            <p className="text-sm text-blue-700 dark:text-blue-300/90">{suggestion}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default TripPlanner;