import React, {Component, useContext, useEffect} from "react";
import GoogleMapReact from "google-map-react";
import MarkerClusterer from "@googlemaps/markerclustererplus";
import * as _ from "lodash";
import {eventStoreContext} from "../../stores/events-store";
import {priorityToColor, priorityToMapColor} from "../../utils/consts";
import TranslateService from "../../services/translate-service";
import {formatTime, getDurationString} from "../../utils/time-utils";

function Marker(props) {
    return (
        <div>
            <i className="fa fa-map-marker fa-3x text-danger"/>
            {props.text}
        </div>
    )
}

const MapContainer = () => {

    const getKey = (x) => {
        return x.lat+','+x.lng;
    }

    const eventStore = useContext(eventStoreContext);

    const locations = eventStore.allEvents.filter((x) => x.location && x.location.latitude && x.location.longitude).map((x) => ({
        event: x,
        label: x.title,
        lat: x.location.latitude,
        lng: x.location.longitude
    }))

    const coordinatesToEvents = {};
    const texts = {};

    locations.forEach((x) => {
        texts[getKey(x)] = x.label;
        coordinatesToEvents[getKey(x)] = x.event;
    })

    const coordinates = _.uniq(locations.map((x) => getKey(x) )).map((x) => ({
        lat: Number(x.split(',')[0]),
        lng: Number(x.split(',')[1]),
    }));

    // useEffect(() => {
    //     const script = document.createElement("script");
    //     script.src =
    //         "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js";
    //     script.async = true;
    //     document.body.appendChild(script);
    // });

    const setGoogleMapRef = (map, maps) => {
        let googleMapRef = map;
        let googleRef = maps;

        const infoWindow = new googleRef.InfoWindow();

        const getIconUrl = (event) => {

            // todo complete - add shopping icon

            let icon = "";
            const bgColor = priorityToMapColor[event.priority].replace('#','');
            let category = event.extendedProps && event.extendedProps.categoryId ? event.extendedProps.categoryId : event.category;
            console.log("categoryId", category)

            category = eventStore.categories.find((x) => x.id.toString() === category)?.title;

            console.log("category", category);

            category = category ? category.toLowerCase() : "";

            if (event.title.toLowerCase().indexOf("basketball") !== -1 ||
                event.title.indexOf("כדורסל") !== -1) {
                icon = "icons/onion/1520-basketball_4x.png";
            }

            if ("food".indexOf(category) !== -1 ||
                "resturant".indexOf(category) !== -1 ||
                "אוכל".indexOf(category) !== -1 ||
                "מסעדות".indexOf(category) !== -1
            ) {
                icon = "icons/onion/1577-food-fork-knife_4x.png";
            } else if ("photo".indexOf(category) !== -1 || "תמונות".indexOf(category) !== -1) {
                icon = "icons/onion/1535-camera-photo_4x.png";
            } else if ("hotel".indexOf(category) !== -1 || "מלון".indexOf(category) !== -1) {
                icon = "icons/onion/1602-hotel-bed_4x.png";
            } else if ("attraction".indexOf(category) !== -1 || "אטרקציות".indexOf(category) !== -1 || "פעילויות".indexOf(category) !== -1) {
                icon = "icons/onion/1502-shape_star_4x.png";
            } else if ("beach".indexOf(category) !== -1 || "beach club".indexOf(category) !== -1 || "beach bar".indexOf(category) !== -1 || "חופים".indexOf(category) !== -1 || "ביץ׳ בר".indexOf(category) !== -1 || "ביץ׳ באר".indexOf(category) !== -1) {
                icon = "icons/onion/1521-beach_4x.png";
            } else if ("club".indexOf(category) !== -1 || "cocktail".indexOf(category) !== -1 || "bar".indexOf(category) !== -1 || "מועדונים".indexOf(category) !== -1 || "ברים".indexOf(category) !== -1) {
                icon = "icons/onion/1517-bar-cocktail_4x.png";
            }
            else if (icon === "") {
                return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
            }
            return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
        }

        const icon = {
            // path: "M27.648-41.399q0-3.816-2.7-6.516t-6.516-2.7-6.516 2.7-2.7 6.516 2.7 6.516 6.516 2.7 6.516-2.7 2.7-6.516zm9.216 0q0 3.924-1.188 6.444l-13.104 27.864q-.576 1.188-1.71 1.872t-2.43.684-2.43-.684-1.674-1.872l-13.14-27.864q-1.188-2.52-1.188-6.444 0-7.632 5.4-13.032t13.032-5.4 13.032 5.4 5.4 13.032z",
            // path: "M 25, 50 a 25,25 0 1,1 50,0 a 25,25 0 1,1 -50,0",
            // fillColor: '#E32831',
            // fillOpacity: 1,
            // strokeWeight: 0,
            // scale: 0.5

            // path: googleRef.SymbolPath.CIRCLE,
            url: 'https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/1577-food-fork-knife_4x.png&highlight=ff000000,FF5252,ff000000&scale=2.0',
            scaledSize: new googleRef.Size(30, 30),
            fillColor: "#F00",
            fillOpacity: 0.7,
            strokeWeight: 0.4,
            strokeColor: "#ffffff"
        };

        const addressPrefix = TranslateService.translate(eventStore, "MAP.INFO_WINDOW.ADDRESS");
        const descriptionPrefix = TranslateService.translate(eventStore, "MAP.INFO_WINDOW.DESCRIPTION");
        const scheduledToPrefix = TranslateService.translate(eventStore, "MAP.INFO_WINDOW.SCHEDULED_TO");

        const iStyle = "min-width: 13px; text-align: center;";
        const rowContainerStyle = "display: flex; flex-direction: row; align-items: center; gap: 10px;";

        let markers =
            coordinates &&
            coordinates.map((marker, index) => {
                const key = getKey(marker);
                const event = coordinatesToEvents[key];

                icon.url = getIconUrl(event);

                const markerIcon = {...icon, fillColor: priorityToColor[event.priority]}
                const markerIconWithBorder = {
                    ...markerIcon,
                    strokeColor: '#ffffff',
                    strokeOpacity: 0.6,
                    strokeWeight: 8,
                }

                const refMarker = new googleRef.Marker({
                    position: { lat: marker.lat, lng: marker.lng },
                    // label: texts[key],
                    title: texts[key],
                    icon: markerIcon,
                    // label: event.icon
                });

                googleRef.event.addListener(refMarker, 'click', (function(marker) {

                    const title = `<div style="font-size:20px; margin-inline-end: 5px;"><b><u>${event.title}</u></b></div>`;
                    const address = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-map-marker" aria-hidden="true"></i><span>
 ${addressPrefix}: ${event.location.address}</span></span>`

                    const description = event.description ? `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-info" aria-hidden="true"></i> <span>${descriptionPrefix}: ${event.description}</span></span>` : '';

                    const calendarEvent = eventStore.calendarEvents.find((x) => x.id === event.id);
                    let scheduledTo = "not scheduled yet";
                    if (calendarEvent){
                        const dt = calendarEvent.start.toLocaleDateString();
                        const startTime = calendarEvent.start.toLocaleTimeString();
                        const endTime = calendarEvent.end.toLocaleTimeString();
                        const start = formatTime(startTime);
                        const end = formatTime(endTime);

                        scheduledTo = `${dt} ${end}-${start} (${getDurationString(eventStore, calendarEvent.duration)})`
                    }

                    scheduledTo = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-calendar" aria-hidden="true"></i> <span>${scheduledToPrefix}: ${scheduledTo}</span></span>`;

                    const lat = event.location.latitude.toFixed(7);
                    const lng = event.location.longitude.toFixed(7);
                    const url = `https://maps.google.com/maps?q=${lat},${lng}`;
                    const urlBlock = `<span><a href="${url}" target="_blank">View on google maps</a></span>`

                    return function() {
                        infoWindow.setContent(`<div style="display: flex; flex-direction: column; gap: 6px; max-width: 450px; padding: 10px;">
                                ${title}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${address}
                                ${description}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${scheduledTo}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${urlBlock}
                             </div>`);
                        infoWindow.open(map, refMarker);
                    }

                })(refMarker));

                googleRef.event.addListener(refMarker, 'mouseover', (function(marker) {
                    return function(marker) {
                        refMarker.setIcon(markerIconWithBorder)
                    }
                })(refMarker));

                googleRef.event.addListener(refMarker, 'mouseout', (function(marker) {
                    return function(marker) {
                        refMarker.setIcon(markerIcon)
                    }
                })(refMarker));

                // googleRef.event.addListener(refMarker, 'click', () => {
                //     infoWindow.open(map, googleMapRef)
                // })
                //
                // refMarker.addListener('click', () => {
                //     infoWindow.open(map, refMarker)
                // })

                return refMarker;
            });

        googleRef.event.addListener(map, "click", function(event) {
            infoWindow.close();
        });

        let markerCluster = new MarkerClusterer(map, markers, {
            imagePath: "/images/marker_images/m",
            minimumClusterSize: 4
        });
    };

    const noDefaultMarkers = {
        featureType: "poi",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    }

    const noRoadLabels = {
        featureType: "road",
        elementType: "labels",
        stylers: [
            { visibility: "off" }
        ]
    }

    const darkModeStyles = [
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
                featureType: "administrative.locality",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "poi.park",
                elementType: "geometry",
                stylers: [{ color: "#263c3f" }],
            },
            {
                featureType: "poi.park",
                elementType: "labels.text.fill",
                stylers: [{ color: "#6b9a76" }],
            },
            {
                featureType: "road",
                elementType: "geometry",
                stylers: [{ color: "#38414e" }],
            },
            {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#212a37" }],
            },
            {
                featureType: "road",
                elementType: "labels.text.fill",
                stylers: [{ color: "#9ca5b3" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry",
                stylers: [{ color: "#746855" }],
            },
            {
                featureType: "road.highway",
                elementType: "geometry.stroke",
                stylers: [{ color: "#1f2835" }],
            },
            {
                featureType: "road.highway",
                elementType: "labels.text.fill",
                stylers: [{ color: "#f3d19c" }],
            },
            {
                featureType: "transit",
                elementType: "geometry",
                stylers: [{ color: "#2f3948" }],
            },
            {
                featureType: "transit.station",
                elementType: "labels.text.fill",
                stylers: [{ color: "#d59563" }],
            },
            {
                featureType: "water",
                elementType: "geometry",
                stylers: [{ color: "#17263c" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.fill",
                stylers: [{ color: "#515c6d" }],
            },
            {
                featureType: "water",
                elementType: "labels.text.stroke",
                stylers: [{ color: "#17263c" }],
            }
        ]

    const lightModeStyles = [
        { elementType: "geometry", stylers: [{ color: "#f0eded" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#b9b3b3" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#b9b3b3" }],
        },
        // {
        //     featureType: "poi",
        //     elementType: "labels.text.fill",
        //     stylers: [{ color: "#ff9800" }],
        // },
        // {
        //     featureType: "poi.park",
        //     elementType: "geometry",
        //     stylers: [{ color: "#f2e1e0" }],
        // },
        // {
        //     featureType: "poi.park",
        //     elementType: "labels.text.fill",
        //     stylers: [{ color: "#5eff00" }],
        // },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#ffffff" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#f2e1e0" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e1dfd3" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#5f5757" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#ffffff" }],
        }
    ]

    const customOptions = {
        styles:[
            ...lightModeStyles,
            noDefaultMarkers,
            noRoadLabels
        ]
    }

    return (
        <div className="app" style={{height: "100vh", width: "100%"}}>
            <GoogleMapReact
                bootstrapURLKeys={{key: "AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo"}} /* AIzaSyA16d9FJFh__vK04jU1P64vnEpPc3jenec */
                defaultCenter={coordinates .length > 0 ? {lat: coordinates[0].lat, lng: coordinates[0].lng} : undefined}
                defaultZoom={11}
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={({map, maps}) => setGoogleMapRef(map, maps)}
                clickableIcons={false}
                options={customOptions}
            >
                {/*{coordinates.map((place, index) => (*/}
                {/*    <Marker*/}
                {/*        key={index}*/}
                {/*        text={"#" + index+1}*/}
                {/*        lat={place.lat}*/}
                {/*        lng={place.lng}*/}
                {/*    />*/}
                {/*))}*/}
            </GoogleMapReact>
        </div>
    );
}

export default MapContainer