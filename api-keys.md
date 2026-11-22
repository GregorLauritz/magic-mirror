# API Keys

Magic Mirror calls a few external APIs directly from your browser. Most of them are free and keyless, but one requires a personal API key that you enter in the app's Settings screen. Your key is stored only in your browser (`localStorage`) and is never sent anywhere except directly to the API it belongs to.

## Geocode Maps API key (required for weather/location)

Magic Mirror uses [Geocode Maps.co](https://geocode.maps.co/) to turn your city/country/zip code into map coordinates for weather lookups.

1. Go to [geocode.maps.co](https://geocode.maps.co/) and sign up for a free account.
2. Copy your API key from your account dashboard.
3. Paste it into the "Geocode Maps API Key" field in Magic Mirror's Settings screen.

The free tier has a rate limit, but it's more than enough for a single device checking the weather every couple of minutes.

## Weather icons

Weather icons are served from OpenWeatherMap's keyless public icon CDN, so no OpenWeatherMap key is needed. (Earlier versions had an optional, unused "OpenWeatherMap API Key" field in Settings; it has been removed. A value you saved there stays in your browser's storage untouched but is no longer used.)

## A note on key exposure

Because these keys are used directly from your browser, they are visible in your browser's network requests and history. This is expected and fine for free-tier, low-privilege keys like these — just don't reuse a key that's tied to a paid plan or sensitive account.
