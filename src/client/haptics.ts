/**
 * Haptic feedback utility for tactile interactions.
 *
 * Provides consistent vibration patterns across the app for different
 * interaction types. Uses navigator.vibrate API which is widely supported
 * on mobile devices but may not work on desktop.
 */

/** Short tap - for most button clicks */
export const tap = () => navigator.vibrate?.(10);

/** Medium tap - for more significant actions */
export const mediumTap = () => navigator.vibrate?.(15);

/** Heavy tap - for confirmations or important actions */
export const heavyTap = () => navigator.vibrate?.(25);

/** Light tap - for subtle feedback */
export const lightTap = () => navigator.vibrate?.(6);

/** Success feedback - double pulse */
export const success = () => navigator.vibrate?.([10, 50, 10]);

/** Error feedback - longer vibration */
export const error = () => navigator.vibrate?.(50);

/**
 * Tick feedback for slider/dial interactions.
 * Call this on each "notch" while dragging to simulate
 * the feeling of rotating a combination lock.
 */
export const tick = () => navigator.vibrate?.(3);

/**
 * Create a tick function that only fires every N calls.
 * Returns a function that tracks calls and vibrates every `interval` calls.
 *
 * @param interval - Number of calls between vibrations (default: 5)
 * @returns A function to call on each change event
 *
 * @example
 * const tickHandler = createTickHandler(5);
 * slider.onChange = (value) => {
 *   tickHandler();
 *   // ... handle value change
 * };
 */
export const createTickHandler = (interval = 5) => {
  let count = 0;
  return () => {
    count++;
    if (count >= interval) {
      count = 0;
      tick();
    }
  };
};

/**
 * Selection feedback - for toggling views/options
 */
export const select = () => navigator.vibrate?.(8);



