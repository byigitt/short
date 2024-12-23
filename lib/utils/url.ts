import { customAlphabet } from 'nanoid';
import { format } from 'date-fns';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Create a custom nanoid with only alphanumeric characters
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

// List of reserved keywords that cannot be used as custom aliases
const RESERVED_KEYWORDS = [
  'api',
  'admin',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  'dashboard',
  'analytics',
  'settings',
  'profile',
  'auth',
  'oauth',
  'callback',
  'static',
  'public',
  'assets',
  'images',
  'css',
  'js',
  'fonts',
  '404',
  'not-found',
  'error',
];

export function generateShortCode(): string {
  return nanoid();
}

export function isReservedKeyword(alias: string): boolean {
  return RESERVED_KEYWORDS.includes(alias.toLowerCase());
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy h:mm a');
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}