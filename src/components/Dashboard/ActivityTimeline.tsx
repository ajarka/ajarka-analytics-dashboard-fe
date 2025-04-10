import { Component, For } from 'solid-js';
import { Card } from '../UI/Card';
import {
    VStack,
    HStack,
    Text,
    Box,
    Avatar,
    Tag
} from "@hope-ui/solid";
import { TimelineEvent, TimelineEventType } from '../../types/github';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { isBotOrSystem } from '../../services/github';

interface ActivityTimelineProps {
    events: TimelineEvent[];
}

export const ActivityTimeline: Component<ActivityTimelineProps> = (props) => {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getEventColor = (type: TimelineEventType) => {
        switch (type) {
            case 'commit':
                return 'purple';
            case 'issue_comment':
                return 'blue';
            case 'pr_comment':
                return 'green';
            default:
                return 'gray';
        }
    };

    const getEventIcon = (type: TimelineEventType) => {
        switch (type) {
            case 'commit':
                return '📦';
            case 'issue_comment':
                return '💬';
            case 'pr_comment':
                return '🔄';
            default:
                return '📝';
        }
    };

    // Function to convert markdown to HTML
    const markdownToHtml = (content: string) => {
        return marked.parse(content, {
            breaks: true,
            gfm: true,
            async: false // Memastikan return synchronous string
        });
    };

    // Function to create safe HTML
    const createSafeHtml = (content: string) => {
        const html = markdownToHtml(content);
        return DOMPurify.sanitize(html);
    };

    const filteredEvents = () => {
        return props.events.filter(event =>
            event.author &&
            !isBotOrSystem(event.author.login)
        );
    };

    return (
        <div class="w-full">
            <div class="space-y-4">
                <For each={filteredEvents()}>
                    {(event) => (
                        <div class="relative">
                            {/* Event Content */}
                            <div class="flex items-start space-x-3">
                                {/* Avatar */}
                                <Avatar
                                    src={event.author.avatar_url}
                                    name={event.author.login}
                                    class="w-8 h-8 rounded-full flex-shrink-0"
                                />

                                {/* Content */}
                                <div class="flex-1 min-w-0"> {/* min-w-0 untuk menangani text overflow */}
                                    {/* Header */}
                                    <div class="flex flex-wrap items-center gap-2 mb-1">
                                        <span class="font-bold text-gray-900 dark:text-gray-100 truncate" style={{"font-family": "Figtree"}}>
                                            {event.author.login}
                                        </span>
                                        <span class="
                                            px-2 py-1 
                                            text-xs font-medium 
                                            rounded-full
                                            bg-blue-100 dark:bg-blue-900/30
                                            text-blue-700 dark:text-blue-300
                                        ">
                                            {getEventIcon(event.type)} {event.type.replace('_', ' ')}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <div class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-4 mt-4 break-words" style={{"font-family": "Figtree"}}>
                                        {event.title}
                                    </div>

                                    {/* Content */}
                                    <div class="
                                        text-sm text-gray-600 dark:text-gray-400
                                        bg-gray-100 dark:bg-gray-900/50
                                        rounded-md p-2
                                        break-words
                                        overflow-hidden
                                        max-h-20
                                        hover:max-h-full
                                        transition-all duration-300
                                    " style={{"font-family": "Figtree"}}>
                                        <div
                                            innerHTML={createSafeHtml(event.content)}
                                            class="prose prose-sm max-w-none"
                                        />
                                    </div>

                                    {/* Footer */}
                                    <div class="
                                        mt-2
                                        flex flex-wrap items-center gap-3
                                        text-xs text-gray-500 dark:text-gray-400
                                    ">
                                        <span class="truncate" style={{"font-family": "Figtree" , "font-weight": "bold"}}>
                                            Repository: {event.repository}
                                        </span>
                                        <span >•</span>
                                        <span style={{"font-family": "Figtree" ,"color": "#936105"}} >{formatDate(event.timestamp)}</span>
                                        <a
                                            href={event.linkUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="
                                                text-blue-600 dark:text-blue-400
                                                hover:text-blue-800 dark:hover:text-blue-300
                                                transition-colors
                                                ml-auto
                                            " style={{"font-family": "Figtree"}}
                                        >
                                            View on GitHub →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </For>
            </div>
        </div>
    );
};