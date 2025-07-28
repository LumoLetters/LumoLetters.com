// /assets/js/lib/event-bus.mjs Simple event bus implementation using CustomEvent

const eventBus = {
    /**
     * Emit an event with optional data
     * @param {string} eventName - The name of the event
     * @param {any} data - Optional data to pass with the event
     */
    emit(eventName, data = {}) {
      const event = new CustomEvent(eventName, { detail: data });
      document.dispatchEvent(event);
    },
  
    /**
     * Listen for an event
     * @param {string} eventName - The name of the event to listen for
     * @param {function} callback - The function to call when the event occurs
     */
    on(eventName, callback) {
      const handler = (event) => callback(event.detail);
      document.addEventListener(eventName, handler);
      return () => document.removeEventListener(eventName, handler);
    },
  
    /**
     * Listen for an event once, then remove the listener
     * @param {string} eventName - The name of the event to listen for
     * @param {function} callback - The function to call when the event occurs
     */
    once(eventName, callback) {
      const handler = (event) => {
        callback(event.detail);
        document.removeEventListener(eventName, handler);
      };
      document.addEventListener(eventName, handler);
    }
  };
  
  export default eventBus;