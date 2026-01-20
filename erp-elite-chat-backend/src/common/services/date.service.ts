import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';

@Injectable()
export class DateService {
    /**
     * Returns the current date and time as a standard ISO 8601 string (UTC).
     * Format: YYYY-MM-DDTHH:mm:ss.sssZ
     * This is the global standard for data exchange. Frontends should convert this to local time.
     */
    now(): string {
        return new Date().toISOString();
    }

    /**
     * Formats a date using date-fns format tokens.
     * Wrapper around date-fns format() for consistent usage.
     * @param date Date object
     * @param formatString Format string (e.g., 'yyyy-MM-dd')
     */
    format(date: Date, formatString: string): string {
        return format(date, formatString);
    }

    /**
     * Returns a date string in the legacy format used by some manual SQL queries if needed.
     * Format: yyyy-MM-dd HH:mm:ss
     * @deprecated Try to use standard ISO strings (now()) whenever possible.
     */
    toDbFormat(date: Date = new Date()): string {
        return format(date, 'yyyy-MM-dd HH:mm:ss');
    }
}
