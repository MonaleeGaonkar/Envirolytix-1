import { WeatherData } from '../types';

// Mock weather data since we don't have a real API key.
const mockWeatherData: WeatherData[] = [
    {
        temperature: 5,
        condition: "Chilly & Clear",
        icon: 'sunny',
        location: 'London, UK'
    },
    {
        temperature: 28,
        condition: "Hot & Sunny",
        icon: 'sunny',
        location: 'London, UK'
    },
    {
        temperature: 12,
        condition: "Rainy Day",
        icon: 'rainy',
        location: 'London, UK'
    },
    {
        temperature: 18,
        condition: "Partly Cloudy",
        icon: 'partly-cloudy',
        location: 'London, UK'
    },
    {
        temperature: 15,
        condition: "Cloudy & Overcast",
        icon: 'cloudy',
        location: 'London, UK'
    }
];

// In a real application, you would use navigator.geolocation to get user's location
// and then fetch from a real weather API.
export const getWeather = async (): Promise<WeatherData> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const randomWeather = mockWeatherData[Math.floor(Math.random() * mockWeatherData.length)];
            resolve(randomWeather);
        }, 1000); // Simulate network delay
    });
};
