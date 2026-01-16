import { localApi } from './localApi';
import { hasSupabaseCredentials, supabase } from './supabase';

const DATA_BACKEND = import.meta.env.VITE_DATA_BACKEND || 'supabase';
const isLocal = DATA_BACKEND === 'local';

const dataClient = isLocal ? localApi : supabase;
const hasDataBackend = isLocal ? true : hasSupabaseCredentials;

// Server-side login is only available for local backend
const supportsServerAuth = isLocal;

export { DATA_BACKEND, dataClient, hasDataBackend, isLocal, supportsServerAuth };
