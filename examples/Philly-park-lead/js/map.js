/* globals turf */

import { calLeadStyle } from './map-style.js';
import { calParkStyle } from './map-style.js';
import { legendStyle } from './map-style.js';
import { backButtonStyle } from './map-style.js';
import { leadAnalysis } from './cal.js';
import { setLeadLevel } from './chart.js';

// add layers to map
let phillyParkLayer = null;
let soilLayer = null;
let cityLayer = null;

function initializeMap(parks, leadSamples, cityLimits, events) { // remember to input all the layers specify below
  const map = L.map('map', {zoomSnap: 0}).setView([40.01, -75.15], 11); // zoomSnap 0 make the zoom level to real number
  const baseTileLayer = L.tileLayer('https://api.mapbox.com/styles/v1/junyiy/clng7r3oq083901qx0eu9gaor/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoianVueWl5IiwiYSI6ImNsbXMza292bjAxcXoybG1meHhuZ3N1cjYifQ.EYo5VECxk9-NCAEgc3dm9w', {
    attribution: `© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>`,
  });
  baseTileLayer.addTo(map);

  phillyParkLayer = L.geoJSON(parks,
    {style: calParkStyle,
    }).bindTooltip((l) => {
    return `<p class="tool-park"><strong>Green Space:</strong> ${l.feature.properties.SITE_NAME}</p>`;
  }).bindPopup((l) => {
    return `<h3 class="pop-title">${l.feature.properties.SITE_NAME}</h3>
    <p class="pop-content"><strong>Parent:</strong> ${l.feature.properties.CHILD_OF}</p>
    <p class="pop-content"><strong>Type:</strong> ${l.feature.properties.USE_}</p>
    <p class="pop-content"><strong>Area (acre):</strong> ${l.feature.properties.ACREAGE.toFixed(2)}</p>`;
  });
  phillyParkLayer.addTo(map);

  soilLayer = L.geoJSON(leadSamples,
    {style: calLeadStyle,
      pointToLayer: (parks, latlng) => L.circleMarker(latlng), // just type latlng or any names and leaflet know how to find goejson's coordinate
      // Can also do the latlng manually, remember to flip the lon lat (leaflet and geojson read it in the opposite way)
      // pointToLayer: (parks) => L.circleMarker([parks.geometry.coordinates[1], parks.geometry.coordinates[0]]),
    }).bindTooltip((l) => {
    return `<p class="tool-lead"><strong>Lead (ppm):</strong> ${l.feature.properties.Lead__ppm}</p>`;
  });

  soilLayer.addTo(map);

  cityLayer = L.geoJSON(cityLimits,
    { stroke: true,
      fill: false,
      color: '#446E5F',
      dashArray: '5 6',
      weight: 2,
    });
  cityLayer.addTo(map);

  // make the zoom level fit different browser size
  map.fitBounds(cityLayer.getBounds());

  // add legend
  const legend = L.control({position: 'bottomright'});
  legend.onAdd = (map) => {
    return legendStyle(map); // remeber to return the function
  };
  legend.addTo(map);

  // add back button
  const backView = L.control({position: 'topleft'});
  backView.onAdd = (map) => {
    return backButtonStyle(map);
  };
  backView.addTo(map);

  // modify map zoom when click buttons on the right
  // call cutomized event
  events.addEventListener('zoom-map', (evt) => {
    // match the clicked park by polygon ID of geojson file
    const ID = evt.detail.mapZoomSelect;
    phillyParkLayer.resetStyle();
    phillyParkLayer.eachLayer((layer) => { // .eachLayer is to get each object from this layer
      if (layer.feature.id == ID) { // still need feature, if not, it will be an array; the feature here is a leaflet attribute, which get each feature from geojson "features", not the geojson path
        // .fitBounds will just show the final results, .flyToBound is fancy

        layer.setStyle({
          stroke: true,
          color: 'red',
          weight: 3,
        });
        layer.bringToFront();

        // set zoomin level
        const parkZoom = turf.buffer(layer.feature, 0.5); // calculate buffer, 0.2km
        console.log(parkZoom)
        const [minLon, minLat, maxLon, maxLat] =turf.bbox(parkZoom);
        map.flyToBounds([[minLat, minLon], [maxLat, maxLon]]);

        // updateSoilChart(layer.feature, leadSamples)
        const parkBuffer = turf.buffer(layer.feature, 0.2); // calculate buffer, 0.2km
        const parkLead = leadAnalysis(parkBuffer, leadSamples); // do the calculations
        setLeadLevel(parkLead); // change the chart
      }
    });
  });

  return map;
}


export {
  initializeMap,
  cityLayer,
};
