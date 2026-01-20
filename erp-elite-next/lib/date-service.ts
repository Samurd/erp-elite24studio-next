import { format } from "date-fns"
import { es } from "date-fns/locale"

export class DateService {
    /**
     * Returns a standardized date string for DB storage (YYYY-MM-DD).
     * Uses the date object provided or current date.
     * Note: This keeps the 'date' part of the ISO string (UTC) if toUTC is true, 
     * or formats the local date to YYYY-MM-DD if false.
     * 
     * User Rule: "Standard format using global UTC"
     * 
     * If we want strictly UTC date part:
     */
    static toDB(date: Date = new Date()): string {
        return date.toISOString().split('T')[0]
    }

    /**
     * Returns full ISO string (UTC) for Timestamp columns.
     */
    static toISO(date: Date = new Date()): string {
        return date.toISOString()
    }

    /**
     * Formats a date string (from DB/API) to a local display string.
     * Default: dd/MM/yyyy
     * Uses local timezone of the client.
     */
    static toDisplay(dateStr: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy"): string {
        if (!dateStr) return "-"

        // Handle potential 'YYYY-MM-DD' strings which New Date() parses as UTC usually, 
        // but simple strings might be parsed as local depending on browser.
        // Safest is to treat YYYY-MM-DD as simple date.
        // But if it comes from our toDB (ISO split), it is UTC.
        // For display, we often want the "User's Local Date" corresponding to that instant?
        // Or if it's just a Date (no time), we just want that Date.
        // If I save "2024-01-14" (UTC), and view in UTC-5, new Date("2024-01-14") is 2024-01-14T00:00:00.000Z.
        // format in local time (UTC-5) would proceed to previous day? 2024-01-13 19:00:00.
        // This is a common issue.
        // If it's a DATE column (no time), we usually want to show the exact string "YYYY-MM-DD" formatted.
        // For now, I will use a safe parsing that preserves the intended calendar day if it matches YYYY-MM-DD pattern.

        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
        if (isNaN(date.getTime())) return "-"

        // If we want to strictly force timezone adjustment handling, we'd need more logic.
        // But for now, using standard format logic.
        // However, to fix the "Previous Day" issue with UTC Dates:
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            // It's a plain date string, treat as local to avoid shifting
            const [y, m, d] = dateStr.split('-').map(Number)
            const localDate = new Date(y, m - 1, d)
            return format(localDate, formatStr, { locale: es })
        }

        return format(date, formatStr, { locale: es })
    }

    /**
     * Formats a 'date' column string (YYYY-MM-DD or ISO) to local display string.
     * STRICTLY ignores time/timezone to prevent day shifting. 
     * Use this for Birthdays, Inductions, Deadlines etc.
     */
    static toDisplayDate(dateStr: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy"): string {
        if (!dateStr) return "-"

        const str = typeof dateStr === 'string'
            ? dateStr
            : dateStr instanceof Date
                ? dateStr.toISOString()
                : String(dateStr);

        // Extract YYYY-MM-DD regardless of what follows (T, space, etc)
        const match = str.match(/^(\d{4}-\d{2}-\d{2})/);

        if (match) {
            const [y, m, d] = match[1].split('-').map(Number)
            // Construct local date at midnight
            const localDate = new Date(y, m - 1, d)
            return format(localDate, formatStr, { locale: es })
        }

        // Fallback for non-standard strings
        const date = new Date(str)
        return isNaN(date.getTime()) ? "-" : format(date, formatStr, { locale: es })
    }

    /**
     * Formats a date for HTML Input standard (YYYY-MM-DD)
     * This uses local time to set the input value.
     */
    static toInput(dateStr: string | Date | null | undefined): string {
        if (!dateStr) return ""

        // Fix for plain date strings (YYYY-MM-DD) being treated as UTC and shifting to previous day in local time
        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr
        }

        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
        if (isNaN(date.getTime())) return ""

        return format(date, "yyyy-MM-dd")
    }

    /**
     * Current date for input defaults (YYYY-MM-DD), local time.
     */
    static todayInput(): string {
        return format(new Date(), "yyyy-MM-dd")
    }

    /**
     * Parses a date string (YYYY-MM-DD) or ISO string to a Date object.
     * Handles timezone compensation for YYYY-MM-DD strings to ensure correct local date.
     */
    static parseToDate(dateStr: string | null | undefined): Date | undefined {
        if (!dateStr) return undefined;

        if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const [y, m, d] = dateStr.split('-').map(Number);
            return new Date(y, m - 1, d);
        }

        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
    }
    /**
     * Formats a time string (HH:mm:ss or ISO) to display time with AM/PM.
     * Default: hh:mm a (e.g. 05:30 PM)
     */
    static toDisplayTime(timeStr: string | Date | null | undefined, formatStr: string = "hh:mm a"): string {
        if (!timeStr) return "-"

        let date: Date;

        // Handle HH:mm:ss strings by appending them to a dummy date
        if (typeof timeStr === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
            const [h, m] = timeStr.split(':').map(Number);
            date = new Date();
            date.setHours(h);
            date.setMinutes(m);
        } else {
            date = typeof timeStr === 'string' ? new Date(timeStr) : timeStr;
        }

        if (isNaN(date.getTime())) return "-"

        return format(date, formatStr, { locale: es })
    }
}
