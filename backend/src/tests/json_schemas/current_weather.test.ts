export const weather_current_schema = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  type: 'object',
  properties: {
    latitude: {
      type: 'number',
    },
    longitude: {
      type: 'number',
    },
    temperature: {
      type: 'object',
      properties: {
        current: {
          type: 'number',
        },
        min: {
          type: 'number',
        },
        max: {
          type: 'number',
        },
        feels_like: {
          type: 'number',
        },
        unit: {
          type: 'string',
        },
      },
      required: ['current', 'min', 'max', 'feels_like', 'unit'],
    },
    windspeed: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
        },
        unit: {
          type: 'string',
        },
      },
      required: ['value', 'unit'],
    },
    weathercode: {
      type: 'integer',
    },
    update_time: {
      type: 'string',
    },
    weather_icon: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
    precipitation: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
        },
        unit: {
          type: 'string',
        },
      },
      required: ['value', 'unit'],
    },
  },
  required: [
    'latitude',
    'longitude',
    'temperature',
    'windspeed',
    'weathercode',
    'update_time',
    'weather_icon',
    'description',
    'precipitation',
  ],
};
