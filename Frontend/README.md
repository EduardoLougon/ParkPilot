# ParkingPilot SD

A React + Vite website for finding San Diego street parking with an interactive Leaflet map.

## Run locally

Requires Node.js 22.12+ (or a newer supported version).

    npm install
    npm run dev

Open the local URL printed by Vite.

## Build

    npm run build
    npm run preview

Deploy the generated dist directory to a static website host. This repository contains the frontend; the parking backend is hosted separately.

## Configuration

The frontend defaults to https://san-diego-parking-backend.onrender.com.
To use another backend, copy .env.example to .env and change VITE_API_URL.
The backend must allow the frontend origin through CORS.

## Features

- Address search within San Diego and browser location lookup
- Interactive map with parking pins and click-to-search
- Distance filtering up to 2 miles
- Arrival time, length of stay, and free/paid filters
- Availability estimates, meter details, and directions
- Parking assistant chat using structured API results

Arrival date input currently uses the displayed Pacific standard time offset (UTC-08:00). Check the offset when planning dates during daylight saving time.

Parking predictions use historical City of San Diego payment transactions, not live space sensors. Availability is not guaranteed. Check posted restrictions and signs.

Map tiles and address search use OpenStreetMap services. Parking data and chat use the configured backend.

## Expanded discovery backend

App1 now includes a Node service in server/discovery.mjs:
- GET /discovery/places?q=Target returns individual businesses with addresses and coordinates.
- GET /discovery/parking?lat=32.8222914&lon=-117.1785676&radius_m=1000 returns mapped parking facilities.

The service runs automatically inside Vite for development. For production run npm run build, then npm start. Deploy as a Node web service (render.yaml supplied), not a static site; the discovery endpoints require a server. The separate Render meter prediction service is unchanged.

Place lookup uses Nominatim/OpenStreetMap, with serialized upstream requests and a 10-minute bounded cache. This is suitable for a small deployment; use a dedicated geocoder for larger traffic. Discovery is not exhaustive. Private/no-access facilities are excluded; customer-only and unknown access are labeled. Facility coordinates may be centroids rather than vehicle entrances. Counts represent total capacity, never live vacancies.

No live camera source was verified or integrated. No camera-based availability claims are made.

Searches above 2000 meters combine bounded meter API queries, deduplicate poles, and recalculate distances from the requested destination. The provider returns at most 50 ranked meters per query, so coverage is not exhaustive. Chat accepts “within 2 miles”; requested distances above 2 miles are capped at 2 miles.
