export type CurrentWeather = {
  latitude: number;
  longitude: number;
  temperature: CurrentWeatherTemperature;
  windspeed: number;
  weathercode: number;
  update_time: string;
  weather_icon: string;
  description: string;
  precipitation_sum: number;
};

export type CurrentWeatherTemperature = {
  current: number;
  min: number;
  max: number;
  feels_like: number;
};

export type HourlyWeather = {
  latitude: number;
  longitude: number;
  timezone: string;
  forecast: Array<HourlyWeatherResource>;
};

export type HourlyWeatherResource = {
  time: string;
  temperature: number;
  precipitation: number;
  weather_icon: string;
  weathercode: number;
  description: string;
  windspeed: number;
};

export type WeatherForecast = {
  latitude: number;
  longitude: number;
  timezone: string;
  days: number;
  forecast: Array<WeatherForecastResource>;
};

export type WeatherForecastResource = {
  date: string;
  temperature: Temperature;
  precipitation: Precipitation;
  weather_icon: string;
  sunrise: string;
  sunset: string;
  weathercode: number;
  description: string;
  max_wind_speed: Windspeed;
};

export type Precipitation = {
  amount: number;
  hours: number;
  amount_unit: string;
};

export type Temperature = {
  min: number;
  max: number;
  unit: string;
};

export type Windspeed = {
  value: number;
  unit: string;
};

export type WeatherCodeEntry = {
  weathercode: number;
  description: string;
  weather_icon_day: string;
  weather_icon_night: string;
};

export const weather_code_list: Array<WeatherCodeEntry> = [
  {
    weathercode: 0,
    description: 'Cloud development not observed or not observable',
    weather_icon_day: '01d',
    weather_icon_night: '01n',
  },
  {
    weathercode: 1,
    description: 'Clouds generally dissolving or becoming less developed',
    weather_icon_day: '02d',
    weather_icon_night: '02n',
  },
  {
    weathercode: 2,
    description: 'State of sky on the whole unchanged',
    weather_icon_day: '02d',
    weather_icon_night: '02n',
  },
  {
    weathercode: 3,
    description: 'Clouds generally forming or developing',
    weather_icon_day: '02d',
    weather_icon_night: '02n',
  },
  {
    weathercode: 4,
    description: 'Visibility reduced by smoke, e.g. veldt or forest fires, industrial smoke or volcanic ashes',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 5,
    description: 'Haze',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 6,
    description:
      'Widespread dust in suspension in the air, not raised by wind at or near the station at the time of observation',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 7,
    description:
      'Dust or sand raised by wind at or near the station at the time of observation, but no well developed dust whirl(s) or sand whirl(s), and no duststorm or sandstorm seen',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 8,
    description:
      'Well developed dust whirl(s) or sand whirl(s) seen at or near the station during the preceding hour or at the time ot observation, but no duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 9,
    description:
      'Duststorm or sandstorm within sight at the time of observation, or at the station during the preceding hour',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 10,
    description: 'Mist',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 11,
    description: 'Patches',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 12,
    description: 'More or less continuous',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 13,
    description: 'Lightning visible, no thunder heard',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 14,
    description: 'Precipitation within sight, not reaching the ground or the surface of the sea',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 15,
    description:
      'Precipitation within sight, reaching the ground or the surface of the sea, but distant, i.e. estimated to be more than 5 km from the station',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 16,
    description:
      'Precipitation within sight, reaching the ground or the surface of the sea, near to, but not at the station',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 17,
    description: 'Thunderstorm, but no precipitation at the time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 18,
    description: 'Squalls',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 19,
    description: 'Funnel cloud(s)',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 20,
    description: 'Drizzle (not freezing) or snow grains',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 21,
    description: 'Rain (not freezing)',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 22,
    description: 'Snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 23,
    description: 'Rain and snow or ice pellets',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 24,
    description: 'Freezing drizzle or freezing rain',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 25,
    description: 'Shower(s) of rain',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 26,
    description: 'Shower(s) of snow, or of rain and snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 27,
    description: 'Shower(s) of hail, or of rain and hail',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 28,
    description: 'Fog or ice fog',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 29,
    description: 'Thunderstorm (with or without precipitation)',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 30,
    description: 'Slight or moderate duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 31,
    description: 'Slight or moderate duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 32,
    description: 'Slight or moderate duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 33,
    description: 'Severe duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 34,
    description: 'Severe duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 35,
    description: 'Severe duststorm or sandstorm',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 36,
    description: 'Slight or moderate blowing snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 37,
    description: 'Heavy drifting snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 38,
    description: 'Slight or moderate blowing snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 39,
    description: 'Heavy drifting snow',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 40,
    description:
      'Fog or ice fog at a distance at the time of observation, but not at the station during the preceding hour, the fog or ice fog extending to a level above that of the observer',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 41,
    description: 'Fog or ice fog in patches',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 42,
    description: 'Fog or ice fog, sky visible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 43,
    description: 'Fog or ice fog, sky invisible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 44,
    description: 'Fog or ice fog, sky visible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 45,
    description: 'Fog or ice fog, sky invisible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 46,
    description: 'Fog or ice fog, sky visible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 47,
    description: 'Fog or ice fog, sky invisible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 48,
    description: 'Fog, depositing rime, sky visible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 49,
    description: 'Fog, depositing rime, sky invisible',
    weather_icon_day: '50d',
    weather_icon_night: '50n',
  },
  {
    weathercode: 50,
    description: 'Drizzle, not freezing, intermittent',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 51,
    description: 'Drizzle, not freezing, continuous',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 52,
    description: 'Drizzle, not freezing, intermittent',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 53,
    description: 'Drizzle, not freezing, continuous',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 54,
    description: 'Drizzle, not freezing, intermittent',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 55,
    description: 'Drizzle, not freezing, continuous',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 56,
    description: 'Drizzle, freezing, slight',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 57,
    description: 'Drizzle, freezing, moderate or heavy (dence)',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 58,
    description: 'Drizzle and rain, slight',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 59,
    description: 'Drizzle and rain, moderate or heavy',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 60,
    description: 'Rain, not freezing, intermittent',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 61,
    description: 'Rain, not freezing, continuous',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 62,
    description: 'Rain, not freezing, intermittent',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 63,
    description: 'Rain, not freezing, continuous',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 64,
    description: 'Rain, not freezing, intermittent',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 65,
    description: 'Rain, not freezing, continuous',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 66,
    description: 'Rain, freezing, slight',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 67,
    description: 'Rain, freezing, moderate or heavy (dence)',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 68,
    description: 'Rain or drizzle and snow, slight',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 69,
    description: 'Rain or drizzle and snow, moderate or heavy',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 70,
    description: 'Intermittent fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 71,
    description: 'Continuous fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 72,
    description: 'Intermittent fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 73,
    description: 'Continuous fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 74,
    description: 'Intermittent fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 75,
    description: 'Continuous fall of snowflakes',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 76,
    description: 'Diamond dust (with or without fog)',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 77,
    description: 'Snow grains (with or without fog)',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 78,
    description: 'Isolated star-like snow crystals (with or without fog)',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 79,
    description: 'Ice pellets',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 80,
    description: 'Rain shower(s), slight',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 81,
    description: 'Rain shower(s), moderate or heavy',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 82,
    description: 'Rain shower(s), violent',
    weather_icon_day: '09d',
    weather_icon_night: '09n',
  },
  {
    weathercode: 83,
    description: 'Shower(s) of rain and snow mixed, slight',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 84,
    description: 'Shower(s) of rain and snow mixed, moderate or heavy',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 85,
    description: 'Snow shower(s), slight',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 86,
    description: 'Snow shower(s), moderate or heavy',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 87,
    description: 'Shower(s) of snow pellets or small hail, with or without rain or rain and snow mixed',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 88,
    description: 'Shower(s) of snow pellets or small hail, with or without rain or rain and snow mixed',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 89,
    description: 'Shower(s) of hail, with or without rain or rain and snow mixed, not associated with thunder',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 90,
    description: 'Shower(s) of hail, with or without rain or rain and snow mixed, not associated with thunder',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 91,
    description: 'Slight rain at time of observation',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 92,
    description: 'Moderate or heavy rain at time of observation',
    weather_icon_day: '10d',
    weather_icon_night: '10n',
  },
  {
    weathercode: 93,
    description: 'Slight snow, or rain and snow mixed or hail at time of observation',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 94,
    description: 'Moderate or heavy snow, or rain and snow mixed or hail at time of observation',
    weather_icon_day: '13d',
    weather_icon_night: '13n',
  },
  {
    weathercode: 95,
    description: 'Thunderstorm, slight or moderate, without hail but with rain and/or snow at time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 96,
    description: 'Thunderstorm, slight or moderate, with hail at time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 97,
    description: 'Thunderstorm, heavy, without hail but with rain and/or snow at time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 98,
    description: 'Thunderstorm combined with duststorm or sandstorm at time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
  {
    weathercode: 99,
    description: 'Thunderstorm, heavy, with hail at time of observation',
    weather_icon_day: '11d',
    weather_icon_night: '11n',
  },
];
