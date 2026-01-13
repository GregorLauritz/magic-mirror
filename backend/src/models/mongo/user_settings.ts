import { Document, model, Schema } from 'mongoose';

export interface IDtoUserSettings extends Document {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  sub: string;
  train_departure_station_id?: string;
  train_departure_station_name?: string;
  train_arrival_station_id?: string;
  train_arrival_station_name?: string;
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
    train_departure_station_id: {
      type: String,
      required: false,
    },
    train_departure_station_name: {
      type: String,
      required: false,
    },
    train_arrival_station_id: {
      type: String,
      required: false,
    },
    train_arrival_station_name: {
      type: String,
      required: false,
    },
  },
  { strict: false },
);

export const DtoUserSettings = model('userSettings', UserSettingsSchema);
