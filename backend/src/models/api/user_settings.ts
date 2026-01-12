export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ApiDtoUserSettings = {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  widget_layout?: WidgetLayout[];
};
