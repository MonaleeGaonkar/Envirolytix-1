import {
  ChatMessage,
  Activity,
  Badge,
  ActivityCategory,
  WeatherData,
  TripCalculation,
} from "../types";

// No external Gemini SDK installed in this environment. Provide a lightweight mock
// that returns canned responses so the UI can function without the real API.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn(
    "GEMINI_API_KEY environment variable not set. Using a mock service."
  );
}

const ai: any = null;
let model: any = null;

const summarizeActivities = (
  activities: Activity[],
  unlockedBadges: Badge[],
  dailyGoal: number
): string => {
  if (activities.length === 0) {
    return `The user has not logged any activities yet. Their daily goal is ${dailyGoal.toFixed(
      2
    )} kg CO2e.`;
  }

  const summary: string[] = [];
  const totalsByCategory: Record<ActivityCategory, number> = {
    [ActivityCategory.Transportation]: 0,
    [ActivityCategory.Energy]: 0,
    [ActivityCategory.Food]: 0,
    [ActivityCategory.GoodsServices]: 0,
  };

  const totalToday = activities
    .filter(
      (a) => new Date(a.date).toDateString() === new Date().toDateString()
    )
    .reduce((sum, a) => sum + a.co2e, 0);

  summary.push(
    `User's daily emissions goal: ${dailyGoal.toFixed(
      2
    )} kg CO2e. Today's total: ${totalToday.toFixed(2)} kg CO2e.`
  );
  if (totalToday > dailyGoal) {
    summary.push(`They have exceeded their goal for today.`);
  } else {
    summary.push(`They are on track to meet their goal.`);
  }

  let zeroEmissionActivities = 0;
  activities.forEach((a) => {
    totalsByCategory[a.category] += a.co2e;
    if (a.co2e === 0) {
      zeroEmissionActivities++;
    }
  });

  const sortedCategories = Object.entries(totalsByCategory).sort(
    ([, a], [, b]) => b - a
  );

  summary.push(
    `Highest emissions are from ${
      sortedCategories[0][0]
    } (${sortedCategories[0][1].toFixed(2)} kg CO2e).`
  );
  if (sortedCategories[1][1] > 0) {
    summary.push(
      `Next highest is ${
        sortedCategories[1][0]
      } (${sortedCategories[1][1].toFixed(2)} kg CO2e).`
    );
  }

  if (zeroEmissionActivities > 0) {
    summary.push(
      `User has logged ${zeroEmissionActivities} zero-emission activities. Great job!`
    );
  }

  if (unlockedBadges.length > 0) {
    summary.push(
      `Unlocked badges: ${unlockedBadges.map((b) => b.name).join(", ")}.`
    );
  } else {
    summary.push("No badges unlocked yet.");
  }

  return summary.join(" ");
};

export async function createChatSession(
  activities: Activity[],
  unlockedBadges: Badge[],
  dailyGoal: number
) {
  if (!ai || !model) {
    console.warn("AI service not initialized. Using mock responses.");
    return null;
  }

  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts:
            "Hello! I'd like to track my carbon footprint and get eco-friendly advice.",
        },
        {
          role: "model",
          parts:
            "Hi! I'm your eco-coach, here to help you make sustainable choices. I'll provide personalized tips based on your activities and help you reach your carbon reduction goals.",
        },
      ],
    });

    // Send context about the user's activities
    const context = summarizeActivities(activities, unlockedBadges, dailyGoal);
    await chat.sendMessage(context);

    return chat;
  } catch (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
}

export async function* streamChatResponse(
  chat: any | null,
  message: string
): AsyncGenerator<string> {
  if (!chat) {
    yield "I'm sorry, but I'm currently unavailable. Please try again later.";
    return;
  }

  try {
    const result = await chat.sendMessage(message);
    const response = await result.response;
    yield response.text();
  } catch (error) {
    console.error("Error in chat response:", error);
    yield "I apologize, but I encountered an error. Please try again.";
  }
}

export async function* generateProactiveTip(
  activities: Activity[],
  unlockedBadges: Badge[],
  dailyGoal: number
): AsyncGenerator<string> {
  if (!ai || !model) {
    yield "Here's a tip: Consider using public transportation or cycling for short trips to reduce your carbon footprint.";
    return;
  }

  const activitySummary = summarizeActivities(
    activities,
    unlockedBadges,
    dailyGoal
  );
  const prompt = `You are "Green Coach," an AI assistant. Based on the following summary of a user's activity, provide ONE friendly, encouraging, and actionable tip to help them reduce their carbon footprint and meet their daily goal. The tip should be specific and directly related to the user's data. Be positive and concise.
    
USER ACTIVITY SUMMARY: ${activitySummary}

YOUR TIP:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    yield response.text();
  } catch (error) {
    console.error("Error generating tip:", error);
    yield "Consider small changes in your daily routine to reduce your environmental impact.";
  }
}

export async function* generateWeatherInsight(
  weather: WeatherData
): AsyncGenerator<string> {
  if (!ai || !model) {
    yield `With the weather being ${weather.condition} at ${weather.temperature}°C, it's a great day to line-dry your clothes instead of using a dryer to save energy!`;
    return;
  }

  const prompt = `You are "Green Coach," an AI assistant for the Enviro-Lytix app. Your goal is to provide a friendly, encouraging, and actionable tip to help users reduce their carbon footprint, based on the current weather. Be positive, concise, and practical.

CURRENT WEATHER:
- Condition: ${weather.condition}
- Temperature: ${weather.temperature}°C

Based on this weather, provide ONE actionable tip. For example, if it's cold, suggest heating tips. If it's sunny, suggest line-drying clothes or enjoying the outdoors locally. If it's rainy, suggest indoor eco-friendly activities. Keep the tip to one or two sentences.

YOUR TIP:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    yield response.text();
  } catch (error) {
    console.error("Error generating weather insight:", error);
    yield "I'm sorry, I'm having trouble generating a weather tip. Please try again later.";
  }
}

export async function* generateTripSuggestion(
  originalTrip: TripCalculation,
  bestOption: TripCalculation,
  allOptions: TripCalculation[]
): AsyncGenerator<string> {
  if (!ai || !model) {
    const isBestChoice = originalTrip.type === bestOption.type;
    if (isBestChoice) {
      yield `Great choice! For your ${originalTrip.distance}km trip, the ${originalTrip.mode} is the most eco-friendly option. Enjoy your low-impact journey!`;
    } else {
      yield `For your ${originalTrip.distance}km trip, switching from a ${
        originalTrip.mode
      } to a ${bestOption.mode} is a great choice! You could save around ${(
        originalTrip.co2e - bestOption.co2e
      ).toFixed(1)} kg of CO2e.`;
    }
    return;
  }

  const allOptionsText = allOptions
    .map((alt) => `- ${alt.mode}: ${alt.co2e.toFixed(2)} kg CO2e`)
    .join("\n");
  const prompt =
    originalTrip.type === bestOption.type
      ? `You are "Green Coach," an AI assistant for the Enviro-Lytix app. A user has planned a trip and has already selected the most eco-friendly option.

USER'S PLANNED TRIP & BEST OPTION:
- Mode: ${originalTrip.mode}
- Distance: ${originalTrip.distance} km
- Estimated Emissions: ${originalTrip.co2e.toFixed(2)} kg CO2e

Based on this, provide a short, friendly, and encouraging message congratulating them on their sustainable choice. You can also mention a small additional benefit of their chosen travel mode (e.g., relaxing, seeing the scenery).

YOUR MESSAGE:`
      : `You are "Green Coach," an AI assistant for the Enviro-Lytix app. A user has planned a trip. Provide a friendly, encouraging, and actionable suggestion based on their plan and the best alternative.

USER'S PLANNED TRIP:
- Mode: ${originalTrip.mode}
- Distance: ${originalTrip.distance} km
- Estimated Emissions: ${originalTrip.co2e.toFixed(2)} kg CO2e

BEST ALTERNATIVE:
- Mode: ${bestOption.mode}
- Estimated Emissions: ${bestOption.co2e.toFixed(2)} kg CO2e

ALL TRIP OPTIONS (for context):
${allOptionsText}

Based on this data, provide ONE actionable suggestion. Briefly compare the user's chosen mode to the best available option, highlight the CO2e savings, and perhaps mention another small benefit of the greener option. Keep it concise (1-2 sentences).

YOUR SUGGESTION:`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    yield response.text();
  } catch (error) {
    console.error("Error generating trip suggestion:", error);
    yield "I'm sorry, I'm having trouble generating a suggestion. Please try again later.";
  }
}
