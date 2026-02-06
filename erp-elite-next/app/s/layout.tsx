
export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b py-4 px-6 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center gap-2">
                    {/* You could add Logo here */}
                    <h1 className="text-xl font-bold text-gray-800">Elite ERP Cloud</h1>
                </div>
            </header>
            <main className="flex-1 flex flex-col items-center p-6">
                <div className="w-full max-w-5xl">
                    {children}
                </div>
            </main>
            <footer className="py-6 text-center text-gray-500 text-sm">
                <p>© {new Date().getFullYear()} Elite ERP. Compartido de forma segura.</p>
            </footer>
        </div>
    );
}
