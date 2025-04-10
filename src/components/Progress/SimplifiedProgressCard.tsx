import { Component, JSX } from 'solid-js';
import { Card } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import type { ProgressStats } from './progressUtils';
import ProgressIndicator from '../Charts/ProgressIndicator';
import { useNavigate } from '@solidjs/router';
import { 
    Text, 
    Box,
    Button
} from "@hope-ui/solid";
import { calculateDueStatus} from '../../utils/dateUtils';

interface RelationItem {
    label: string;
    href: string;
}

interface SimplifiedProgressCardProps {
    title: string;
    stats: ProgressStats;
    extraContent?: JSX.Element;
    collaborators?: Array<{
        name: string;
        avatar?: string;
    }>;
    relations?: {
        title: string;
        items: string[] | RelationItem[];
    }[];
    href?: string;
    cardType?: 'project' | 'repository' | 'member';
    projectNumber?: number;
    issues?: Array<{
        number: number;
        title: string;
        start_date?: string;
        due_date?: string;
        state: string;
    }>;
}

interface DueStats {
    safe: number;
    soon: number;
    overdue: number;
    none: number;
    total: number;
}

interface DueDateStatsProps {
    stats: DueStats;
}

const DueDateStats: Component<DueDateStatsProps> = (props) => {
    if (props.stats.total === 0) return null;

    return (
        <Box mt="$4" p="$4" bg="$neutral50" rounded="$lg">
            <Text size="sm" fontWeight="$medium" mb="$2" style={{'font-family': 'Figtree'}}>Due Date Overview</Text>

            {/* Progress bars */}
            <Box mt="$4">
                <div class="flex h-2 rounded-full overflow-hidden" style={{'font-family': 'Figtree'}}>
                    <div 
                        class="bg-green-500"
                        style={`width: ${(props.stats.safe / props.stats.total) * 100}%`}
                    />
                    <div 
                        class="bg-yellow-500"
                        style={`width: ${(props.stats.soon / props.stats.total) * 100}%`}
                    />
                    <div 
                        class="bg-red-500"
                        style={`width: ${(props.stats.overdue / props.stats.total) * 100}%`}
                    />
                    <div 
                        class="bg-gray-300"
                        style={`width: ${(props.stats.none / props.stats.total) * 100}%`}
                    />
                </div>
            </Box>

            {/* Legend */}
            <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <span style={{'font-family': 'Figtree'}}>Safe ({props.stats.safe})</span>
                </div>
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                    <span style={{'font-family': 'Figtree'}}>Due Soon ({props.stats.soon})</span>
                </div>
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <span style={{'font-family': 'Figtree'}}>Overdue ({props.stats.overdue})</span>
                </div>
                <div class="flex items-center">
                    <div class="w-3 h-3 rounded-full bg-gray-300 mr-2" />
                    <span style={{'font-family': 'Figtree'}}>No Due Date ({props.stats.none})</span>
                </div>
            </div>
        </Box>
    );
};

export const SimplifiedProgressCard: Component<SimplifiedProgressCardProps> = (props) => {
    const navigate = useNavigate();

    const calculateDueStats = (): DueStats => {
        if (!props.issues || props.issues.length === 0) {
            return { safe: 0, soon: 0, overdue: 0, none: 0, total: 0 };
        }
    
        return props.issues.reduce((acc, issue) => {
            // Teruskan state issue ke calculateDueStatus
            const status = calculateDueStatus(issue.due_date, issue.state);
            acc[status] = (acc[status] || 0) + 1;
            acc.total += 1;
            return acc;
        }, { safe: 0, soon: 0, overdue: 0, none: 0, total: 0 });
    };

    const handleViewDetails = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!props.cardType) return;

        let route = '';
        switch (props.cardType) {
            case 'project':
                if (props.projectNumber) {
                    route = `/project/${props.projectNumber}`;
                }
                break;
            case 'repository':
                route = `/repository/${props.title}`;
                break;
            case 'member':
                route = `/member/${props.title}`;
                break;
        }

        if (route) {
            navigate(route);
        }
    };

    return (
        <Card class="hover:shadow-lg transition-shadow flex flex-col">
            {/* Header */}
            <div class="flex justify-between items-start mb-4">
                <div class="flex items-center space-x-2">
                    <h3 class=" font-semibold text-gray-800" style={{'font-family': 'Figtree' , "font-size": "1rem"}}>
                        {props.title}
                    </h3>
                    {props.href && (
                        <a
                            href={props.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-500 hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                            </svg>
                        </a>
                    )}
                </div>
                <div class="flex -space-x-2">
                    {props.collaborators?.slice(0, 5).map(collab => (
                        <img
                            src={collab.avatar ?? 'https://github.com/ghost.png'}
                            alt={collab.name}
                            title={collab.name}
                            class="w-8 h-8 rounded-full border-2 border-white"
                        />
                    ))}
                    {(props.collaborators?.length ?? 0) > 5 && (
                        <div class="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                            +{props.collaborators!.length - 5}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Chart */}
            <div 
                class="space-y-1 mb-4" 
                style="position: relative; width: 100%; height: 160px; overflow: hidden;"
            >
                <ProgressIndicator 
                    progress={props.stats.issues.completed} 
                    total={props.stats.issues.total} 
                />
            </div>

            {/* Task Progress */}
            <div class="space-y-1 mb-4">
                <div class="flex justify-between text-sm">
                    <span class="text-gray-600" style={{'font-family': 'Figtree'}}>Overall Progress</span>
                    <div class="flex space-x-4">
                        <span class="text-green-600 font-bold" style={{'font-family': 'Figtree'}}>
                            Tasks: {props.stats.tasks.percentage.toFixed()}%
                        </span>
                    </div>
                </div>
                <div class="flex space-x-1">
                    <div class="flex-1">
                        <ProgressBar
                            percentage={props.stats.tasks.percentage}
                            class="bg-green-100"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                <div class="space-y-1">
                    <div class="flex justify-between">
                        <span class="text-gray-600" style={{'font-family': 'Figtree'}}>Issues</span>
                        <span class='font-bold' style={{'font-family': 'Figtree'}}>{props.stats.issues.completed}/{props.stats.issues.total}</span>
                    </div>
                    <div class="flex justify-between" style={{'font-family': 'Figtree'}}>
                        <span class="text-gray-600">Tasks</span>
                        <span class='font-bold' style={{'font-family': 'Figtree'}}>{props.stats.tasks.completed}/{props.stats.tasks.total}</span>
                    </div>
                </div>
                {props.extraContent}
            </div>

            {/* Due Date Stats */}
            {props.issues && props.issues.length > 0 && (
                <DueDateStats stats={calculateDueStats()} />
            )}

            {/* Relations */}
            {props.relations && props.relations.length > 0 && (
                <div class="space-y-2 mb-4 pt-4 border-t border-gray-100">
                    {props.relations.map(relation => (
                        <div>
                            <span class="text-sm text-gray-600" style={{'font-family': 'Figtree'}}>{relation.title}:</span>
                            <div class="flex flex-wrap gap-1 mt-1">
                                {relation.items.map(item => {
                                    if (typeof item === 'string') {
                                        return (
                                            <span class="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700" style={{'font-family': 'Figtree'}}>
                                                {item}
                                            </span>
                                        );
                                    }
                                    return (
                                        <a
                                            href={item.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            class="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 transition-colors"
                                            style={{'font-family': 'Figtree'}}>
                                            {item.label}
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Details Button */}
            <div class="mt-auto pt-4 border-t border-gray-100">
                <Button
                    class="w-full"
                    size="sm"
                    colorScheme="primary"
                    onClick={handleViewDetails} style={{'font-family': 'Figtree', 'font-weight': 'Bold', 'background':'linear-gradient(45deg, #2066ff, #002ba2)'}}
                >
                    View Details
                </Button>
            </div>
        </Card>
    );
};