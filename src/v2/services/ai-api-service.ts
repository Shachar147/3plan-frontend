import {endpoints} from "../utils/endpoints";
import {getRandomEnumValue} from "../../utils/utils";
import {apiPost} from "../../helpers/api";


export enum Budget {
    low = 'low',
    medium = 'medium',
    high = 'high'
}

export enum WonderPlanTravelingWith {
    solo = 'solo',
    couple = 'couple',
    family = 'family',
    friends = 'friends'
}

export enum WonderPlanActivityType {
    beaches = 'beaches',
    city_sightseeing = 'city_sightseeing',
    outdoor_adventures = 'outdoor_adventures',
    festivals_or_events = 'festivals_or_events',
    food_exploration = 'food_exploration',
    nightlife = 'nightlife',
    shopping = 'shopping',
    spa_wellness = 'spa_wellness'
}

export default class AiApiService {
    createTemplate = async (destination: string) => {
        const result = await apiPost(endpoints.v2.ai.createTemplate, {
            "destination": destination,
            "dateRange": {
                "start": "2030-01-01",
                "end": "2030-01-07"
            },
            "calendarLocale": "en",
            "budget": getRandomEnumValue(Budget),
            "travelingWith": getRandomEnumValue(WonderPlanTravelingWith),
            // "activityTypes": [
            //     "beaches",
            //     "nightlife",
            //     "outdoor_adventures",
            //     "food_exploration"
            // ]
        });
        if (result) {
            return result?.data;
        }
        return {};
    }
}