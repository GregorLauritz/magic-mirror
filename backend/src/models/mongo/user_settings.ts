import { Document, model, Schema } from 'mongoose';

export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export interface IDtoUserSettings extends Document {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  sub: string;
  widget_layout?: WidgetLayout[];
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
  },
  { strict: false },
);

export const DtoUserSettings = model('userSettings', UserSettingsSchema);
