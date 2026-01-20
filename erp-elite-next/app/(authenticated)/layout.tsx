import AuthLayout from "@/components/AuthLayout";
import { SocketProvider } from "@/components/providers/SocketProvider";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <SocketProvider>
            <AuthLayout>{children}</AuthLayout>
        </SocketProvider>
    );
}
