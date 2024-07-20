import { apiGetPromise } from "../../helpers/api";
import {ENDPOINTS} from "../utils/endpoints";

export const allSources = [
    'Local',
    'GetYourGuide',
    "Dubai.co.il"
];

export const SourceToUrl = (destination: string, page: number): Record<string, string> => {
    const base: Record<string, string> = {
        'Local': `${ENDPOINTS.poi.local}?destination=${destination}&page=${page}`,
        'GetYourGuide': `${ENDPOINTS.poi.external.getyourguide}?destination=${destination}&page=${page}`,
    };
    if (destination === "Dubai"){
        base["Dubai.co.il"] = `${ENDPOINTS.poi.external.dubaicoil}?destination=${destination}&page=${page}`;
    }
    return base;
}

export default class FeedViewApiService {
    getCount = async (destination: string) => {
        const result = await apiGetPromise(this, `${ENDPOINTS.poi.count}/${destination}`);
        if (result) {
            return result?.data;
        }
        return {};
    }

    getItems = async (source: string, destination: string, page: number) => {
        const url = SourceToUrl(destination, page)[source];
        if (!url){
            return Promise.resolve({
                results: [],
                isFinished: true,
                source
            })
        }
        const result = await apiGetPromise(this, url);
        if (result) {
            return result?.data;
        }
        return {
            results: [],
            isFinished: true,
            source
        };
    }

    getMainFeedItems = async () => {
        const result = await apiGetPromise(this,  ENDPOINTS.poi.feed);
        if (result) {
            return result?.data;
        }
        return {
            results: [],
            isFinished: true,
            source: "Local"
        };
    }

    getSearchSuggestions = async (searchKeyword: string) => {
        const result = await apiGetPromise(this,  `${ENDPOINTS.poi.searchSuggestions}/?s=${searchKeyword}`);
        if (result) {
            return result?.data;
        }
        return [];
    }

    getItemsOld = async () => {
        return {
            "results": [
                {
                    "name": "Dubai: Burj Khalifa Level 124 and 125 Entry Ticket",
                    "destination": "Dubai",
                    "description": "Witness the views over Dubai from the observation deck of the iconic Burj Khalifa, the world's tallest building. Ascend to the 124th and 125th floors for a panoramic 360-degree view over the Arabian Gulf.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/5bb551eebafcde0c6d3d354bf15aa98cc366f201368b2ce871bd39a34ecdec21.jpg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/burj-khalifa-ticket-t49019/",
                    "duration": "01:30",
                    "category": "תיירות",
                    "priority": "high",
                    "location": {
                        "latitude": 25.197405,
                        "longitude": 55.27433099999996
                    },
                    "rate": {
                        "quantity": 61513,
                        "rating": 4.48671
                    },
                    "addedAt": 1719078575184,
                    "status": "active",
                    "isVerified": true,
                    "price": 183,
                    "currency": "ILS",
                    "extra": {
                        "price": 183,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Desert Safari, Quad Bike, Camel Ride & Al Khayma Camp",
                    "destination": "Dubai",
                    "description": "Explore Dubai's desert terrains and enjoy desert sports like dune bashing and sandboarding on this desert safari. Add to the thrills with optional quad bike and camel rides, and savor an optional BBQ.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/620733cf78f74.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/from-dubai-private-6-hour-desert-safari-dubai-w-bbq-t67792/",
                    "duration": "05:30",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.405216,
                        "longitude": 55.513645
                    },
                    "rate": {
                        "quantity": 33188,
                        "rating": 4.875316
                    },
                    "addedAt": 1719078575185,
                    "status": "active",
                    "isVerified": true,
                    "price": 124,
                    "currency": "ILS",
                    "extra": {
                        "price": 124,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Museum of the Future Admission Ticket",
                    "destination": "Dubai",
                    "description": "Immerse in an empowering vison of the future with this ticket to the Museum of the Future in Dubai. Journey 50 years into the future to get an imaginative glimpse of what the world will be like.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/2ddbfd478dbaeba9.png/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-museum-of-the-future-admission-ticket-t411488/",
                    "duration": "01:30",
                    "category": "מוזיאונים",
                    "location": {
                        "latitude": 25.2191487,
                        "longitude": 55.2815988
                    },
                    "rate": {
                        "quantity": 6966,
                        "rating": 4.3132358
                    },
                    "addedAt": 1719078575185,
                    "status": "active",
                    "isVerified": true,
                    "price": 153,
                    "currency": "ILS",
                    "extra": {
                        "price": 153,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Atlantis Aquaventure Waterpark Admission Ticket",
                    "destination": "Dubai",
                    "description": "Spend a thrilling day at Dubai's Atlantis Aquaventure Waterpark. Enjoy the thrills of the water slides, tunnels and falls, relax on a private beach, and grab a snack at one of the on-site restaurants.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/633e918301ad1.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-atlantis-aquaventure-waterpark-admission-ticket-t570397/",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.1335832,
                        "longitude": 55.1200323
                    },
                    "rate": {
                        "quantity": 6609,
                        "rating": 4.4902406
                    },
                    "addedAt": 1719078575185,
                    "status": "active",
                    "isVerified": true,
                    "price": 328,
                    "currency": "ILS",
                    "extra": {
                        "price": 328,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai International Airport (DXB): Premium Lounge Entry",
                    "destination": "Dubai",
                    "description": "Relax and refresh before your departure, in-between flights and arrivals in the comfort of Plaza Premium Lounges at DXB Airport. Use the WiFi, and enjoy delicious food and beverages.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/63085587da5e9.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-premium-international-airport-dxb-lounge-entry-t375921/",
                    "category": "ברים חיי לילה",
                    "location": {
                        "latitude": 25.2531745,
                        "longitude": 55.36567280000001
                    },
                    "rate": {
                        "quantity": 4080,
                        "rating": 4.017157
                    },
                    "addedAt": 1719078575185,
                    "status": "active",
                    "isVerified": true,
                    "price": 193,
                    "currency": "ILS",
                    "extra": {
                        "price": 193,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Burj Khalifa Sky Ticket Levels 124, 125, and 148",
                    "destination": "Dubai",
                    "description": "Skip the lines and enjoy the incredible views of Dubai from the 124th, 125th, and 148th floors of the Burj Khalifa. Access exclusive observation decks and enjoy personalized attention.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/56c702bb68934.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/beat-the-crowds-burj-khalifa-premium-experience-t49181/",
                    "duration": "01:30",
                    "category": "תיירות",
                    "location": {
                        "latitude": 25.1972295,
                        "longitude": 55.27974699999999
                    },
                    "rate": {
                        "quantity": 14562,
                        "rating": 4.560706
                    },
                    "addedAt": 1719078575186,
                    "status": "active",
                    "isVerified": true,
                    "price": 408,
                    "currency": "ILS",
                    "extra": {
                        "price": 408,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: La Perle by Dragone Show Tickets",
                    "destination": "Dubai",
                    "description": "Experience La Perle, an aqua-stage-based live show in Dubai. Marvel at the fusion of immersive artistic performances, acrobats performing aquatic and aerial stunts, imagery, and technology.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/967fc899d07c340c.png/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//la-perle-by-dragone-l111552/la-perle-by-dragone-al-habtoor-city-t127463/",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.1844854,
                        "longitude": 55.25434809999999
                    },
                    "rate": {
                        "quantity": 3641,
                        "rating": 4.7162867
                    },
                    "addedAt": 1719078575186,
                    "status": "active",
                    "isVerified": true,
                    "price": 224,
                    "currency": "ILS",
                    "extra": {
                        "price": 224,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai Marina: Yacht Tour with Breakfast or BBQ",
                    "destination": "Dubai",
                    "description": "Explore all the top landmarks of Dubai on this Yacht Tour that departs from the Dubai Marina. Enrich your experience with a tour guide and freshly prepared BBQ or breakfast on board.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/43c2f7e85d6a511a.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/luxury-shared-yacht-tour-t128958/",
                    "duration": "02:00",
                    "category": "אטרקציות",
                    "priority": "high",
                    "location": {
                        "latitude": 25.0748943,
                        "longitude": 55.13687119999999
                    },
                    "rate": {
                        "quantity": 11511,
                        "rating": 4.773521
                    },
                    "addedAt": 1719078575186,
                    "status": "active",
                    "isVerified": true,
                    "price": 96,
                    "currency": "ILS",
                    "extra": {
                        "price": 96,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Aquarium & Burj Khalifa Level 124, 125 Combo Ticket",
                    "destination": "Dubai",
                    "description": "See 2 of Dubai’s most significant sights with a combo ticket to the Dubai Aquarium and Burj Khalifa. Ascend the Burj Khalifa for panoramic views from level 124/125. Discover marine life from around the world in the unique tunnels of the underwater zoo.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/9d2e6a3a41a8d4ed.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/burj-khalifa-ticket-dubai-aquarium-ticket-t62827/",
                    "category": "תיירות",
                    "location": {
                        "latitude": 25.197405,
                        "longitude": 55.27433099999996
                    },
                    "rate": {
                        "quantity": 19477,
                        "rating": 4.480875
                    },
                    "addedAt": 1719078575186,
                    "status": "active",
                    "isVerified": true,
                    "price": 270,
                    "currency": "ILS",
                    "extra": {
                        "price": 270,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Luxury Yacht Tour with Options to Add a BBQ Lunch",
                    "destination": "Dubai",
                    "description": "Explore Dubai's magnificent coastline on this guided luxury yacht tour. Enjoy onboard food and complimentary drink service as you pass iconic landmarks. Check options for your desired route.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/6345448dbe447.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-luxury-yacht-tour-with-food-and-drinks-t432231/",
                    "duration": "02:00",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.0921883,
                        "longitude": 55.14210920000001
                    },
                    "rate": {
                        "quantity": 5410,
                        "rating": 4.584658
                    },
                    "addedAt": 1719078575187,
                    "status": "active",
                    "isVerified": true,
                    "price": 96,
                    "currency": "ILS",
                    "extra": {
                        "price": 96,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Aquarium and Underwater Zoo Day Entry Ticket",
                    "destination": "Dubai",
                    "description": "Explore Dubai's Aquarium and Underwater Zoo with this day ticket. Discover a diverse array of marine life from the oceans and encounter mysterious creatures in one of the world's largest aquariums.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/7c2916cdb07e853a.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-aquarium-and-underwater-zoo-day-ticket-t571039/",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.1975134,
                        "longitude": 55.2785005
                    },
                    "rate": {
                        "quantity": 6771,
                        "rating": 3.952149
                    },
                    "addedAt": 1719078575187,
                    "status": "active",
                    "isVerified": true,
                    "price": 154,
                    "currency": "ILS",
                    "extra": {
                        "price": 154,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Burj Khalifa 124 & Lunch or Dinner at Rooftop, The Burj Club",
                    "destination": "Dubai",
                    "description": "Experience a ride on the world’s fastest elevator and take in 360-degree views from the Level 124 observation platform at the Burj Khalifa. Then, indulge in a 3-course lunch or dinner at the Burj Club located on the 3rd floor.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/3c9d41e9bfd15569.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//burj-khalifa-l2703/3-course-meal-at-the-burj-club-t74881/",
                    "duration": "05:00",
                    "category": "תיירות",
                    "location": {
                        "latitude": 25.197405,
                        "longitude": 55.27433099999996
                    },
                    "rate": {
                        "quantity": 7061,
                        "rating": 4.2867866
                    },
                    "addedAt": 1719078575187,
                    "status": "active",
                    "isVerified": true,
                    "price": 330,
                    "currency": "ILS",
                    "extra": {
                        "price": 330,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: The View At The Palm Observatory Entry Ticket",
                    "destination": "Dubai",
                    "description": "Pre-book your combo entry ticket to The View At The Palm and The View Exhibition. Enjoy 360-degree views of Palm Jumeirah, the Arabian Gulf, and beyond from an outdoor terrace.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/ee4415b39319757ba716735b55aa5cb9e97a9f7c857402e2ca57cfd16d1c7456.jpg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-islands-l167429/dubai-the-view-at-the-palm-observatory-entry-ticket-t409529/",
                    "category": "",
                    "location": {
                        "latitude": 25.1137187,
                        "longitude": 55.1398175
                    },
                    "rate": {
                        "quantity": 10657,
                        "rating": 4.6602235
                    },
                    "addedAt": 1719078575187,
                    "status": "active",
                    "isVerified": true,
                    "price": 72,
                    "currency": "ILS",
                    "extra": {
                        "price": 72,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Desert Safari, Quad Bike, Camel Ride and Sandboarding",
                    "destination": "Dubai",
                    "description": "Discover the mysteries of the Lahbab desert on this epic safari tour from Dubai. Take a thrilling drive on the vast red dunes, have a go at camel riding and sandboarding, and enjoy an optional self-drive quad bike ride in the desert.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/62501e4eda39d.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-red-dunes-evening-desert-safari-w-bbq-dinner-t74766/",
                    "duration": "04:00",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.2048493,
                        "longitude": 55.2707828
                    },
                    "rate": {
                        "quantity": 16587,
                        "rating": 4.883282
                    },
                    "addedAt": 1719078575188,
                    "status": "active",
                    "isVerified": true,
                    "price": 104,
                    "currency": "ILS",
                    "extra": {
                        "price": 104,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Inside Burj Al Arab Tour",
                    "destination": "Dubai",
                    "description": "Enjoy an exclusive tour to explore the secrets of the Burj Al Arab Hotel in Dubai. Learn what makes the hotel a landmark of architectural innovation.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/6454a13c82275.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-l173/dubai-inside-burj-al-arab-tour-t462854/",
                    "duration": "01:30",
                    "category": "תיירות",
                    "location": {
                        "latitude": 25.1404455,
                        "longitude": 55.1904664
                    },
                    "rate": {
                        "quantity": 696,
                        "rating": 4.4123564
                    },
                    "addedAt": 1719078575188,
                    "status": "active",
                    "isVerified": true,
                    "price": 255,
                    "currency": "ILS",
                    "extra": {
                        "price": 255,
                        "currency": "ILS"
                    }
                },
                {
                    "name": "Dubai: Jet Ski Trip to Burj Al Arab with Ice Cream",
                    "destination": "Dubai",
                    "description": "Feel the adrenaline of a Jet Ski ride with a rental in Dubai. Take in views of the city's skyline and Burj Al Arab, then enjoy an ice cream cone at a breezy seaside café full of summer vibes.",
                    "images": [
                        "https://cdn.getyourguide.com/img/tour/e62027e7ffce2e22b64221d9a817cebf353e41b2a6cdf3dec12dfe570f48e930.jpeg/132.jpg"
                    ],
                    "source": "GetYourGuide",
                    "more_info": "https://www.getyourguide.com//dubai-marina-l3415/dubai-jet-ski-rental-and-hot-dog-t59772/",
                    "duration": "00:30",
                    "category": "אטרקציות",
                    "location": {
                        "latitude": 25.152371,
                        "longitude": 55.19857200000001
                    },
                    "rate": {
                        "quantity": 2719,
                        "rating": 4.869437
                    },
                    "addedAt": 1719078575188,
                    "status": "active",
                    "isVerified": true,
                    "price": 276,
                    "currency": "ILS",
                    "extra": {
                        "price": 276,
                        "currency": "ILS"
                    }
                }
            ],
            "nextPage": 2,
            "isFinished": false
        }
    }
}