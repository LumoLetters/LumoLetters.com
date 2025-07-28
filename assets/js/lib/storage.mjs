// /assets/js/lib/storage.mjs Simple storage utility for localStorage
const NAMESPACE = 'lumoletters_';

/**
 * Get an item from localStorage
 * @param {string} key - The storage key
 * @returns {any} - The parsed value or null
 */
export function getItem(key) {
  try {
    const value = localStorage.getItem(`${NAMESPACE}${key}`);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting item from storage:', error);
    return null;
  }
}

/**
 * Set an item in localStorage
 * @param {string} key - The storage key
 * @param {any} value - The value to store
 * @returns {boolean} - Success or failure
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(`${NAMESPACE}${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error setting item in storage:', error);
    return false;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - The storage key
 */
export function removeItem(key) {
  try {
    localStorage.removeItem(`${NAMESPACE}${key}`);
  } catch (error) {
    console.error('Error removing item from storage:', error);
  }
}

/**
 * Clear all items with the application namespace
 */
export function clearAll() {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(NAMESPACE)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}