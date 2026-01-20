import { formatCurrency } from "@/lib/utils";

interface MoneyDisplayProps {
    value: number | string | null | undefined;
    className?: string;
}

export default function MoneyDisplay({ value, className }: MoneyDisplayProps) {
    return (
        <span className={className}>
            {formatCurrency(value)}
        </span>
    );
}
