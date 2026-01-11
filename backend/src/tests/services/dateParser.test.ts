import { expect } from 'chai';
import { describe, it } from 'mocha';
import {
  getISODayEndString,
  getISODayStartString,
  getTimeDiff,
  isDate,
  isIso8601DatetimeString,
  isSameDate,
  isToday,
  TimeUnit,
} from '../../services/dateParser';

describe('Date Parser Utilities', () => {
  describe('isToday', () => {
    it('should return true for current date', () => {
      const today = new Date();
      expect(isToday(today)).to.be.true;
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).to.be.false;
    });

    it('should return false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).to.be.false;
    });
  });

  describe('isSameDate', () => {
    it('should return true for same date', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2024-01-15T22:45:00Z');
      expect(isSameDate(date1, date2)).to.be.true;
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2024-01-16T10:30:00Z');
      expect(isSameDate(date1, date2)).to.be.false;
    });

    it('should return false for different months', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2024-02-15T10:30:00Z');
      expect(isSameDate(date1, date2)).to.be.false;
    });

    it('should return false for different years', () => {
      const date1 = new Date('2024-01-15T10:30:00Z');
      const date2 = new Date('2025-01-15T10:30:00Z');
      expect(isSameDate(date1, date2)).to.be.false;
    });
  });

  describe('getISODayStartString', () => {
    it('should return midnight time for given date', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = getISODayStartString(date);
      expect(result).to.equal('2024-01-15T00:00:00.000Z');
    });

    it('should handle dates at end of day', () => {
      const date = new Date('2024-12-31T23:59:59.999Z');
      const result = getISODayStartString(date);
      expect(result).to.equal('2024-12-31T00:00:00.000Z');
    });
  });

  describe('getISODayEndString', () => {
    it('should return end of day time for given date', () => {
      const date = new Date('2024-01-15T14:30:45.123Z');
      const result = getISODayEndString(date);
      expect(result).to.equal('2024-01-15T23:59:59.999Z');
    });

    it('should handle dates at start of day', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = getISODayEndString(date);
      expect(result).to.equal('2024-01-01T23:59:59.999Z');
    });
  });

  describe('isIso8601DatetimeString', () => {
    it('should return true for valid ISO 8601 datetime with Z', () => {
      expect(isIso8601DatetimeString('2024-01-15T14:30:45Z')).to.be.true;
      expect(isIso8601DatetimeString('2024-01-15T14:30:45.123Z')).to.be.true;
    });

    it('should return true for valid ISO 8601 datetime with timezone offset', () => {
      expect(isIso8601DatetimeString('2024-01-15T14:30:45+01:00')).to.be.true;
      expect(isIso8601DatetimeString('2024-01-15T14:30:45-05:30')).to.be.true;
    });

    it('should return false for invalid ISO 8601 datetime', () => {
      expect(isIso8601DatetimeString('2024-01-15')).to.be.false;
      expect(isIso8601DatetimeString('2024-01-15 14:30:45')).to.be.false;
      expect(isIso8601DatetimeString('invalid date')).to.be.false;
      expect(isIso8601DatetimeString('2024/01/15T14:30:45Z')).to.be.false;
    });
  });

  describe('isDate', () => {
    it('should return true for valid date strings', () => {
      expect(isDate('2024-01-15')).to.be.true;
      expect(isDate('2024-01-15T14:30:45Z')).to.be.true;
      expect(isDate('January 15, 2024')).to.be.true;
    });

    it('should return false for invalid date strings', () => {
      expect(isDate('not a date')).to.be.false;
      expect(isDate('2024-13-45')).to.be.false;
    });
  });

  describe('getTimeDiff', () => {
    it('should calculate time difference in hours (default)', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T15:00:00Z');
      const result = getTimeDiff(date1, date2);
      expect(result).to.equal(5);
    });

    it('should calculate time difference in minutes', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T10:30:00Z');
      const result = getTimeDiff(date1, date2, TimeUnit.minutes);
      expect(result).to.equal(30);
    });

    it('should calculate time difference in seconds', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T10:00:45Z');
      const result = getTimeDiff(date1, date2, TimeUnit.seconds);
      expect(result).to.equal(45);
    });

    it('should return absolute value (order independent)', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T15:00:00Z');
      expect(getTimeDiff(date1, date2)).to.equal(getTimeDiff(date2, date1));
    });

    it('should return 0 for same dates', () => {
      const date1 = new Date('2024-01-15T10:00:00Z');
      const date2 = new Date('2024-01-15T10:00:00Z');
      expect(getTimeDiff(date1, date2)).to.equal(0);
    });
  });

  describe('TimeUnit enum', () => {
    it('should have correct millisecond values', () => {
      expect(TimeUnit.hours).to.equal(3600000);
      expect(TimeUnit.minutes).to.equal(60000);
      expect(TimeUnit.seconds).to.equal(1000);
    });
  });
});
