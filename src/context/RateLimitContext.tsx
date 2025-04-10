import { createContext, createSignal, useContext, ParentComponent, onCleanup, createEffect } from 'solid-js';
import { checkRateLimit } from '../services/github';

interface RateLimitContextType {
    rateLimitData: () => any;
    setRateLimitData: (data: any) => void;
    isRateLimited: () => boolean;
    setIsRateLimited: (value: boolean) => void;
    checkAndUpdateRateLimit: () => Promise<void>;
}

const RateLimitContext = createContext<RateLimitContextType>();

export const RateLimitProvider: ParentComponent = (props) => {
    const [rateLimitData, setRateLimitData] = createSignal<any>(null);
    const [isRateLimited, setIsRateLimited] = createSignal(false);

    const checkAndUpdateRateLimit = async () => {
        const response = await checkRateLimit();
        setRateLimitData(response.rateLimit);
        setIsRateLimited(response.rateLimit.remaining === 0);
    };

    createEffect(() => {
        const interval = setInterval(() => {
            checkAndUpdateRateLimit();
        }, 60000); // Check every minute

        onCleanup(() => clearInterval(interval));
    });

    const value = {
        rateLimitData,
        setRateLimitData,
        isRateLimited,
        setIsRateLimited,
        checkAndUpdateRateLimit
    };

    return (
        <RateLimitContext.Provider value={value}>
            {props.children}
        </RateLimitContext.Provider>
    );
};

export const useRateLimit = () => {
    const context = useContext(RateLimitContext);
    if (!context) {
        throw new Error('useRateLimit must be used within a RateLimitProvider');
    }
    return context;
};