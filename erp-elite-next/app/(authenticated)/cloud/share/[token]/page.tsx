
import SharedCloudView from "./SharedCloudView";

export default async function AuthenticatedSharePage({
    params
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = await params;

    return <SharedCloudView token={token} />;
}
