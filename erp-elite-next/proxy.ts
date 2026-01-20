import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Map of routes to required permissions
const routePermissions: Record<string, string> = {
    "/users": "usuarios",
    "/finances": "finanzas",
    "/contacts": "contactos",
    "/approvals": "aprobaciones",
    "/donations": "donaciones",
    "/case-records": "registro-casos",
    "/reports": "reportes",
    "/quotes": "cotizaciones",
    "/subscriptions": "suscripciones",
    "/rrhh": "rrhh",
    "/policies": "politicas",
    "/certificates": "certificados",
    "/licenses": "licencias",
    "/projects": "proyectos",
    "/worksites": "obras",
    "/kpis": "kpis",
    "/marketing": "marketing",
    "/cloud": "cloud",
    "/meetings": "reuniones",
};

export async function proxy(request: NextRequest) {
    const AUTH_URL = process.env.BETTER_AUTH_URL!;
    const sessionCookie = getSessionCookie(request);
    const { pathname } = request.nextUrl;

    // If no session cookie, redirect to login
    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Check if route requires specific permission
    const matchingRoute = Object.keys(routePermissions).find(route => pathname.startsWith(route));

    if (matchingRoute) {
        const requiredPermission = routePermissions[matchingRoute];

        try {
            // Fetch session data from API to check permissions
            // We pass the cookie header to authenticate the request
            const response = await fetch(`${AUTH_URL}/api/session`, {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            });

            if (response.ok) {
                const sessionData = await response.json();
                const userPermissions: string[] = sessionData.permissions || [];

                // Check if user has the required permission (or sub-permission)
                const hasPermission = userPermissions.some(p =>
                    p === requiredPermission || p.startsWith(`${requiredPermission}.`)
                );

                if (!hasPermission) {
                    console.log(`Access denied to ${pathname}. Missing permission: ${requiredPermission}`);
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
            }
        } catch (error) {
            console.error("Error checking permissions in middleware:", error);
            // On error, we might want to allow access or fail safe. 
            // For security, failing safe (redirect or 403) is better, but to avoid loop on API error we proceed?
            // Let's redirect to dashboard if we can't verify permissions.
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/contacts/:path*",
        "/users/:path*",
        "/profile/:path*",
        "/cloud/:path*",
        "/finances/:path*",
        "/approvals/:path*",
        "/donations/:path*",
        "/case-records/:path*",
        "/reports/:path*",
        "/quotes/:path*",
        "/subscriptions/:path*",
        "/rrhh/:path*",
        "/policies/:path*",
        "/certificates/:path*",
        "/licenses/:path*",
        "/projects/:path*",
        "/worksites/:path*",
        "/kpis/:path*",
        "/marketing/:path*",
        "/meetings/:path*",
    ],
};
