import { Component } from 'solid-js';

interface ProgressBarProps {
    percentage: number;
    class?: string;
}

export const ProgressBar: Component<ProgressBarProps> = (props) => {
    return (
        <div style={{'font-family': 'Figtree'}} class={`h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden transition-colors duration-200 ${props.class || ''}`}>
            <div 
                class="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-500"
                style={{ width: `${props.percentage}%`, 'font-family': 'Figtree' }}
            />
        </div>
    );
};