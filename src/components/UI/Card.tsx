import { Component, JSX } from 'solid-js';
import { Box, BoxProps } from '@hope-ui/solid';

export type CardProps = typeof BoxProps & {
    children: JSX.Element;
    class?: string;
};

export const Card: Component<CardProps> = (props) => {
    const { children, class: className, ...rest } = props;
    return (
        <Box 
            bg="$white" 
            rounded="$lg" 
            shadow="$lg" 
            p="$6" 
            class={className} 
            {...rest}
        >
            {children}
        </Box>
    );
};
