import { initializeMap } from './map.js';
import { setLeadLevel } from './chart.js';

const phillyPark = await fetch('data/philly-park.json');
const parks = await phillyPark.json();

const soilLead = await fetch('data/soil-lead-2023-7.json');
const leadSamples = await soilLead.json();

const cityBoundary = await fetch('data/City_Limits.geojson');
const cityLimits = await cityBoundary.json();

// make things avaliable in every file
window.parks = parks;
window.leadSamples = leadSamples;
window.cityLimits = cityLimits;
window.schoolMap = initializeMap(parks, leadSamples, cityLimits); // remember to add new layer her as well
window.setLeadLevel = setLeadLevel;