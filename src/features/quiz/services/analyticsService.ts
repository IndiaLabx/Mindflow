import { supabase } from '../../../lib/supabase';

/**
 * Supported analytics event names.
 */
export type AnalyticsEvent = 'app_installed' | 'quiz_started' | 'quiz_completed' | 'quiz_abandoned';

/**
 * Logs a custom analytics event to the Supabase database.
 *
 * This function follows a "fire and forget" pattern to ensure that analytics logging
 * does not block the main UI thread or user interactions. Errors are caught and logged
 * to the console (as warnings) rather than throwing exceptions.
 *
 * @param {AnalyticsEvent} eventName - The name of the event to log.
 * @param {Record<string, any>} [data] - Optional metadata or payload associated with the event.
 * @returns {Promise<void>} A promise that resolves when the log attempt is complete (success or fail).
 */
export const logEvent = async (eventName: AnalyticsEvent, data?: Record<string, any>) => {
  try {
    // Fire and forget - we don't want analytics to block the UI
    const { error } = await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_data: data
    });

    if (error) console.error("Analytics log error:", error);
  } catch (error) {
    // Fail silently in production so we don't annoy the user
    console.warn('Failed to log analytics event:', error);
  }
};
