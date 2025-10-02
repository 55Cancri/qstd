import {
  format,
  formatISO,
  formatDistanceToNow,
  addSeconds,
  addMinutes,
  addHours,
  addDays,
  addBusinessDays,
  addWeeks,
  addMonths,
  addYears,
  isSameDay,
  isSameMonth,
  isSameYear,
} from "date-fns";
import type { Locale } from "date-fns";

// ============================================================================
// DURATION FORMATTING
// ============================================================================

type DurationFormat = "compact" | "full" | "clock" | "fractional";

type DurationOptions = {
  /** Format style: 'compact' (1h 2m), 'full' (1 hour 2 minutes), 'clock' (01:02:03), 'fractional' (1.4s, 1m4.4s) */
  format?: DurationFormat;
  /** Show zero values for intermediate units (e.g., "1h 0m 30s" vs "1h 30s") */
  showZero?: boolean;
};

/**
 * Formats milliseconds into human-readable duration strings
 * Supports compact (1h 2m), full (`1 hour 2 minutes`), clock (`01:02:03`), and fractional (1.4s, 1m4.4s) formats
 *
 * @param {Object} [options={}] - Configuration options
 * @param {string} [options.format="clock"] - format
 * @param {boolean} [options.showZero=false] - show zero prefix
 *
 * @example
 * formatDuration(90000) // "1:30"
 * formatDuration(3661000) // "1:01:01"
 * formatDuration(90000, { format: "compact" }) // "1m 30s"
 * formatDuration(90000, { format: "full" }) // "1 minute 30 seconds"
 * formatDuration(3600000, { format: "compact" }) // "1h"
 * formatDuration(3600000, { format: "compact", showZero: true }) // "1h 0m 0s"
 * formatDuration(3660000, { format: "full", showZero: true }) // "1 hour 1 minute 0 seconds"
 * formatDuration(1400, { format: "fractional" }) // "1.4s"
 * formatDuration(45300, { format: "fractional" }) // "45.3s"
 * formatDuration(64400, { format: "fractional" }) // "1m 4.4s"
 */
export const formatDuration = (
  ms: number | null,
  options: DurationOptions = {}
) => {
  if (ms === null || ms === undefined) return "--:--";

  const { format: fmt = "clock", showZero = false } = options;

  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (fmt === "clock") {
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (fmt === "full") {
    const parts = [];

    if (showZero) {
      // When showZero is true, show all units from the highest non-zero unit down
      const hasHours = hours > 0;
      const hasMinutes = minutes > 0;
      const hasSeconds = seconds > 0;

      if (hasHours || hasMinutes || hasSeconds) {
        if (hasHours) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
        if (hasHours || hasMinutes)
          parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
        parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
      } else {
        parts.push("0 seconds");
      }
    } else {
      // Normal behavior: only show non-zero units
      if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
      if (minutes > 0)
        parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
      if (seconds > 0)
        parts.push(`${seconds} ${seconds === 1 ? "second" : "seconds"}`);
    }

    return parts.join(" ") || "0 seconds";
  }

  if (fmt === "fractional") {
    // Calculate fractional seconds with precision
    const totalSecondsWithFraction = Math.abs(ms) / 1000;
    const totalMinutes = Math.floor(totalSecondsWithFraction / 60);

    if (totalMinutes === 0) {
      // Less than 1 minute: show fractional seconds (e.g., "1.4s", "45.3s")
      const fractionalSeconds = totalSecondsWithFraction.toFixed(1);
      return `${fractionalSeconds}s`;
    } else {
      // 1 minute or more: show minutes + fractional seconds (e.g., "1m 4.4s")
      const remainingSeconds = totalSecondsWithFraction % 60;
      const fractionalSeconds = remainingSeconds.toFixed(1);
      return `${totalMinutes}m ${fractionalSeconds}s`;
    }
  }

  // compact format (default fallback)
  const parts = [];

  if (showZero) {
    // When showZero is true, show all units from the highest non-zero unit down
    const hasHours = hours > 0;
    const hasMinutes = minutes > 0;
    const hasSeconds = seconds > 0;

    if (hasHours || hasMinutes || hasSeconds) {
      if (hasHours) parts.push(`${hours}h`);
      if (hasHours || hasMinutes) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
    } else {
      parts.push("0s");
    }
  } else {
    // Normal behavior: only show non-zero units
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
  }

  return parts.join(" ") || "0s";
};

// ============================================================================
// DATE FORMATTING
// ============================================================================

type DateInput = Date | string | number;

type DateFormatStyle =
  | "iso"
  | "short"
  | "medium"
  | "long"
  | "relative"
  | "year";

type DateOptions = {
  /** Predefined format style */
  style?: DateFormatStyle;
  /** Custom date-fns format string (overrides style) */
  pattern?: string;
  /** Include time component */
  includeTime?: boolean;
};

/**
 * Flexible date formatter that handles multiple input types and format styles
 * Supports ISO strings, timestamps, and Date objects with intelligent defaults
 * @example
 * // Date formatting with smart input handling
 * formatDate(new Date()) // "Dec 1, 2023"
 * formatDate("2023-12-01") // "Dec 1, 2023"
 * formatDate(1701388800000) // "Dec 1, 2023"
 * formatDate(date, { style: "short" }) // "12/1/23"
 * formatDate(date, { style: "long" }) // "December 1, 2023"
 * formatDate(date, { includeTime: true }) // "Dec 1, 2023 3:30 PM"
 * formatDate(date, { pattern: "yyyy-MM-dd" }) // Custom format
 */
export const formatDate = (input: DateInput, options: DateOptions = {}) => {
  const { style = "medium", pattern, includeTime = false } = options;

  // Convert input to Date object
  let date: Date;
  if (typeof input === "string") {
    date = new Date(input);
  } else if (typeof input === "number") {
    date = new Date(input);
  } else {
    date = input;
  }

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  // Use custom pattern if provided
  if (pattern) {
    return format(date, pattern);
  }

  // Handle predefined styles
  switch (style) {
    case "iso":
      return formatISO(date);
    case "short":
      return includeTime
        ? format(date, "M/d/yy h:mm a")
        : format(date, "M/d/yy");
    case "medium":
      return includeTime
        ? format(date, "MMM d, yyyy h:mm a")
        : format(date, "MMM d, yyyy");
    case "long":
      return includeTime
        ? format(date, "MMMM d, yyyy 'at' h:mm a")
        : format(date, "MMMM d, yyyy");
    case "relative":
      return formatDistanceToNow(date, { addSuffix: true });
    case "year":
      return format(date, "yyyy");
    default:
      return includeTime
        ? format(date, "MMM d, yyyy h:mm a")
        : format(date, "MMM d, yyyy");
  }
};

// ============================================================================
// THREAD DATE RANGE FORMATTING
// ============================================================================

type DateRangeInput = Date | string | number;

type DateRangeOptions = {
  /** Reference date for today checks (defaults to new Date()) */
  now?: Date;
  /** Show time segment when start and end are the same day (default: true) */
  showTimeWhenSameDay?: boolean;
  /** If true, appends (today) next to whichever date equals today (default: true) */
  markToday?: boolean;
  /** Custom label for today marker (default: "today") */
  todayLabel?: string;
  /** Separator between start and end segments (default: " - ") */
  separator?: string;
  /** Month text style (default: "short") */
  monthFormat?: "short" | "long";
  /** Lowercase am/pm in time output (default: true) */
  lowercaseAmPm?: boolean;
  /** Locale for date-fns formatter */
  locale?: Locale;
};

const toDate = (input: DateRangeInput) =>
  typeof input === "string" || typeof input === "number"
    ? new Date(input)
    : input;

/**
 * Formats a date range according to thread rules:
 * - Same day: "MMM d (today), h:mma - h:mma" (am/pm lowercase, hyphen between times)
 * - Different day, same month/year: "MMM d - d (today), yyyy"
 * - Different month, same year: "MMM d - MMM d (today), yyyy"
 * - Different year: "MMM d, yyyy - MMM d, yyyy" (append (today) next to the correct day if applicable)
 *
 * Notes:
 * - "(today)" is appended next to whichever date matches today.
 * - Times are shown only when start and end are the same calendar day.
 */
export const formatDateRange = (
  startInput: DateRangeInput,
  endInput: DateRangeInput,
  options: DateRangeOptions = {}
) => {
  const now = options.now ?? new Date();
  const showTimeWhenSameDay = options.showTimeWhenSameDay ?? true;
  const markToday = options.markToday ?? true;
  const todayLabel = options.todayLabel ?? "today";
  const separator = options.separator ?? " - ";
  const monthPattern = options.monthFormat === "long" ? "MMMM" : "MMM";
  const lowercaseAmPm = options.lowercaseAmPm ?? true;
  const { locale } = options;

  let start = toDate(startInput);
  let end = toDate(endInput);

  // Normalize order so start <= end
  if (start.getTime() > end.getTime()) {
    const tmp = start;
    start = end;
    end = tmp;
  }

  // Fallback for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

  const sameYear = isSameYear(start, end);
  const sameMonth = sameYear && isSameMonth(start, end);
  const sameDay = sameMonth && isSameDay(start, end);

  const isStartToday = isSameDay(start, now);
  const isEndToday = isSameDay(end, now);

  const appendToday = (base: string, isTodayFlag: boolean) =>
    markToday && isTodayFlag ? `${base} (${todayLabel})` : base;

  const fmt = (d: Date, pattern: string) =>
    locale ? format(d, pattern, { locale }) : format(d, pattern);

  if (sameDay) {
    const dayPart = appendToday(
      fmt(start, `${monthPattern} d`),
      isStartToday || isEndToday
    );
    if (!showTimeWhenSameDay) return dayPart;

    const timePattern = "h:mma";
    const formatTime = (d: Date) =>
      lowercaseAmPm ? fmt(d, timePattern).toLowerCase() : fmt(d, timePattern);
    const startTime = formatTime(start);
    const endTime = formatTime(end);
    return `${dayPart}, ${startTime}${separator}${endTime}`;
  }

  if (sameMonth) {
    // Example: "Jun 12 - 13 (today), 2025"
    const monthPart = fmt(start, monthPattern);
    const startDay = fmt(start, "d");
    const endDay = fmt(end, "d");
    const startSegment = appendToday(startDay, isStartToday);
    const endSegment = appendToday(endDay, isEndToday);
    const yearPart = fmt(start, "yyyy");
    return `${monthPart} ${startSegment}${separator}${endSegment}, ${yearPart}`;
  }

  if (sameYear) {
    // Example: "Aug 9 - Sep 1 (today), 2025"
    const startPart = appendToday(
      fmt(start, `${monthPattern} d`),
      isStartToday
    );
    const endPart = appendToday(fmt(end, `${monthPattern} d`), isEndToday);
    const yearPart = fmt(start, "yyyy");
    return `${startPart}${separator}${endPart}, ${yearPart}`;
  }

  // Different year
  const startPart = appendToday(
    fmt(start, `${monthPattern} d, yyyy`),
    isStartToday
  );
  const endPart = appendToday(fmt(end, `${monthPattern} d, yyyy`), isEndToday);
  return `${startPart}${separator}${endPart}`;
};

// Backwards-compatible alias for existing callers
export const formatThreadDateRange = (
  startInput: DateRangeInput,
  endInput: DateRangeInput,
  options: DateRangeOptions = {}
) => formatDateRange(startInput, endInput, options);

// ============================================================================
// DATE MANIPULATION
// ============================================================================

type TimeUnit =
  | "seconds"
  | "minutes"
  | "hours"
  | "days"
  | "weeks"
  | "months"
  | "years"
  | "businessDays";

type TimeAdjustment = Partial<Record<TimeUnit, number>>;

/**
 * Creates a new date by adding specified time units to a base date
 * Defaults to current date if no base date provided
 * @example
 * // Date manipulation
 * adjustDate({ hours: 2 }) // 2 hours from now
 * adjustDate({ days: -7, hours: 3 }, someDate) // (7 days ago + 3 hours) from someDate
 */
export const adjustDate = (
  adjustment: TimeAdjustment,
  baseDate: Date = new Date()
) => {
  let result = new Date(baseDate);

  if (adjustment.seconds) result = addSeconds(result, adjustment.seconds);
  if (adjustment.minutes) result = addMinutes(result, adjustment.minutes);
  if (adjustment.hours) result = addHours(result, adjustment.hours);
  if (adjustment.days) result = addDays(result, adjustment.days);
  if (adjustment.weeks) result = addWeeks(result, adjustment.weeks);
  if (adjustment.businessDays)
    result = addBusinessDays(result, adjustment.businessDays);
  if (adjustment.months) result = addMonths(result, adjustment.months);
  if (adjustment.years) result = addYears(result, adjustment.years);

  return result;
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Promise-based delay utility for async operations
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gets the current timestamp in milliseconds
 */
export const now = () => Date.now();

/**
 * Converts various time units to milliseconds
 * @example
 * const ms = toMs(5, "minutes") // Convert 5 minutes to milliseconds
 */
export const toMs = (
  value: number,
  unit: Exclude<TimeUnit, "businessDays"> = "seconds"
) => {
  const multipliers = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000, // approximate
    years: 365 * 24 * 60 * 60 * 1000, // approximate
  };

  return value * multipliers[unit];
};
