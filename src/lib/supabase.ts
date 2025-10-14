import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfkmdenynqoydcmgydse.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma21kZW55bnFveWRjbWd5ZHNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDkwMDAsImV4cCI6MjA3NTc4NTAwMH0.pn-aVKm86_2mscxldeZkxf7eHfLmlDa8l4bUDyeGLwo'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'Connection': 'keep-alive',
    },
  },
})

// Performance logging utility
export const logSupabaseCall = (operation: string, startTime: number) => {
  const duration = Date.now() - startTime;
  if (duration > 1000) {
    console.warn(`⚠️ Slow Supabase call: ${operation} took ${duration}ms`);
  } else {
    console.log(`✅ Supabase call: ${operation} completed in ${duration}ms`);
  }
};

// Timeout wrapper to prevent hanging Supabase calls
export const withTimeout = <T>(
  promise: Promise<T>, 
  ms: number = 10000
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Database query wrapper with retry logic, timeout, and better error handling
export const dbQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries: number = 3,
  delay: number = 1000,
  timeoutMs: number = 15000,
  operationName: string = 'Database query'
): Promise<T> => {
  const startTime = Date.now();
  let lastError: any;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check if we have a valid session before making queries
      const sessionPromise = supabase.auth.getSession();
      const { data: { session } } = await withTimeout(sessionPromise, 5000);
      
      if (!session) {
        throw new Error('No active session - please log in again');
      }

      // Wrap the actual query with timeout
      const queryPromise = queryFn();
      const result = await withTimeout(queryPromise, timeoutMs);
      
      if (result.error) {
        throw result.error;
      }
      
      if (result.data === null) {
        throw new Error('No data returned from query');
      }
      
      // Log successful operation
      logSupabaseCall(`${operationName} (attempt ${attempt})`, startTime);
      return result.data;
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error?.code === 'PGRST116' || error?.code === '42501' || error?.message?.includes('No active session') || error?.message?.includes('timeout')) {
        console.error(`❌ ${operationName} failed permanently:`, error);
        throw error;
      }
      
      if (attempt < retries) {
        console.warn(`🔄 ${operationName} attempt ${attempt} failed, retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  console.error(`❌ ${operationName} failed after ${retries} attempts:`, lastError);
  throw lastError;
};

// Check if Supabase is ready for queries
export const isSupabaseReady = async (): Promise<boolean> => {
  try {
    const sessionPromise = supabase.auth.getSession();
    const { data: { session } } = await withTimeout(sessionPromise, 2000);

    const isReady = !!session;
    console.log('Supabase session check:', isReady ? 'Ready' : 'Not ready');
    return isReady;
  } catch (error) {
    console.error('Error checking Supabase readiness:', error);
    return false;
  }
};
