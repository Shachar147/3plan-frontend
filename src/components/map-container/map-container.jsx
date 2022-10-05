import React from "react";
import { Component, useContext, useEffect, useMemo, useState } from "react";
import GoogleMapReact from "google-map-react";
import MarkerClusterer from "@googlemaps/markerclustererplus";
import * as _ from "lodash";
import {eventStoreContext} from "../../stores/events-store";
import {priorityToColor, priorityToMapColor} from "../../utils/consts";
import TranslateService from "../../services/translate-service";
import {formatDate, formatTime, getDurationString} from "../../utils/time-utils";
import {TriplanEventPreferredTime} from "../../utils/enums";
import {getClasses} from "../../utils/utils";
import './map-container.scss';
import ModalService from "../../services/modal-service";

function Marker(props) {
    const { text, lng, lat, locationData, searchValue } = props
    const eventStore = useContext(eventStoreContext);
    return (
        <div style={{
            cursor: "pointer"
        }} onClick={() => {
            ModalService.openAddSidebarEventModal(eventStore, undefined, { location: locationData, title: searchValue })
        }}>
            <i className="fa fa-map-marker fa-4x text-success"/>
            {props.text}
        </div>
    )
}

const MapContainer = () => {
    const [searchValue, setSearchValue] = useState("");
    const [searchCoordinatesSearchValue, setSearchCoordinatesSearchValue] = useState(""); // keeps searchValue that matches current search coordinates
    const [searchCoordinates, setSearchCoordinates] = useState([]);
    const eventStore = useContext(eventStoreContext);

    const coordinatesToEvents = {};
    const texts = {};
    let googleRef, googleMapRef;
    let searchMarkers = [];
    let markerCluster;
    let markers = [];

    const getKey = (x) => x.lat + ',' + x.lng;
    const locations = eventStore.allEvents.filter((x) => x.location && x.location.latitude && x.location.longitude).map((x) => ({
        event: x,
        label: x.title,
        lat: x.location.latitude,
        lng: x.location.longitude
    }))
    locations.forEach((x) => {
        texts[getKey(x)] = x.label;
        coordinatesToEvents[getKey(x)] = x.event;
    })
    const coordinates = _.uniq(locations.map((x) => getKey(x) )).map((x) => ({
        lat: Number(x.split(',')[0]),
        lng: Number(x.split(',')[1]),
    }));

    window.selectedSearchLocation = undefined;

    // --- side effects -----------------------------------------------------------------
    useEffect(() => {
        const script = document.createElement("script");
        script.src =
            "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js";
        script.async = true;
        document.body.appendChild(script);
    });

    // --- functions --------------------------------------------------------------------
    const setGoogleMapRef = (map, maps) => {
        googleMapRef = map;
        googleRef = maps;

        const infoWindow = new googleRef.InfoWindow();

        const getIconUrl = (event) => {

            // todo complete - add shopping icon

            let icon = "";
            let bgColor = priorityToMapColor[event.priority].replace('#', '');
            let category = event.extendedProps && event.extendedProps.categoryId ? event.extendedProps.categoryId : event.category;
            category = eventStore.categories.find((x) => x.id.toString() === category)?.title;

            category = category ? category.toLowerCase() : "";

            if (event.title.toLowerCase().indexOf("basketball") !== -1 ||
                event.title.indexOf("כדורסל") !== -1) {
                icon = "icons/onion/1520-basketball_4x.png";
            } else if (category.indexOf("food") !== -1 ||
                category.indexOf("resturant") !== -1 ||
                category.indexOf("אוכל") !== -1 ||
                category.indexOf("מסעדות") !== -1
            ) {
                icon = "icons/onion/1577-food-fork-knife_4x.png";
            } else if (category.indexOf("photo") !== -1 || category.indexOf("תמונות") !== -1) {
                icon = "icons/onion/1535-camera-photo_4x.png";
            } else if (category.indexOf("attraction") !== -1 || category.indexOf("אטרקציות") !== -1 || category.indexOf("פעילויות") !== -1) {
                icon = "icons/onion/1502-shape_star_4x.png";
            } else if (category.indexOf("beach") !== -1 || category.indexOf("beach club") !== -1 || category.indexOf("beach bar") !== -1 || category.indexOf("חופים") !== -1 || category.indexOf("ביץ׳ בר") !== -1 || category.indexOf("ביץ׳ באר") !== -1) {
                icon = "icons/onion/1521-beach_4x.png";
            } else if (category.indexOf("club") !== -1 || category.indexOf("cocktail") !== -1 || category.indexOf("bar") !== -1 || category.indexOf("מועדונים") !== -1 || category.indexOf("ברים") !== -1) {
                icon = "icons/onion/1517-bar-cocktail_4x.png";
            } else if (category.indexOf("hotel") !== -1 || category.indexOf("מלון") !== -1 || event.title.toLowerCase().indexOf("hotel") !== -1 || event.title.indexOf("מלון") !== -1) {
                icon = "icons/onion/1602-hotel-bed_4x.png";
                bgColor = "7cb342";
            } else if (icon === "") {
                return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
            }
            return `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,${icon}&highlight=ff000000,${bgColor},ff000000&scale=2.0`;
        }

        const buildInfoWindowContent = (event) => {
            const title = `<div style="font-size:20px; margin-inline-end: 5px;"><b><u>${event.title}</u></b></div>`;
            const address = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-map-marker" aria-hidden="true"></i><span> ${addressPrefix}: ${event.location.address}</span></span>`

            const description = event.description ? `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-info" aria-hidden="true"></i> <span>${descriptionPrefix}: ${event.description}</span></span>` : '';

            const calendarEvent = eventStore.calendarEvents.find((x) => x.id === event.id);
            let scheduledTo = TranslateService.translate(eventStore, 'MAP.INFO_WINDOW.SCHEDULED_TO.UNSCHEDULED')
            if (calendarEvent) {
                const dt = formatDate(calendarEvent.start);
                const startTime = calendarEvent.start.toLocaleTimeString('en-US', {hour12: false});
                const endTime = calendarEvent.end.toLocaleTimeString('en-US', {hour12: false});
                const start = formatTime(startTime);
                const end = formatTime(endTime);

                scheduledTo = `${dt} ${end}-${start} (${getDurationString(eventStore, calendarEvent.duration)})`
            }

            scheduledTo = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-calendar" aria-hidden="true"></i> <span>${scheduledToPrefix}: ${scheduledTo}</span></span>`;

            let category = event.extendedProps && event.extendedProps.categoryId ? event.extendedProps.categoryId : event.category;
            category = eventStore.categories.find((x) => x.id.toString() === category)?.title;
            const categoryBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-tag" aria-hidden="true"></i> <span>${categoryPrefix}: ${category}</span></span>`;

            let preferredTime = event.extendedProps && Object.keys(event.extendedProps).includes('preferredTime') ? event.extendedProps.preferredTime : event.preferredTime;
            if (preferredTime != undefined) {
                preferredTime = TriplanEventPreferredTime[preferredTime];
            } else {
                preferredTime = TriplanEventPreferredTime.unset;
            }
            const preferredHoursBlock = `<span style="${rowContainerStyle}"><i style="${iStyle}" class="fa fa-clock-o" aria-hidden="true"></i> <span>${preferredHoursPrefix}: ${TranslateService.translate(eventStore, preferredTime)}</span></span>`;

            const lat = event.location.latitude.toFixed(7);
            const lng = event.location.longitude.toFixed(7);
            const url = `https://maps.google.com/maps?q=${lat},${lng}`;
            const urlBlock = `<span><a href="${url}" target="_blank">View on google maps</a></span>`

            return `<div style="display: flex; flex-direction: column; gap: 6px; max-width: 450px; padding: 10px;">
                                ${title}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${address}
                                ${categoryBlock}
                                ${description}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${scheduledTo}
                                ${preferredHoursBlock}
                                <hr style="height: 1px; width: 100%;margin-block: 3px;" />
                                ${urlBlock}
                             </div>`;
        }

        const initMarkerFromCoordinate = (coordinate) => {
            const key = getKey(coordinate);
            const event = coordinatesToEvents[key];

            // marker + marker when hovering
            icon.url = getIconUrl(event);
            const markerIcon = {...icon, fillColor: priorityToColor[event.priority]}
            const markerIconWithBorder = {
                ...markerIcon,
                strokeColor: '#ffffff',
                strokeOpacity: 0.6,
                strokeWeight: 8,
            }

            // set marker
            const refMarker = new googleRef.Marker({
                position: {lat: coordinate.lat, lng: coordinate.lng},
                // label: texts[key],
                title: texts[key],
                icon: markerIcon,
                // label: event.icon
            });

            // on click event
            googleRef.event.addListener(refMarker, 'click', (function () {
                return function () {
                    infoWindow.setContent(buildInfoWindowContent(event));
                    infoWindow.open(map, refMarker);
                }
            })(refMarker));

            // hover & leave events
            googleRef.event.addListener(refMarker, 'mouseover', (function () {
                return function () {
                    refMarker.setIcon(markerIconWithBorder)
                }
            })(refMarker));
            googleRef.event.addListener(refMarker, 'mouseout', (function () {
                return function () {
                    refMarker.setIcon(markerIcon)
                }
            })(refMarker));

            return refMarker;
        }

        const icon = {
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
        const preferredHoursPrefix = TranslateService.translate(eventStore, "MAP.INFO_WINDOW.PREFERRED_HOURS");
        const categoryPrefix = TranslateService.translate(eventStore, "MAP.INFO_WINDOW.CATEGORY");
        const iStyle = "min-width: 13px; text-align: center;";
        const rowContainerStyle = "display: flex; flex-direction: row; align-items: center; gap: 10px;";

        markers =
            coordinates &&
            coordinates.map((coordinate) => initMarkerFromCoordinate(coordinate));

        googleRef.event.addListener(map, "click", function (event) {
            infoWindow.close();
        });

        markerCluster = new MarkerClusterer(map, [...markers, ...searchMarkers], {
            imagePath: "/images/marker_images/m",
            minimumClusterSize: 10
        });
    }

    const initSearchResultMarker = useMemo(() => {
        return () => {

            const selectedSearchLocation = window.selectedSearchLocation;
            searchMarkers = [];
            if (window.selectedSearchLocation) {
                const coordinate = {
                    lat: selectedSearchLocation.latitude,
                    lng: selectedSearchLocation.longitude,
                    address: selectedSearchLocation.address
                }
                searchMarkers = [coordinate];
            }

            setSearchCoordinatesSearchValue(searchValue);
            setSearchCoordinates(searchMarkers);
            return;

            // // marker + marker when hovering
            // const bgColor = "3849ab";
            // const icon = {
            //     url: `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container-bg_4x.png,icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=ff000000,${bgColor},ff000000&scale=2.0`,
            //     scaledSize: new googleRef.Size(30, 30),
            //     fillColor: "#F00",
            //     fillOpacity: 0.7,
            //     strokeWeight: 0.4,
            //     strokeColor: "#ffffff"
            // };
            // const markerIcon = {...icon, fillColor: bgColor}
            // const markerIconWithBorder = {
            //     ...markerIcon,
            //     strokeColor: '#ffffff',
            //     strokeOpacity: 0.6,
            //     strokeWeight: 8,
            // }
            //
            // // set marker
            // const refMarker = new googleRef.Marker({
            //     position: { lat: coordinate.lat, lng: coordinate.lng },
            //     // label: texts[key],
            //     title: selectedSearchLocation.address,
            //     icon: markerIcon,
            //     // label: event.icon
            // });
            //
            // // on click event
            // googleRef.event.addListener(refMarker, 'click', (function () {
            //     return function () {
            //         // infoWindow.setContent(buildInfoWindowContent(event));
            //         // infoWindow.open(map, refMarker);
            //     }
            // })(refMarker));
            //
            // // hover & leave events
            // googleRef.event.addListener(refMarker, 'mouseover', (function () {
            //     return function () {
            //         refMarker.setIcon(markerIconWithBorder)
            //     }
            // })(refMarker));
            // googleRef.event.addListener(refMarker, 'mouseout', (function () {
            //     return function () {
            //         refMarker.setIcon(markerIcon)
            //     }
            // })(refMarker));

            // if (searchMarkers && searchMarkers.length) {
            //     debugger;
            //     markerCluster.removeMarkers(searchMarkers)
            // }

            searchMarkers = [refMarker];
            // new MarkerClusterer(googleMapRef, [...markers, ...searchMarkers], {
            //     imagePath: "/images/marker_images/m",
            //     minimumClusterSize: 10
            // });

            return refMarker;
        }
    },[googleRef, googleMapRef])

    const getOptions = () => {
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

        return {
            styles:[
                ...lightModeStyles,
                noDefaultMarkers,
                noRoadLabels
            ]
        }
    }

    // --- render -----------------------------------------------------------------------
    return (
        <div className="map-container" style={{height: "CALC(100vh - 200px)", width: "100%", display: "flex", flexDirection: "column", gap: "10px"}}>
            <div className={"map-header"}>
                <div className={"map-search-location-input"}>
                    <input
                       type="text" className="map-header-location-input-search"
                       onClick={() => window.initLocationPicker('map-header-location-input-search', 'selectedSearchLocation', initSearchResultMarker)}
                       onKeyUp={() => window.setManualLocation('map-header-location-input-search', 'selectedSearchLocation')}
                       value={searchValue}
                       onChange={(e) => {
                           setSearchValue(e.target.value);
                       }}
                       autoComplete="off"
                       placeholder={TranslateService.translate(eventStore, 'MAP_VIEW.SEARCH.PLACEHOLDER')} />
                    <div className={getClasses("clear-search", searchCoordinates.length === 0 && 'hidden')}>
                        <a onClick={() => {
                            setSearchValue("");
                            window.selectedSearchLocation = undefined;
                            initSearchResultMarker();
                        }}>x</a>
                    </div>
                </div>
            </div>
            {/*{!googleMapRef && (*/}
            {/*    <div>*/}
            {/*        {TranslateService.translate(eventStore, 'MAP_VIEW.LOADING_PLACEHOLDER')}*/}
            {/*    </div>*/}
            {/*)}*/}
            <GoogleMapReact
                bootstrapURLKeys={{key: "AIzaSyDfnY7GcBdHHFQTxRCSJGR-AGUEUnMBfqo"}} /* AIzaSyA16d9FJFh__vK04jU1P64vnEpPc3jenec */
                center={
                    searchCoordinates.length > 0 ? searchCoordinates[0] : coordinates .length > 0 ? {lat: coordinates[0].lat, lng: coordinates[0].lng} : undefined
                }
                zoom={searchCoordinates.length > 0 ? 14 : 11}
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={({map, maps}) => setGoogleMapRef(map, maps)}
                clickableIcons={false}
                options={getOptions()}
            >
                {searchCoordinates.map((place, index) => (
                    <Marker
                        key={index}
                        locationData={[{...place}].map((x) => {
                            x.longitude = x.lng;
                            x.latitude = x.lat;
                            delete x.lng;
                            delete x.lat;
                            return x;
                        })[0]}
                        text={place.address}
                        lat={place.lat}
                        lng={place.lng}
                        searchValue={searchCoordinatesSearchValue}
                    />
                ))}
            </GoogleMapReact>
        </div>
    );
}

export default MapContainer