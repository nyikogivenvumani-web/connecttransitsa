import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routeDecision } from './lib/api/auth';

/** Role-based route guard: /admin, /saps and /system need the matching role; / goes to /login. */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/') return NextResponse.redirect(new URL('/login', request.url));

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let role: string | null = null;
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    const { data: row } = await supabase.from('users').select('role').eq('id', data.user.id).single();
    role = (row as { role?: string } | null)?.role ?? null;
  }
  const target = routeDecision(pathname, role);
  return target ? NextResponse.redirect(new URL(target, request.url)) : response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
