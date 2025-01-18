import { calendar_v3 } from 'googleapis';
import { Birthday, BirthdayList } from 'models/api/birthdays';

const parseRetrievedBirthdays = async (events: calendar_v3.Schema$Events): Promise<BirthdayList> => {
  const items = events.items ?? [];
  return {
    count: items.length,
    list: await parseBirthdays(items),
  };
};

const parseBirthdays = async (birthdaysList: calendar_v3.Schema$Event[]): Promise<Array<Birthday>> => {
  const bdays: Array<Promise<Birthday>> = [];
  birthdaysList.forEach((b) => bdays.push(parseBirthday(b)));
  return Promise.all(bdays);
};

const parseBirthday = async (birthday: calendar_v3.Schema$Event): Promise<Birthday> => {
  const name = birthday.summary ?? '';
  return {
    name: name.replace("'s Birthday", ''),
    date: birthday.start?.date ?? new Date().toISOString(),
  };
};

export { parseRetrievedBirthdays };
