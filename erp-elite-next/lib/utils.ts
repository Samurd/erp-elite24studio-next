import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | null | undefined) {
    if (value === undefined || value === null || value === "") return "";

    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    // Assuming value is in cents as per user requirement to divide by 100
    const realValue = numericValue / 100;

    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(realValue);
}
