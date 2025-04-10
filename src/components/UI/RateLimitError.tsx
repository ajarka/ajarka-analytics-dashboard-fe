import { Component } from 'solid-js';
import { Card } from './Card';
import { VStack, Text, Button } from "@hope-ui/solid";

export const RateLimitError: Component<{ resetTime: string }> = (props) => {
    return (
        <Card class="max-w-lg mx-auto mt-8">
            <VStack spacing="$4" alignItems="center">
                <Text
                    size="xl"
                    fontWeight="$bold"
                    color="$danger600"
                >
                    API Rate Limit Exceeded
                </Text>

                <Text textAlign="center" color="$neutral600">
                    We've hit GitHub's API rate limit. The limit will reset at:
                    <br />
                    <span class="font-semibold">
                        {new Date(props.resetTime).toLocaleString()}
                    </span>
                </Text>

                <Button
                    colorScheme="primary"
                    onClick={() => window.location.reload()}
                >
                    Refresh Page
                </Button>
            </VStack>
        </Card>
    );
};