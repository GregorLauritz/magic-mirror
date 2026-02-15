import { Document, model, Schema } from 'mongoose';

export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TrainConnection = {
  id: string;
  departure_station_id: string;
  departure_station_name: string;
  arrival_station_id: string;
  arrival_station_name: string;
};

export type TrainDisplaySettings = {
  mode: 'carousel' | 'multiple';
  carousel_interval: number; // in seconds, default 15
};

export interface IDtoUserSettings extends Document {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  sub: string;
  widget_layout?: WidgetLayout[];
  train_connections?: TrainConnection[];
  train_display_settings?: TrainDisplaySettings;
}

const UserSettingsSchema = new Schema(
  {
    country: {
      type: String,
      required: true,
    },

    sub: {
      type: String,
      required: true,
      unique: true,
    },
    city: {
      type: String,
      required: false,
    },
    zip_code: {
      type: String,
      required: false,
    },
    birthday_cal_id: {
      type: String,
      required: false,
    },
    events_cal_id: {
      type: String,
      required: false,
    },
    widget_layout: {
      type: Array,
      required: false,
    },
    train_connections: {
      type: Array,
      required: false,
      validate: {
        validator: function (v: TrainConnection[]) {
          return v.length <= 5;
        },
        message: 'Maximum 5 train connections allowed',
      },
    },
    train_display_settings: {
      type: Object,
      required: false,
      default: {
        mode: 'carousel',
        carousel_interval: 15,
      },
    },
  },
  { strict: false },
);

export const DtoUserSettings = model('userSettings', UserSettingsSchema);
