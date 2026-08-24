
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookieOptions: {
        // Session-only cookies: the browser deletes them when ALL tabs/windows
        // of the browser are closed. This gives us "logout on close" for free
        // with zero API calls. The maxAge of 0 tells @supabase/ssr to omit
        // the Expires/Max-Age directive, making them true session cookies.
        maxAge: 0,
      },
    }
  );
