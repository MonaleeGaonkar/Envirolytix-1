import { Activity, ActivityCategory } from '../types';
import { EMISSION_FACTORS, activityOptions } from '../constants';

export const calculateFootprint = (
  category: ActivityCategory,
  type: string,
  value: number
): Pick<Activity, 'description' | 'co2e' | 'ecoPoints'> => {
  let co2e = 0;
  let description = '';

  switch (category) {
    case ActivityCategory.Transportation:
      const distance = Number(value);
      // Ensure value is a valid, non-negative number before proceeding.
      if (isNaN(distance) || distance < 0) {
        co2e = 0;
        description = `Invalid transportation distance`;
        break;
      }

      switch (type) {
        case 'car_petrol':
          co2e = distance * EMISSION_FACTORS.car_petrol;
          description = `Drove a petrol car (${distance} km)`;
          break;
        case 'car_electric':
          co2e = distance * EMISSION_FACTORS.car_electric;
          description = `Drove an electric car (${distance} km)`;
          break;
        case 'bus':
          co2e = distance * EMISSION_FACTORS.bus;
          description = `Took the bus (${distance} km)`;
          break;
        case 'train':
          co2e = distance * EMISSION_FACTORS.train;
          description = `Train journey (${distance} km)`;
          break;
        case 'flight_short':
          co2e = distance * EMISSION_FACTORS.flight_short;
          description = `Short-haul flight (${distance} km)`;
          break;
        case 'bike':
          co2e = distance * EMISSION_FACTORS.bike;
          description = `Cycled (${distance} km)`;
          break;
        default:
          co2e = 0;
          description = `Unknown transportation (${distance} km)`;
          break;
      }
      
      // Final guard to prevent NaN values from propagating
      if (isNaN(co2e)) {
        co2e = 0;
      }
      break;

    case ActivityCategory.Energy:
      const kwh = value;
      switch (type) {
        case 'electricity':
          co2e = kwh * EMISSION_FACTORS.electricity;
          description = `Used electricity (${kwh} kWh)`;
          break;
      }
      break;
    
    case ActivityCategory.Food:
      const meals = value;
      switch (type) {
        case 'meal_vegan':
          co2e = meals * EMISSION_FACTORS.meal_vegan;
          description = `Ate ${meals} vegan meal(s)`;
          break;
        case 'meal_vegetarian':
          co2e = meals * EMISSION_FACTORS.meal_vegetarian;
          description = `Ate ${meals} vegetarian meal(s)`;
          break;
        case 'meal_meat':
            co2e = meals * EMISSION_FACTORS.meal_meat;
            description = `Ate ${meals} meat-based meal(s)`;
            break;
      }
      break;

    case ActivityCategory.GoodsServices:
        const items = value;
        switch (type) {
            case 'electronics':
                co2e = items * EMISSION_FACTORS.electronics;
                description = `Purchased ${items} electronic item(s)`;
                break;
            case 'fashion':
                co2e = items * EMISSION_FACTORS.fashion;
                description = `Purchased ${items} fashion item(s)`;
                break;
        }
        break;
  }

  // Calculate EcoPoints
  let ecoPoints = 10; // Base points for any log
  if (co2e === 0) {
    ecoPoints += 40; // 50 total for zero-emission
  } else if (co2e < 1) {
    ecoPoints += 15; // 25 total for low-emission
  }

  return { description, co2e, ecoPoints };
};