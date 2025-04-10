import { Component } from 'solid-js';
import { FaSolidCircle, FaSolidClockRotateLeft, FaSolidCode, FaSolidLink, FaSolidCalendar } from 'solid-icons/fa';
import { Card } from '../UI/Card';
import { calculateDueStatus, getDueStatusColor } from '../../utils/dateUtils';
import type { GithubIssue } from '../../types/github';
import { Badge } from "@hope-ui/solid";

interface IssueDetailCardProps {
    issue: GithubIssue;
}

export const IssueDetailCard: Component<IssueDetailCardProps> = (props) => {
    const getStatusColor = () => {
        return props.issue.state === 'closed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
    };

    const getStatusIcon = () => {
        return props.issue.state === 'closed' ? FaSolidCircle : FaSolidClockRotateLeft;
    };

    const formatDate = (date: string | undefined) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDueDateBadge = () => {
        if (!props.issue.due_date) {
            return (
                <Badge colorScheme="neutral">
                    No Due Date
                </Badge>
            );
        }

        const status = calculateDueStatus(props.issue.due_date, props.issue.state);
        const color = getDueStatusColor(status);
        let text = '';

        switch(status) {
            case 'safe':
                text = 'On Track';
                break;
            case 'soon':
                text = 'Due Soon';
                break;
            case 'overdue':
                text = 'Overdue';
                break;
            default:
                text = 'No Date';
        }

        return (
            <Badge colorScheme={color}>
                {text}
            </Badge>
        );
    };

    const StatusIcon = getStatusIcon();

    return (
        <Card class="hover:shadow-lg transition-all duration-300 border border-gray-100">
            <div class="space-y-4">
                {/* Header */}
                <div class="flex items-start justify-between">
                    <div class="space-y-1">
                        <h3 class="text-lg font-semibold text-gray-900">
                            {props.issue.title}
                        </h3>
                        <div class="flex items-center space-x-2 text-sm text-gray-500">
                            <span class="flex items-center space-x-1">
                                <FaSolidCode class="w-4 h-4" />
                                <span>{props.issue.repository.name}</span>
                            </span>
                            <span>•</span>
                            <span>#{props.issue.number}</span>
                        </div>
                    </div>
                    <span class={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor()}`}>
                        <StatusIcon class="w-4 h-4" />
                        <span>{props.issue.state}</span>
                    </span>
                </div>

                {/* Date Information */}
                <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                    {props.issue.start_date && (
                        <div class="flex items-center space-x-2">
                            <FaSolidCalendar class="w-4 h-4 text-gray-400" />
                            <span>Start: {formatDate(props.issue.start_date)}</span>
                        </div>
                    )}
                    {props.issue.due_date && (
                        <div class="flex items-center space-x-2">
                            <FaSolidCalendar class="w-4 h-4 text-gray-400" />
                            <span>Due: {formatDate(props.issue.due_date)}</span>
                        </div>
                    )}
                    <div class="flex items-center space-x-2">
                        {getDueDateBadge()}
                    </div>
                </div>

                {/* Body content with tasks if present */}
                {props.issue.body && (
                    <div class="pl-4 border-l-4 border-gray-100">
                        <div class="prose prose-sm max-w-none text-gray-600">
                            {props.issue.body
                                .match(/- \[.\] .+/g)
                                ?.map((task) => (
                                    <div class="flex items-start space-x-2 mb-1">
                                        <input
                                            type="checkbox"
                                            checked={task.includes('- [x]')}
                                            disabled
                                            class="mt-1"
                                        />
                                        <span class="text-sm">
                                            {task.replace(/- \[.\] /, '')}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div class="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div class="flex items-center space-x-4">
                        {props.issue.assignee && (
                            <div class="flex items-center space-x-2">
                                <img
                                    src={props.issue.assignee.avatar_url}
                                    alt={props.issue.assignee.login}
                                    class="w-6 h-6 rounded-full"
                                />
                                <span class="text-sm text-gray-600">
                                    {props.issue.assignee.login}
                                </span>
                            </div>
                        )}
                    </div>
                    <a
                        href={`https://github.com/Smartelco/${props.issue.repository.name}/issues/${props.issue.number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                        <FaSolidLink class="w-4 h-4" />
                        <span class="text-sm">View on GitHub</span>
                    </a>
                </div>
            </div>
        </Card>
    );
};