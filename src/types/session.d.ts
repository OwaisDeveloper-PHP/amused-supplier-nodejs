import 'express-session';

interface FlashData {
  status?: string;
  error?: string;
  errors?: string[];
  old?: Record<string, unknown>;
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    flash?: FlashData;
    csrfToken?: string;
  }
}
