/**
 * Currency formatting utility for Nigerian Naira (NGN)
 * Centralized to ensure consistent formatting across the app
 */

export const CURRENCY_CODE = 'NGN';
export const CURRENCY_SYMBOL = '₦';
export const CURRENCY_LOCALE = 'en-NG';

/**
 * Format a number as Nigerian Naira
 * @param {number|string} val - The value to format
 * @param {object} options - Formatting options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 0)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @param {boolean} options.compact - Use compact notation for large numbers (default: false)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(val, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    compact = false,
  } = options;

  const num = Number(val) || 0;

  if (compact && Math.abs(num) >= 1000) {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: 'currency',
      currency: CURRENCY_CODE,
      minimumFractionDigits,
      maximumFractionDigits,
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num);
  }

  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

/**
 * Format a number as Nigerian Naira with sign (+/-)
 * @param {number|string} val - The value to format
 * @param {boolean} showSign - Whether to show + sign for positive numbers
 * @returns {string} Formatted currency string with sign
 */
export function formatCurrencyWithSign(val, showSign = true) {
  const num = Number(val) || 0;
  const formatted = formatCurrency(Math.abs(num));
  if (num > 0 && showSign) return `+${formatted}`;
  if (num < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format a number as plain Naira without currency symbol (for calculations)
 * @param {number|string} val - The value to format
 * @returns {string} Plain number string
 */
export function formatPlainNumber(val, options = {}) {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2 } = options;
  const num = Number(val) || 0;
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

export default formatCurrency;