import { RetainlyServer } from 'retainly';

// Use Vite's environment variable
export const retainly = new RetainlyServer(import.meta.env.VITE_RETAINLY_API_KEY || "", {
  onError(err) {
    console.error('[retainly] failed to send event', err);
  },
});
