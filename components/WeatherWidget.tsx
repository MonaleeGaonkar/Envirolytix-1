import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/weatherService';
import { generateWeatherInsight } from '../services/geminiService';
import { WeatherData, WeatherIconType } from '../types';
import Card from './ui/Card';
import { SunIcon, CloudIcon, RainIcon, SparklesIcon } from './ui/Icons';

const WeatherIcon: React.FC<{ icon: WeatherIconType, className?: string }> = ({ icon, className }) => {
    switch (icon) {
        case 'sunny':
            return <SunIcon className={className} />;
        case 'cloudy':
            return <CloudIcon className={className} />;
        case 'partly-cloudy': // For simplicity, using cloud icon for partly cloudy too
            return <CloudIcon className={className} />;
        case 'rainy':
            return <RainIcon className={className} />;
        default:
            return <CloudIcon className={className} />;
    }
};

const WeatherWidget: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWeatherAndInsight = async () => {
            try {
                setIsLoading(true);
                const weatherData = await getWeather();
                setWeather(weatherData);

                let streamedText = '';
                const insightStream = generateWeatherInsight(weatherData);
                for await (const chunk of insightStream) {
                    streamedText += chunk;
                    setInsight(streamedText);
                }
            } catch (error) {
                console.error("Failed to load weather data or insight:", error);
                setInsight("Could not load a tip at this time.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeatherAndInsight();
    }, []);

    if (isLoading && !weather) {
        return (
            <Card className="animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div>
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full w-32 mb-2"></div>
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>
                </div>
            </Card>
        );
    }
    
    if (!weather) {
         return (
            <Card>
                <p>Could not load weather data.</p>
            </Card>
        );
    }


    return (
        <Card className="flex flex-col sm:flex-row items-center gap-6 p-4">
            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-blue-500">
                    <WeatherIcon icon={weather.icon} className="w-16 h-16" />
                </div>
                <div>
                    <p className="font-semibold text-gray-500 dark:text-gray-400">{weather.location}</p>
                    <p className="text-4xl font-bold">{weather.temperature}°C</p>
                    <p className="text-gray-600 dark:text-gray-300">{weather.condition}</p>
                </div>
            </div>
            <div className="w-full sm:w-px h-px sm:h-20 bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex-1 flex items-start gap-3">
                <SparklesIcon className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                   {insight || <span className="opacity-50">Generating tip...</span>}
                </p>
            </div>
        </Card>
    );
};

export default WeatherWidget;
