import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { Card } from './Card';
import { Box, HStack, Badge, Tooltip, Text } from "@hope-ui/solid";
import { FaSolidArrowsRotate } from 'solid-icons/fa';

interface RateLimitData {
    limit: number;
    remaining: number;
    used: number;
    resetAt: string;
}

interface CacheStatusProps {
    lastUpdate: number;
    expiresAt: number;
    rateLimit: RateLimitData;
    onRefresh?: () => void;
    compact?: boolean;
}

export const CacheStatus: Component<CacheStatusProps> = (props) => {
    const [timeUntilRefresh, setTimeUntilRefresh] = createSignal<string>('');
    const [timeUntilReset, setTimeUntilReset] = createSignal<string>('');

    const updateTimers = () => {
        const now = Date.now();
        const cacheRemaining = props.expiresAt - now;
        const resetRemaining = new Date(props.rateLimit.resetAt).getTime() - now;

        setTimeUntilRefresh(formatTimeRemaining(cacheRemaining));
        setTimeUntilReset(formatTimeRemaining(resetRemaining));
    };

    const formatTimeRemaining = (ms: number) => {
        if (ms <= 0) return '0m';
        const minutes = Math.floor(ms / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${minutes}m ${seconds}s`;
    };

    const getRateLimitColor = () => {
        const percentage = (props.rateLimit.remaining / props.rateLimit.limit) * 100;
        if (percentage > 70) return 'success';
        if (percentage > 30) return 'warning';
        return 'danger';
    };

    onMount(() => {
        updateTimers();
        const interval = setInterval(updateTimers, 1000);
        onCleanup(() => clearInterval(interval));
    });

    if (props.compact) {
        return (
            <HStack 
                spacing="$2" 
                px="$3" 
                py="$2" 
                bg="white" 
                rounded="$lg" 
                shadow="sm"
                alignItems="center"
            >
                <Tooltip 
                    label={`Cache expires in: ${timeUntilRefresh()}\nLast updated: ${new Date(props.lastUpdate).toLocaleTimeString()}`}
                >
                    <HStack spacing="$2" alignItems="center">
                        <Box class="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <Text size="sm" color="$neutral11">{timeUntilRefresh()}</Text>
                    </HStack>
                </Tooltip>

                <Box w="1px" h="$4" bg="$neutral4" />

                <Tooltip 
                    label={`Rate limit resets in: ${timeUntilReset()}\nUsed: ${props.rateLimit.used} of ${props.rateLimit.limit}`}
                >
                    <Badge colorScheme={getRateLimitColor()}>
                        {props.rateLimit.remaining}/{props.rateLimit.limit}
                    </Badge>
                </Tooltip>

                {props.onRefresh && (
                    <Box
                        as="button"
                        color="$neutral9"
                        _hover={{ color: '$neutral11' }}
                        disabled={props.rateLimit.remaining === 0}
                        onClick={props.onRefresh}
                        opacity={props.rateLimit.remaining === 0 ? 0.5 : 1}
                    >
                        <FaSolidArrowsRotate class="w-4 h-4" />
                    </Box>
                )}
            </HStack>
        );
    }

    // Original full-size version
    return (
        <Card class="py-2 px-4">
            <HStack spacing="$4" alignItems="center" justifyContent="space-between">
                <HStack spacing="$2">
                    <Tooltip label={`Cache expires in: ${timeUntilRefresh()}\nLast updated: ${new Date(props.lastUpdate).toLocaleTimeString()}`}>
                        <Badge>🕒 {timeUntilRefresh()}</Badge>
                    </Tooltip>
                    <Tooltip label={`Rate limit resets in: ${timeUntilReset()}\nUsed: ${props.rateLimit.used} of ${props.rateLimit.limit}`}>
                        <Badge colorScheme={getRateLimitColor()}>
                            ⚡ {props.rateLimit.remaining}/{props.rateLimit.limit}
                        </Badge>
                    </Tooltip>
                </HStack>
                {props.onRefresh && (
                    <Box
                        as="button"
                        class="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={props.onRefresh}
                        disabled={props.rateLimit.remaining === 0}
                    >
                        <FaSolidArrowsRotate class="w-4 h-4" />
                    </Box>
                )}
            </HStack>
        </Card>
    );
};