// Comprehensive seed data for Space Situational Awareness (SSA) platform

export const seedSatellites = [
  { sat_id: "OBJ-00001", name: "ISS (ZARYA)", type: "ST", altitude: 418.5, velocity: 7.66, inclination: 51.64, eccentricity: 0.0005, period: 92.9, lat: -28.4, lon: 142.1, operator: "NASA/ROSCOSMOS", risk: "LOW", launch_date: "1998-11-20" },
  { sat_id: "OBJ-00002", name: "HUBBLE SPACE TELESCOPE", type: "SAT", altitude: 535.0, velocity: 7.59, inclination: 28.47, eccentricity: 0.0003, period: 95.3, lat: 14.2, lon: -62.8, operator: "NASA", risk: "LOW", launch_date: "1990-04-24" },
  { sat_id: "OBJ-00003", name: "STARLINK-3021", type: "SAT", altitude: 550.2, velocity: 7.58, inclination: 53.05, eccentricity: 0.0001, period: 95.6, lat: 48.1, lon: -12.3, operator: "SPACEX", risk: "LOW", launch_date: "2021-08-11" },
  { sat_id: "OBJ-00004", name: "STARLINK-4187", type: "SAT", altitude: 549.8, velocity: 7.58, inclination: 53.05, eccentricity: 0.0002, period: 95.5, lat: -33.9, lon: 18.4, operator: "SPACEX", risk: "MEDIUM", launch_date: "2022-04-29" },
  { sat_id: "OBJ-00005", name: "GPS IIF-12", type: "SAT", altitude: 20180.0, velocity: 3.87, inclination: 55.02, eccentricity: 0.0080, period: 717.9, lat: 12.5, lon: 77.6, operator: "USSF", risk: "LOW", launch_date: "2016-02-05" },
  { sat_id: "OBJ-00006", name: "LANDSAT 9", type: "SAT", altitude: 705.0, velocity: 7.50, inclination: 98.22, eccentricity: 0.0001, period: 98.9, lat: 62.1, lon: 105.4, operator: "NASA", risk: "LOW", launch_date: "2021-09-27" },
  { sat_id: "OBJ-00007", name: "SENTINEL-2B", type: "SAT", altitude: 786.0, velocity: 7.45, inclination: 98.62, eccentricity: 0.0001, period: 100.6, lat: -45.1, lon: -70.2, operator: "ESA", risk: "LOW", launch_date: "2017-03-07" },
  { sat_id: "OBJ-00008", name: "TERRA", type: "SAT", altitude: 705.0, velocity: 7.50, inclination: 98.20, eccentricity: 0.0001, period: 98.8, lat: 35.6, lon: 139.7, operator: "NASA", risk: "LOW", launch_date: "1999-12-18" },
  { sat_id: "OBJ-00009", name: "AQUA", type: "SAT", altitude: 705.0, velocity: 7.50, inclination: 98.20, eccentricity: 0.0001, period: 98.8, lat: -15.8, lon: -47.9, operator: "NASA", risk: "LOW", launch_date: "2002-05-04" },
  { sat_id: "OBJ-00010", name: "NOAA-20", type: "SAT", altitude: 824.0, velocity: 7.43, inclination: 98.74, eccentricity: 0.0002, period: 101.4, lat: 55.7, lon: 37.6, operator: "NOAA", risk: "LOW", launch_date: "2017-11-18" },
  { sat_id: "OBJ-00011", name: "GOES-18", type: "SAT", altitude: 35786.0, velocity: 3.07, inclination: 0.04, eccentricity: 0.0001, period: 1436.1, lat: 0.1, lon: -137.2, operator: "NOAA", risk: "LOW", launch_date: "2022-03-01" },
  { sat_id: "OBJ-00012", name: "METEOSAT-11", type: "SAT", altitude: 35786.0, velocity: 3.07, inclination: 0.02, eccentricity: 0.0001, period: 1436.1, lat: 0.0, lon: 0.0, operator: "ESA", risk: "LOW", launch_date: "2015-07-15" },
  { sat_id: "OBJ-00013", name: "GAOFEN-7", type: "SAT", altitude: 506.0, velocity: 7.61, inclination: 97.40, eccentricity: 0.0001, period: 94.7, lat: 39.9, lon: 116.4, operator: "CNSA", risk: "LOW", launch_date: "2019-11-03" },
  { sat_id: "OBJ-00014", name: "YAOGAN-33", type: "SAT", altitude: 680.0, velocity: 7.51, inclination: 98.20, eccentricity: 0.0002, period: 98.3, lat: 31.2, lon: 121.5, operator: "CNSA", risk: "LOW", launch_date: "2020-12-27" },
  { sat_id: "OBJ-00015", name: "COSMOS 2542", type: "SAT", altitude: 368.0, velocity: 7.69, inclination: 97.90, eccentricity: 0.0003, period: 91.9, lat: 59.9, lon: 30.3, operator: "ROSCOSMOS", risk: "MEDIUM", launch_date: "2019-11-25" },
  { sat_id: "OBJ-00016", name: "TIANGONG (CSS)", type: "ST", altitude: 388.5, velocity: 7.68, inclination: 41.47, eccentricity: 0.0004, period: 92.3, lat: 23.1, lon: 113.2, operator: "CNSA", risk: "LOW", launch_date: "2021-04-29" },
  { sat_id: "OBJ-00017", name: "JWST RELAY-1", type: "SAT", altitude: 1500000.0, velocity: 1.02, inclination: 5.20, eccentricity: 0.0010, period: 4320.0, lat: 0.0, lon: 0.0, operator: "NASA/ESA", risk: "LOW", launch_date: "2021-12-25" },
  { sat_id: "OBJ-00018", name: "ONEWEB-0142", type: "SAT", altitude: 1200.0, velocity: 7.23, inclination: 87.40, eccentricity: 0.0001, period: 109.3, lat: -53.1, lon: -70.9, operator: "PRIVATE", risk: "LOW", launch_date: "2020-03-21" },
  { sat_id: "OBJ-00019", name: "IRIDIUM NEXT-88", type: "SAT", altitude: 780.0, velocity: 7.46, inclination: 86.40, eccentricity: 0.0002, period: 100.4, lat: 71.3, lon: -156.8, operator: "PRIVATE", risk: "LOW", launch_date: "2019-01-11" },
  { sat_id: "OBJ-00020", name: "CARTOSAT-3", type: "SAT", altitude: 505.0, velocity: 7.61, inclination: 97.50, eccentricity: 0.0001, period: 94.7, lat: 13.0, lon: 80.2, operator: "ISRO", risk: "LOW", launch_date: "2019-11-27" },
  { sat_id: "OBJ-00021", name: "LUNAR GATEWAY (SIM)", type: "ST", altitude: 412.0, velocity: 7.66, inclination: 51.60, eccentricity: 0.0002, period: 92.8, lat: 5.2, lon: -52.8, operator: "NASA", risk: "LOW", launch_date: "2024-01-15" }
];

export const seedDebris = [
  { deb_id: "DEB-20001", name: "DEB-20001 (COSMOS 2251)", altitude: 785.4, velocity: 7.45, inclination: 74.0, eccentricity: 0.0041, period: 100.5, lat: 45.2, lon: 12.4, operator: "ROSCOSMOS", risk: "HIGH", rcs_size: "MEDIUM" },
  { deb_id: "DEB-20002", name: "DEB-20002 (IRIDIUM 33)", altitude: 780.1, velocity: 7.46, inclination: 86.4, eccentricity: 0.0032, period: 100.4, lat: -22.1, lon: 44.8, operator: "PRIVATE", risk: "CRITICAL", rcs_size: "SMALL" },
  { deb_id: "DEB-20003", name: "DEB-20003 (FENGYUN 1C)", altitude: 852.3, velocity: 7.41, inclination: 98.8, eccentricity: 0.0055, period: 102.0, lat: 68.3, lon: -140.2, operator: "CNSA", risk: "CRITICAL", rcs_size: "MEDIUM" },
  { deb_id: "DEB-20004", name: "DEB-20004 (SL-16 R/B DEB)", altitude: 620.0, velocity: 7.55, inclination: 71.0, eccentricity: 0.0022, period: 97.1, lat: 10.5, lon: 105.1, operator: "ROSCOSMOS", risk: "HIGH", rcs_size: "LARGE" },
  { deb_id: "DEB-20005", name: "DEB-20005 (CZ-4 DEB)", altitude: 940.6, velocity: 7.36, inclination: 99.1, eccentricity: 0.0061, period: 103.8, lat: -35.2, lon: 150.3, operator: "CNSA", risk: "MEDIUM", rcs_size: "SMALL" },
  { deb_id: "DEB-20006", name: "DEB-20006 (DELTA 1 DEB)", altitude: 1420.0, velocity: 7.11, inclination: 102.1, eccentricity: 0.0084, period: 114.2, lat: 51.4, lon: -0.1, operator: "NASA", risk: "LOW", rcs_size: "SMALL" },
  { deb_id: "DEB-20007", name: "DEB-20007 (PEGASUS R/B DEB)", altitude: 510.3, velocity: 7.61, inclination: 82.0, eccentricity: 0.0018, period: 94.8, lat: -12.4, lon: -77.0, operator: "USSF", risk: "MEDIUM", rcs_size: "MEDIUM" },
  { deb_id: "DEB-20008", name: "DEB-20008 (THOR ABLE DEB)", altitude: 1180.2, velocity: 7.24, inclination: 82.4, eccentricity: 0.0071, period: 108.9, lat: 34.0, lon: -118.2, operator: "NASA", risk: "LOW", rcs_size: "SMALL" },
  { deb_id: "DEB-20009", name: "DEB-20009 (COSMOS 1408 ASAT)", altitude: 480.0, velocity: 7.62, inclination: 82.6, eccentricity: 0.0035, period: 94.2, lat: 55.8, lon: 37.6, operator: "ROSCOSMOS", risk: "CRITICAL", rcs_size: "SMALL" },
  { deb_id: "DEB-20010", name: "DEB-20010 (TITAN 3C TRANSTAGE)", altitude: 760.5, velocity: 7.47, inclination: 32.8, eccentricity: 0.0029, period: 100.0, lat: 28.5, lon: -80.6, operator: "USSF", risk: "HIGH", rcs_size: "LARGE" }
];

export const seedStations = [
  { station_id: "ST-001", name: "International Space Station (ISS)", crew: 7, altitude: 418.5, velocity: 7.66, lat: -28.4, lon: 142.1, inclination: 51.64, operator: "NASA / ESA / JAXA / CSA / ROSCOSMOS", status: "CREWED" },
  { station_id: "ST-002", name: "Tiangong Space Station (CSS)", crew: 3, altitude: 388.5, velocity: 7.68, lat: 23.1, lon: 113.2, inclination: 41.47, operator: "CNSA", status: "CREWED" },
  { station_id: "ST-003", name: "Lunar Gateway (Simulation Platform)", crew: 0, altitude: 412.0, velocity: 7.66, lat: 5.2, lon: -52.8, inclination: 51.60, operator: "NASA / International Partners", status: "AUTOMATED" }
];

export const seedConjunctions = [
  {
    conj_id: "CJ-001",
    obj_a_id: "OBJ-00004",
    obj_a_name: "STARLINK-4187",
    obj_b_id: "DEB-20002",
    obj_b_name: "DEB-20002 (IRIDIUM 33)",
    miss_distance_km: 0.142,
    rel_velocity_kms: 11.45,
    risk_level: "CRITICAL",
    collision_probability: 0.892,
    tca: new Date(Date.now() + 1800000).toISOString(),
    status: "ESCALATED"
  },
  {
    conj_id: "CJ-002",
    obj_a_id: "OBJ-00001",
    obj_a_name: "ISS (ZARYA)",
    obj_b_id: "DEB-20009",
    obj_b_name: "DEB-20009 (COSMOS 1408 ASAT)",
    miss_distance_km: 0.428,
    rel_velocity_kms: 14.12,
    risk_level: "HIGH",
    collision_probability: 0.345,
    tca: new Date(Date.now() + 4200000).toISOString(),
    status: "MONITORING"
  },
  {
    conj_id: "CJ-003",
    obj_a_id: "OBJ-00007",
    obj_a_name: "SENTINEL-2B",
    obj_b_id: "DEB-20003",
    obj_b_name: "DEB-20003 (FENGYUN 1C)",
    miss_distance_km: 0.580,
    rel_velocity_kms: 9.87,
    risk_level: "HIGH",
    collision_probability: 0.198,
    tca: new Date(Date.now() + 8400000).toISOString(),
    status: "MONITORING"
  },
  {
    conj_id: "CJ-004",
    obj_a_id: "OBJ-00005",
    obj_a_name: "GPS IIF-12",
    obj_b_id: "DEB-20006",
    obj_b_name: "DEB-20006 (DELTA 1 DEB)",
    miss_distance_km: 1.840,
    rel_velocity_kms: 5.62,
    risk_level: "MEDIUM",
    collision_probability: 0.045,
    tca: new Date(Date.now() + 14400000).toISOString(),
    status: "MONITORING"
  },
  {
    conj_id: "CJ-005",
    obj_a_id: "OBJ-00003",
    obj_a_name: "STARLINK-3021",
    obj_b_id: "DEB-20001",
    obj_b_name: "DEB-20001 (COSMOS 2251)",
    miss_distance_km: 0.089,
    rel_velocity_kms: 12.80,
    risk_level: "CRITICAL",
    collision_probability: 0.942,
    tca: new Date(Date.now() + 21600000).toISOString(),
    status: "ESCALATED"
  },
  {
    conj_id: "CJ-006",
    obj_a_id: "OBJ-00016",
    obj_a_name: "TIANGONG (CSS)",
    obj_b_id: "DEB-20007",
    obj_b_name: "DEB-20007 (PEGASUS R/B DEB)",
    miss_distance_km: 2.350,
    rel_velocity_kms: 8.40,
    risk_level: "MEDIUM",
    collision_probability: 0.021,
    tca: new Date(Date.now() + 32000000).toISOString(),
    status: "MONITORING"
  },
  {
    conj_id: "CJ-007",
    obj_a_id: "OBJ-00006",
    obj_a_name: "LANDSAT 9",
    obj_b_id: "DEB-20004",
    obj_b_name: "DEB-20004 (SL-16 R/B DEB)",
    miss_distance_km: 4.820,
    rel_velocity_kms: 7.15,
    risk_level: "LOW",
    collision_probability: 0.005,
    tca: new Date(Date.now() + 48000000).toISOString(),
    status: "MONITORING"
  }
];

export const seedSpaceWeather = [
  {
    kp_index: 3.8,
    solar_wind_speed: 472.5,
    solar_flare: "M1.4",
    proton_flux: 0.85,
    geomagnetic_status: "G1 Minor Storm Watch",
    aurora_latitude: 58.5
  }
];

export const seedNEOs = [
  { neo_id: "NEO-99942", name: "99942 Apophis", diameter_m: 370.0, velocity_kms: 30.73, miss_distance_ld: 0.098, is_hazardous: 1, close_approach: "2029-04-13T21:46:00Z" },
  { neo_id: "NEO-101955", name: "101955 Bennu", diameter_m: 490.0, velocity_kms: 27.85, miss_distance_ld: 1.950, is_hazardous: 1, close_approach: "2060-09-23T11:20:00Z" },
  { neo_id: "NEO-4179", name: "4179 Toutatis", diameter_m: 2450.0, velocity_kms: 35.12, miss_distance_ld: 18.200, is_hazardous: 1, close_approach: "2069-11-05T08:14:00Z" },
  { neo_id: "NEO-2024BX1", name: "2024 BX1", diameter_m: 1.2, velocity_kms: 15.20, miss_distance_ld: 0.000, is_hazardous: 0, close_approach: "2024-01-21T00:32:00Z" },
  { neo_id: "NEO-162173", name: "162173 Ryugu", diameter_m: 896.0, velocity_kms: 28.40, miss_distance_ld: 24.500, is_hazardous: 0, close_approach: "2076-12-05T14:30:00Z" }
];

export const seedAlerts = [
  { severity: "CRITICAL", title: "Close Approach Threshold Warning", description: "Starlink-4187 TCA with DEB-20002 within 0.14 km. Maneuver advisory generated.", object_id: "CJ-001" },
  { severity: "HIGH", title: "ISS Space Station Conjunction Alert", description: "Debris fragment DEB-20009 approaching within 0.43 km of ISS (Zarya). Tracking team notified.", object_id: "CJ-002" },
  { severity: "MEDIUM", title: "Solar Radiation Activity Escalation", description: "M1.4 Solar Flare detected from Active Region AR3664. Ionospheric disturbance expected in polar orbits.", object_id: null },
  { severity: "LOW", title: "Orbital Decay Prediction", description: "SL-16 Rocket body fragment anticipated atmospheric re-entry window refined to 72 hours.", object_id: "DEB-20004" }
];
