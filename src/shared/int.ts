type Range = { min: number; max: number };

/**
 * Clamp a number within a range
 * @param num
 * @param range
 * @returns
 */
export const clamp = (num: number, range: Range) =>
  Math.min(Math.max(num, range.min), range.max);

/**
 * Check if a string contains only numeric characters
 * @param x
 * @returns
 */
const isNumeric = (x: string) => {
  return /^[0-9]+$/.test(x);
};

/**
 * Format a number with comma-separated thousandths
 * @param n
 * @returns
 */
export const commaSeparateThousandths = (n: number | string) => {
  if (typeof n === "string" && !isNumeric(n)) {
    throw new Error(`[comma separate thousandths] Value ${n} must be a number`);
  }
  return Number(n).toLocaleString("en-US");
};

/**
 * Convert bytes to other units.
 * @param bytes
 * @param decimals
 * @param binaryUnits
 * @example
 * ```js
 * formatBytes(293489203947847, 1);    // 293.5 TB
 * formatBytes(1234, 0);   // 1 KB
 * formatBytes(4534634523453678343456, 2); // 4.53 ZB
 * formatBytes(4534634523453678343456, 2, true));  // 3.84 ZiB
 * formatBytes(4566744, 1);    // 4.6 MB
 * formatBytes(534, 0);    // 534 Bytes
 * formatBytes(273403407, 0);  // 273 MB
 * ```
 * @returns
 */
export const formatBytes = (
  bytes?: number,
  decimals = 1,
  binaryUnits = false
) => {
  if (!bytes) return {};
  if (bytes === 0) return { value: 0, unit: "Bytes" };

  const unitMultiple = binaryUnits ? 1024 : 1000;
  const unitNames =
    unitMultiple === 1024
      ? ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"]
      : ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const unitChanges = Math.floor(Math.log(bytes) / Math.log(unitMultiple));
  const value = parseFloat(
    (bytes / Math.pow(unitMultiple, unitChanges)).toFixed(decimals || 0)
  );
  const unit = unitNames[unitChanges];
  return { value, unit, display: `${value}${unit}` };
};

