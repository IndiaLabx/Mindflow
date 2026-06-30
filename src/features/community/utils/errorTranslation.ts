export type ErrorCategory = 'auth' | 'network' | 'validation' | 'upload' | 'storage' | 'realtime' | 'permission' | 'unknown';

export interface TranslatedError {
    category: ErrorCategory;
    userMessage: string;
    technicalDetails: any;
}

export const translateError = (error: any, context?: string): TranslatedError => {
    const rawMessage = error?.message || String(error);
    const rawDetails = error?.details || error?.stack || error;

    let category: ErrorCategory = 'unknown';
    let userMessage = 'An unexpected error occurred. Please try again.';

    console.error(`[ErrorTranslation - ${context || 'General'}] raw:`, {
        message: rawMessage,
        details: rawDetails,
        original: error
    });

    if (rawMessage.includes('is not iterable') || rawMessage.includes('map is not a function') || rawMessage.includes('spread')) {
        category = 'validation';
        userMessage = 'There was an issue synchronizing your feed. Please refresh the page.';
    } else if (rawMessage.includes('Unauthenticated') || rawMessage.includes('JWT') || rawMessage.includes('Auth') || rawMessage.includes('session')) {
        category = 'auth';
        userMessage = 'Your session has expired. Please log in again.';
    } else if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError') || rawMessage.includes('AbortError')) {
        category = 'network';
        userMessage = 'A network error occurred. Please check your connection and try again.';
    } else if (rawMessage.includes('storage') || rawMessage.includes('bucket') || rawMessage.includes('upload') || rawMessage.includes('media')) {
        category = 'storage';
        userMessage = 'There was an issue processing your media. Please try again.';
    } else if (rawMessage.includes('Unauthorized') || rawMessage.includes('permission') || rawMessage.includes('RLS') || rawMessage.includes('policy')) {
        category = 'permission';
        userMessage = 'You do not have permission to perform this action.';
    }

    return {
        category,
        userMessage,
        technicalDetails: rawDetails
    };
};
