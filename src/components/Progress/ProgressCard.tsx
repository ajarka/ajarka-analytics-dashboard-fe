import { Component, JSX } from 'solid-js';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import type { ProgressStats } from './progressUtils';

interface ProgressCardProps {
    title: string;
    stats: ProgressStats;
    extraContent?: JSX.Element;
}

export const ProgressCard: Component<ProgressCardProps> = (props) => {
    return (
        <Card class="hover:shadow-lg transition-shadow">
            <div class="mb-4">
                <h3 class="text-lg font-semibold text-gray-800">
                    {props.title}
                </h3>
            </div>

            {/* Issue Progress */}
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Issue Progress</span>
                    <span class="font-medium">
                        {props.stats.issues.percentage.toFixed(1)}%
                    </span>
                </div>
                <ProgressBar percentage={props.stats.issues.percentage} />
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Completed Issues</span>
                    <span class="font-medium">
                        {props.stats.issues.completed}/{props.stats.issues.total}
                    </span>
                </div>
            </div>

            {/* Task Progress */}
            <div class="space-y-2 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Task Progress</span>
                    <span class="font-medium">
                        {props.stats.tasks.percentage.toFixed(1)}%
                    </span>
                </div>
                <ProgressBar percentage={props.stats.tasks.percentage} />
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Completed Tasks</span>
                    <span class="font-medium">
                        {props.stats.tasks.completed}/{props.stats.tasks.total}
                    </span>
                </div>
            </div>

            {props.extraContent}
        </Card>
    );
};