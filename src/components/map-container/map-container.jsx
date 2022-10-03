import React, {Component, useContext, useEffect} from "react";
import GoogleMapReact from "google-map-react";
import MarkerClusterer from "@googlemaps/markerclustererplus";
import * as _ from "lodash";
import {eventStoreContext} from "../../stores/events-store";
import {priorityToColor} from "../../utils/consts";
import TranslateService from "../../services/translate-service";

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

    useEffect(() => {
        const script = document.createElement("script");
        script.src =
            "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js";
        script.async = true;
        document.body.appendChild(script);
    });

    const setGoogleMapRef = (map, maps) => {
        let googleMapRef = map;
        let googleRef = maps;

        const infoWindow = new googleRef.InfoWindow();

        const icon = {
            path: "M27.648-41.399q0-3.816-2.7-6.516t-6.516-2.7-6.516 2.7-2.7 6.516 2.7 6.516 6.516 2.7 6.516-2.7 2.7-6.516zm9.216 0q0 3.924-1.188 6.444l-13.104 27.864q-.576 1.188-1.71 1.872t-2.43.684-2.43-.684-1.674-1.872l-13.14-27.864q-1.188-2.52-1.188-6.444 0-7.632 5.4-13.032t13.032-5.4 13.032 5.4 5.4 13.032z",
            fillColor: '#E32831',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 0.5
        };

        let markers =
            coordinates &&
            coordinates.map((marker, index) => {
                const key = getKey(marker);
                const event = coordinatesToEvents[key];

                const markerIcon = {...icon, fillColor: priorityToColor[event.priority]}

                const refMarker = new googleRef.Marker({
                    position: { lat: marker.lat, lng: marker.lng },
                    label: texts[key],
                    title: texts[key],
                    icon: markerIcon
                });

                googleRef.event.addListener(refMarker, 'click', (function(marker) {

                    return function() {
                        infoWindow.setContent(`<div style="display: flex; flex-direction: column; gap: 3px;">
                                <div><b><u>${event.title}</u></b></div>
                                <span style="margin-bottom: 2px;">${event.location.address}</span>
                                ${event.description ? `<span>${event.description}</span>` : ''}
                             </div>`);
                        infoWindow.open(map, refMarker);
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