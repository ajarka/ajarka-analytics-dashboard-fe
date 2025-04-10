import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { Card } from './Card';
import { Box, Text, VStack, HStack, Badge } from "@hope-ui/solid";

interface RateLimitData {
    limit: number;
    remaining: number;
    used: number;
    resetAt: string;
}

export const RateLimitIndicator: Component<{ data: RateLimitData }> = (props) => {
    const [timeUntilReset, setTimeUntilReset] = createSignal<string>('');

    const updateTimeUntilReset = () => {
        const resetTime = new Date(props.data.resetAt);
        const now = new Date();
        const diff = resetTime.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeUntilReset('Resetting...');
            return;
        }

        const minutes = Math.floor(diff / 1000 / 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeUntilReset(`${minutes}m ${seconds}s`);
    };

    onMount(() => {
        updateTimeUntilReset();
        const interval = setInterval(updateTimeUntilReset, 1000);
        onCleanup(() => clearInterval(interval));
    });

    const usagePercentage = (props.data.used / props.data.limit) * 100;
    const getStatusColor = () => {
        if (usagePercentage >= 90) return 'danger';
        if (usagePercentage >= 70) return 'warning';
        return 'success';
    };

    return (
        <Box
            position="fixed"
            bottom="$4"
            right="$4"
            zIndex="$banner"
        >
            <Card class="w-64">
                <VStack spacing="$2">
                    <HStack justifyContent="space-between" w="$full">
                        <Text size="sm" fontWeight="$medium">API Rate Limit</Text>
                        <Badge colorScheme={getStatusColor()}>
                            {props.data.remaining} / {props.data.limit}
                        </Badge>
                    </HStack>

                    {/* Progress Bar */}
                    <Box w="$full" h="$2" bg="$neutral200" rounded="$full" overflow="hidden">
                        <Box
                            w={`${usagePercentage}%`}
                            h="$full"
                            bg={`$${getStatusColor()}500`}
                            transition="width 0.3s ease"
                        />
                    </Box>

                    <Text size="xs" color="$neutral600" textAlign="center">
                        Resets in: {timeUntilReset()}
                    </Text>
                </VStack>
            </Card>
        </Box>
    );
};