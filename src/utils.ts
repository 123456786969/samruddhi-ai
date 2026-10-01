export function safeFormatDate(ts: any, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
    if (!ts) return 'Never';
    try {
        let ms = ts;
        if (typeof ts.toMillis === 'function') {
            ms = ts.toMillis();
        } else if (ts.seconds) {
            ms = ts.seconds * 1000;
        }
        const d = new Date(ms);
        if (isNaN(d.getTime())) return 'Invalid Date';
        return new Intl.DateTimeFormat('en-IN', options).format(d);
    } catch (e) {
        return 'Invalid Date';
    }
}
