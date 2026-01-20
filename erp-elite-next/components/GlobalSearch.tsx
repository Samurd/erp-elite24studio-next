"use client";

import * as React from "react";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { Search } from "lucide-react";

interface GlobalSearchProps {
    permissions: Record<string, boolean>;
    open?: boolean;
    setOpen?: (open: boolean) => void;
}

export function GlobalSearch({
    permissions,
    open: externalOpen,
    setOpen: externalSetOpen,
}: GlobalSearchProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = React.useState(false);

    // Use external control if provided, otherwise internal state
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = externalSetOpen || setInternalOpen;

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(!open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setOpen]);

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false);
        command();
    }, [setOpen]);

    // Filter items based on permissions
    const filteredItems = React.useMemo(() => {
        return navigationItems.filter((item) => {
            if (!item.permission) return true;
            return permissions[item.permission];
        });
    }, [permissions]);

    return (
        <>
            <div
                onClick={() => setOpen(true)}
                className="w-full relative cursor-pointer group"
            >
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="text-gray-400 group-hover:text-gray-600 transition-colors" size={20} />
                </span>
                <div className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-400 text-sm group-hover:border-gray-400 transition-colors flex items-center justify-between">
                    <span>Buscar módulo...</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </div>
            </div>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Escribe para buscar..." />
                <CommandList>
                    <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                    <CommandGroup heading="Módulos">
                        {filteredItems.map((item) => (
                            <CommandItem
                                key={`${item.title}-${item.href}`}
                                onSelect={() => {
                                    runCommand(() => router.push(item.href));
                                }}
                                className="cursor-pointer"
                            >
                                {item.icon && (
                                    <item.icon className="mr-2 h-4 w-4" />
                                )}
                                <div className="flex flex-col">
                                    <span>{item.title}</span>
                                    {item.description && (
                                        <span className="text-xs text-muted-foreground">
                                            {item.description}
                                        </span>
                                    )}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
}
