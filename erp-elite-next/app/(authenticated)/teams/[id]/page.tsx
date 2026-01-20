import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import ClientPage from './client-page';
import { notFound, redirect } from 'next/navigation';

export default async function TeamPage({
    params
}: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/login');
    }

    // Fetch initial data server-side for speed and SEO (if applicable)
    // We already have an API that returns { team, channels, members, isMember, currentUserRole }
    // Let's call that logic or fetch directly. 
    // Since we are on server, we can call the API handler directly if we import it, OR fetch via HTTP.
    // Calling via HTTP inside server component to own API is fine usually, but direct DB access is faster.
    // However, to reuse logic, I'll validly just fetch via the full URL or extract the logic.
    // For simplicity in this context, I'll let the ClientPage fetch or pass data?
    // ClientPage needs initial data.

    // Let's do a quick fetch to our own API to get the aggregated data.
    const baseUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/teams/${id}`, {
        headers: {
            Cookie: (await headers()).get('Cookie') || ''
        }
    });

    if (res.status === 404) return notFound();
    if (!res.ok) {
        // Handle error (e.g. 500)
        return <div>Error loading team</div>;
    }

    const data = await res.json();

    return (
        <ClientPage
            teamInitial={data.team}
            channelsInitial={data.channels}
            membersInitial={data.members}
            isMemberInitial={data.isMember}
            currentUserRole={data.currentUserRole}
            currentUser={session.user}
        />
    );
}
