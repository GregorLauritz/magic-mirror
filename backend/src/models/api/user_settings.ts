export type WidgetLayout = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type TrainConnection = {
  id: string;
  departureStationId: string;
  departureStationName: string;
  arrivalStationId: string;
  arrivalStationName: string;
};

export type TrainDisplaySettings = {
  mode: 'carousel' | 'multiple';
  carouselInterval: number; // in seconds, default 15
};

export type ApiDtoUserSettings = {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  widget_layout?: WidgetLayout[];
  train_connections?: TrainConnection[];
  train_display_settings?: TrainDisplaySettings;
};
