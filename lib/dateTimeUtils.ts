/**
 * Utility functions for managing date, time, and timezones.
 */

console.log("--------------------/lib/dateTimeUtils.ts Component Mounted-----------------------");
export type DateTimeResult = {
    date: string; // e.g., "2024-01-05"
    time: string; // e.g., "5:00 PM"
    timezone: string; // e.g., "GST"
  };
  
  /**
   * Get the current UTC date-time.
   * @returns {Date} Current UTC date-time.
   */
  export const getUTCDateTime = (): Date => {
    return new Date();
  };
  
  /**
   * Convert a date object to a UTC date-time string.
   * @param date - Date object.
   * @returns {string} Formatted UTC date-time string.
   */
  export const formatToUTC = (date: Date): string => {
    return date.toISOString(); // Outputs in ISO format (e.g., "2024-01-05T12:00:00.000Z")
  };
  
  /**
   * Convert UTC date-time to a target timezone.
   * @param date - UTC Date object.
   * @param timeZone - Target timezone (e.g., 'Asia/Dubai', 'Asia/Kolkata').
   * @returns {DateTimeResult} Formatted date, time, and timezone.
   */
  export const formatDateTimeForTimeZone = (
    date: Date,
    timeZone: string
  ): DateTimeResult => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone,
      timeZoneName: "short",
    };
  
    const formatter = new Intl.DateTimeFormat("en-US", options);
    const parts = formatter.formatToParts(date);
  
    const formatted: any = {};
    parts.forEach(({ type, value }) => {
      formatted[type] = value;
    });
  
    return {
      date: `${formatted.year}-${formatted.month}-${formatted.day}`,
      time: `${formatted.hour}:${formatted.minute} ${formatted.dayPeriod}`,
      timezone: formatted.timeZoneName || timeZone,
    };
  };
  
  /**
   * Display a date-time string with timezone suffix.
   * @param dateTime - DateTimeResult object.
   * @returns {string} Formatted date-time string with timezone (e.g., "2024-01-05, 5:00 PM GST").
   */
  export const displayDateTimeWithTimeZone = (dateTime: DateTimeResult): string => {
    return `${dateTime.date}, ${dateTime.time} ${dateTime.timezone}`;
  };
  