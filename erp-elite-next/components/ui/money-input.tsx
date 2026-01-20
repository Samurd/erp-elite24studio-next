"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MoneyInputProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
}

export default function MoneyInput({
    value,
    onChange,
    label = "Monto",
    placeholder = "$ 0,00",
    error,
    id,
    className,
    disabled
}: MoneyInputProps) {
    // Format number to COP currency string
    const formatCurrency = (val: number) => {
        if (val === undefined || val === null) return "";

        // val is in cents (integer)
        const realValue = val / 100;

        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(realValue);
    };

    const [displayValue, setDisplayValue] = React.useState("");

    // Sync display value when value prop changes
    React.useEffect(() => {
        setDisplayValue(formatCurrency(value || 0));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Get digits only
        const digits = e.target.value.replace(/\D/g, "");

        // 2. Parse as integer
        const numericValue = parseInt(digits || "0", 10);

        // 3. Update display immediately logic? 
        // In React controlled inputs, we update parent, and parent updates prop, which triggers useEffect.
        // But for smoother experience with masking, sometimes local state helps.
        // However, useEffect dependency on [value] is usually fast enough.

        onChange(numericValue);
    };

    return (
        <div className={cn("space-y-2", className)}>
            {label && <Label htmlFor={id} className={cn(error && "text-destructive")}>{label}</Label>}
            <Input
                id={id}
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
                inputMode="numeric"
                disabled={disabled}
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </div>
    );
}
