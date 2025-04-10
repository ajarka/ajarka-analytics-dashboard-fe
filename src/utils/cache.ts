export class Cache<T> {
    private data: Map<string, { value: T; timestamp: number }> = new Map();
    private ttl: number;

    constructor(ttlMinutes = 5) {
        this.ttl = ttlMinutes * 60 * 1000;
    }

    // Add method to get cache info
    getCacheInfo(key: string) {
        const item = this.data.get(key);
        if (!item) return null;

        const now = Date.now();
        const expiresAt = item.timestamp + this.ttl;
        const remainingTime = expiresAt - now;

        return {
            timestamp: item.timestamp,
            expiresAt: expiresAt,
            remainingMs: remainingTime,
            isExpired: remainingTime <= 0
        };
    }

    set(key: string, value: T) {
        this.data.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    get(key: string): T | null {
        const item = this.data.get(key);
        if (!item) return null;

        const isExpired = Date.now() - item.timestamp > this.ttl;
        if (isExpired) {
            this.data.delete(key);
            return null;
        }

        return item.value;
    }

    clear() {
        this.data.clear();
    }
}