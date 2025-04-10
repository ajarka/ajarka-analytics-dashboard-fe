type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class DebugLogger {
    private static isGlobalEnabled = import.meta.env.DEV; // Using Vite env
    private static enabledLevels: LogLevel[] = ['log', 'warn', 'error', 'info', 'debug'];

    static enable(status: boolean = true) {
        this.isGlobalEnabled = status;
        return this;
    }

    static setLevels(...levels: LogLevel[]) {
        this.enabledLevels = levels.length > 0 ? levels : ['log', 'warn', 'error', 'info', 'debug'];
        return this;
    }

    static log(...args: any[]) {
        if (this.isGlobalEnabled && this.enabledLevels.includes('log')) {
            console.log('🟢 [LOG]', ...args);
        }
    }

    // Method for warning
    static warn(...args: any[]) {
        if (this.isGlobalEnabled && this.enabledLevels.includes('warn')) {
            console.warn('🟠 [WARN]', ...args);
        }
    }

    // Method for error
    static error(...args: any[]) {
        if (this.isGlobalEnabled && this.enabledLevels.includes('error')) {
            console.error('🔴 [ERROR]', ...args);
        }
    }

    // Method for info
    static info(...args: any[]) {
        if (this.isGlobalEnabled && this.enabledLevels.includes('info')) {
            console.info('🔵 [INFO]', ...args);
        }
    }

    // Method for debug
    static debug(...args: any[]) {
        if (this.isGlobalEnabled && this.enabledLevels.includes('debug')) {
            console.debug('⚪ [DEBUG]', ...args);
        }
    }
}

(window as any).DebugLogger = DebugLogger;

export default DebugLogger;
