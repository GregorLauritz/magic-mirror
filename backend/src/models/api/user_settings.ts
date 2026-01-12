export type ApiDtoUserSettings = {
  country: string;
  city: string;
  zip_code: string;
  events_cal_id: string;
  birthday_cal_id: string;
  train_departure_station_id?: string;
  train_departure_station_name?: string;
  train_arrival_station_id?: string;
  train_arrival_station_name?: string;
};
