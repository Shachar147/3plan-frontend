import PointOfInterest from "../../components/point-of-interest/point-of-interest";
import React from "react";
import {EventStore} from "../../stores/events-store";

interface FeedViewProps {
    eventStore: EventStore
}

function FeedView({ eventStore }: FeedViewProps) {
    const response = {
        "results": [
            {
                "name": "Vienna: Hallstatt & Alpine Peaks Day Trip with Skywalk Lift",
                "destination": "Vienna",
                "description": "Marvel at mountain peaks, serene lakes, small villages, and magnificent alpine scenery on a day trip from Vienna to Hallstatt. Enjoy breathtaking views over the town from the incredible Skywalk.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/90e681997b23ee53.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-hallstatt-and-alpine-peaks-with-skywalk-lift-t316897/",
                "duration": "13:00",
                "category": "",
                "priority": "high",
                "location": {
                    "latitude": 48.2045295,
                    "longitude": 16.36940470000002
                },
                "rate": {
                    "quantity": 3453,
                    "rating": 4.7002606
                },
                "addedAt": 1719062168589,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 539
                }
            },
            {
                "name": "Vienna: Vivaldi’s Four Seasons Concert in Karlskirche",
                "destination": "Vienna",
                "description": "Enjoy a wonderful classical concert with a period instrument ensemble at the beautiful Karlskirche in Vienna. With tickets to this evening concert you can listen to the Four Seasons by Vivaldi and embark on a fascinating journey into the musical past.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5a26559595c52.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-concert-vivaldi-s-four-seasons-in-karlskirche-t44883/",
                "duration": "01:15",
                "category": "",
                "location": {
                    "latitude": 48.198402827351224,
                    "longitude": 16.371419331946527
                },
                "rate": {
                    "quantity": 7126,
                    "rating": 4.64398
                },
                "addedAt": 1719062168592,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 133
                }
            },
            {
                "name": "Vienna: Upper Belvedere & Permanent Collection Entry Ticket",
                "destination": "Vienna",
                "description": "Visit the Upper Belvedere Museum in Vienna, get access to the Permanent Collection and discover the world's largest collection of Gustav Klimt paintings, including \"The Kiss\".",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/61f9262815d6d.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-art-and-architecture-in-the-belvedere-t47912/",
                "duration": "01:00",
                "category": "מוזיאונים",
                "priority": "high",
                "location": {
                    "latitude": 48.1915585,
                    "longitude": 16.38095469999996
                },
                "rate": {
                    "quantity": 6144,
                    "rating": 4.5572915
                },
                "addedAt": 1719062168592,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 70
                }
            },
            {
                "name": "Vienna: Schönbrunn Palace & Gardens Skip-the-Line Tour",
                "destination": "Vienna",
                "description": "Skip long entrance lines and discover the Schönbrunn Palace and its beautiful gardens. See the palace’s marvelous interiors and learn about its fascinating history on a guided walking tour.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/63850a10677341a2.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-schonbrunn-palace-gardens-skip-the-line-tour-t397843/",
                "duration": "02:00",
                "category": "",
                "location": {
                    "latitude": 48.1860244,
                    "longitude": 16.3122574
                },
                "rate": {
                    "quantity": 4768,
                    "rating": 4.6684146
                },
                "addedAt": 1719062168592,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 217
                }
            },
            {
                "name": "Vienna: Skip-the-Line Sisi Museum, Hofburg and Gardens Tour",
                "destination": "Vienna",
                "description": "Hear the true story of Sisi and experience the opulent lifestyle of Habsburgs on a guided tour of the Hofburg Palace complex, including the Sisi Museum, Imperial Apartments, courtyards and gardens.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/92f086dc82e47451456221cb659e757b3400549ccef1072b77a5ee41948d3f9c.jpg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/skip-the-line-sisi-museum-hofburg-and-gardens-tour-vienna-t471440/",
                "duration": "02:30",
                "category": "מוזיאונים",
                "location": {
                    "latitude": 48.2083227,
                    "longitude": 16.3666993
                },
                "rate": {
                    "quantity": 1038,
                    "rating": 4.7254333
                },
                "addedAt": 1719062168593,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 234
                }
            },
            {
                "name": "Vienna: Mozart Concert at the Golden Hall",
                "destination": "Vienna",
                "description": "See a concert at one of Vienna’s finest concert halls and listen to magical works by Mozart and Strauss. Performed by the Vienna Mozart Orchestra in period costumes, venues include the landmark Golden Hall of the Musikverein.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5526b068384b44ab.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-mozart-concert-at-the-golden-hall-t613/",
                "duration": "02:00",
                "category": "",
                "location": {
                    "latitude": 48.200494,
                    "longitude": 16.37277949999998
                },
                "rate": {
                    "quantity": 2922,
                    "rating": 4.5629706
                },
                "addedAt": 1719062168593,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 237
                }
            },
            {
                "name": "Performance Of The Lipizzans At Spanish Riding School",
                "destination": "Vienna",
                "description": "Be impressed by the performance of the famous Lipizzaner in a breathtaking location, the baroque Winter Riding School. The unique atmosphere of this place and the accompanying classic Viennese music will make this experience unforgettable.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5bc598c2cd4b2.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/performance-of-the-lipizzans-at-spanish-riding-school-t187323/",
                "category": "",
                "location": {
                    "latitude": 48.2077304,
                    "longitude": 16.366159299999936
                },
                "rate": {
                    "quantity": 2542,
                    "rating": 4.3461843
                },
                "addedAt": 1719062168593,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 163
                }
            },
            {
                "name": "Vienna: Spanish Riding School Training",
                "destination": "Vienna",
                "description": "Visit the Spanish Riding School of Vienna and witness the training of the Lipizzaners and their riders. During the morning exercise you can observe the training of the gray colts and the fully-trained school stallions, the “white stars”.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/80a2670a9dca8cf8.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com//spanish-riding-school-l4623/vienna-spanish-riding-school-2-hour-morning-exercise-t42136/",
                "duration": "01:00",
                "category": "",
                "location": {
                    "latitude": 48.2077304,
                    "longitude": 16.366159299999936
                },
                "rate": {
                    "quantity": 6013,
                    "rating": 3.8521538
                },
                "addedAt": 1719062168593,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 68
                }
            },
            {
                "name": "Vienna: Skip-the-Line Schonbrunn Palace and Gardens Tour",
                "destination": "Vienna",
                "description": "Skip the lines and explore Schonbrunn Palace and Gardens on a tour with pre-booked tickets and a licensed guide. Immerse yourself in the history and legends of this historic Vienna imperial residence.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/b0d04e4451c25d9b.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-skip-the-line-schonbrunn-palace-and-gardens-tour-t471518/",
                "duration": "02:30",
                "category": "",
                "location": {
                    "latitude": 48.1854276,
                    "longitude": 16.3138895
                },
                "rate": {
                    "quantity": 839,
                    "rating": 4.6746125
                },
                "addedAt": 1719062168594,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 213
                }
            },
            {
                "name": "Vienna: Vivaldi's Four Seasons & Mozart in the Musikverein",
                "destination": "Vienna",
                "description": "Witness Vivaldi's Four Seasons in the halls of the world-famous Musikverein in Vienna. Hear Viennese classics by Mozart and Haydn performed by a live orchestra.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5dd2fe6abe3aa.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-vivaldi-four-seasons-at-the-musikverein-t329566/",
                "duration": "02:00",
                "category": "",
                "location": {
                    "latitude": 48.200494,
                    "longitude": 16.37277949999998
                },
                "rate": {
                    "quantity": 2150,
                    "rating": 4.6106977
                },
                "addedAt": 1719062168599,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 60
                }
            },
            {
                "name": "Vienna: Schönbrunn Palace and Gardens Guided Tour",
                "destination": "Vienna",
                "description": "Discover Austria's top attraction, the Schönbrunn Palace, on a guided tour. Skip the ticket lines for the Palace Tour and take a leisurely stroll through Schönbrunn Gardens.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/64c3729a3f4d7.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/schonbrunn-guided-tour-to-the-palace-and-garden-t494393/",
                "duration": "02:30",
                "category": "",
                "location": {
                    "latitude": 48.1867106,
                    "longitude": 16.3150365
                },
                "rate": {
                    "quantity": 439,
                    "rating": 4.1138954
                },
                "addedAt": 1719062168599,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 173
                }
            },
            {
                "name": "Vienna: Skip-the-line Tickets for Schönbrunn Zoo",
                "destination": "Vienna",
                "description": "Visit the Vienna Zoo at Schönbrunn and skip the ticket line to the oldest Baroque zoo in the world. See animals from all over the world, including two giant pandas.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5d88813d28e24.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/schonbrunn-zoo-tickets-vienna-t7525/",
                "category": "",
                "location": {
                    "latitude": 48.18357349432304,
                    "longitude": 16.30200699825174
                },
                "rate": {
                    "quantity": 2092,
                    "rating": 4.7557364
                },
                "addedAt": 1719062168600,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 109
                }
            },
            {
                "name": "Vienna: Sigmund Freud Museum Ticket",
                "destination": "Vienna",
                "description": "Step inside the Sigmund Freud Museum and explore the working and living spaces in the apartment of the Freud Family where the world of psychology was changed.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/640728f7ab4d0.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-sigmund-freud-museum-ticket-t396089/",
                "category": "מוזיאונים",
                "location": {
                    "latitude": 48.2185966,
                    "longitude": 16.3630212
                },
                "rate": {
                    "quantity": 591,
                    "rating": 4.5143824
                },
                "addedAt": 1719062168600,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 60
                }
            },
            {
                "name": "Tickets for the Albertina Exhibitions",
                "destination": "Vienna",
                "description": "Visit Vienna's Albertina Museum, a hidden gem combining art exhibitions (including a permanent \"Monet-Picasso\" exhibition), Habsburg state rooms, and a selection of temporarily changing exhibitions.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/5d08ac8398cad.jpeg/132.jpg",
                    "https://cdn.getyourguide.com/img/tour/5d08ac8398cad.jpeg/132.jpg",
                    "https://cdn.getyourguide.com/img/tour/5d08ac8398cad.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/albertina-museum-tickets-vienna-t37928/",
                "category": "מוזיאונים",
                "location": {
                    "latitude": 48.2046992,
                    "longitude": 16.3681824
                },
                "rate": {
                    "quantity": 798,
                    "rating": 4.6578946
                },
                "addedAt": 1719062168600,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 80
                }
            },
            {
                "name": "Vienna: Classic Ensemble Vienna in St. Peter's Church Ticket",
                "destination": "Vienna",
                "description": "Experience a musical evening at St. Peter's Church with this entry ticket. Let the Classic Ensemble Vienna fill the church with their enchanting interpretations of timeless classics by famous composers.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/beb26e78ced50e1b.jpeg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-classic-ensemble-vienna-at-st-peter-s-church-t69684/",
                "duration": "01:00",
                "category": "",
                "location": {
                    "latitude": 48.20929775018089,
                    "longitude": 16.369733082139636
                },
                "rate": {
                    "quantity": 2666,
                    "rating": 4.6552887
                },
                "addedAt": 1719062168600,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 149
                }
            },
            {
                "name": "Vienna: Karlskirche Entry Ticket with Panoramic Terrace",
                "destination": "Vienna",
                "description": "Visit the Karlskirche, a true baroque masterpiece, and explore the church model and treasury. See the organ up close and enjoy a unique panoramic view over the city’s rooftops.",
                "images": [
                    "https://cdn.getyourguide.com/img/tour/f6efde8e96b0f8ac7cc9021554e0d0b68bbbb9cbf44628b3327f6a9e559393c9.jpg/132.jpg"
                ],
                "source": "GetYourGuide",
                "more_info": "https://www.getyourguide.com/vienna-l7/vienna-karlskirche-entry-ticket-with-panoramic-terrace-t720573/",
                "category": "",
                "location": {
                    "latitude": 48.198615369515615,
                    "longitude": 16.371750169311525
                },
                "rate": {
                    "quantity": 0,
                    "rating": 0
                },
                "addedAt": 1719062168601,
                "status": "active",
                "isVerified": true,
                "extra": {
                    "price": 38
                }
            }
        ],
        "nextPage": 2,
        "isFinished": false
    };
    const items = response.results;

    return (
        <div className="flex-column gap-4">
            {items.map((item) => <PointOfInterest item={item} eventStore={eventStore} />)}
        </div>
    )
}

export default FeedView;