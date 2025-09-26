export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const TOKEN_EXPIRY = '2h';
export const SESSION_TIMEOUT = 2 * 60 * 1000; // 2 minutes
export const ROLES = {
    ADMIN: 'admin',
    CREATOR: 'creator',
    VALIDATOR: 'validator',
    ANALYST: 'analyst',
    USER: 'user',
    LEGAL: 'legal'
};