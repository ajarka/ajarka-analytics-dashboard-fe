import { GithubIssue } from "../../types/github";
import { createResource } from "solid-js";
import { Avatar, Box, HStack, Text, VStack, Badge } from "@hope-ui/solid";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { getAdditionalAssignees } from '../../utils/issueUtils';
import { FaSolidArrowUpRightFromSquare } from 'solid-icons/fa';

interface IssuePopoverContentProps {
    issue: GithubIssue;
    projectStatus?: string;
}

const parseMarkdown = async (markdown: string) => {
    const html = await marked(markdown, {
        gfm: true,
        breaks: true
    });
    return DOMPurify.sanitize(html);
};

// Fungsi untuk mendapatkan colorScheme badge berdasarkan status
const getStatusColor = (status: string): string => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    if (normalizedStatus.includes('backlog')) return 'neutral';
    if (normalizedStatus.includes('todo')) return 'warning';
    if (normalizedStatus.includes('progress')) return 'primary';
    if (normalizedStatus.includes('review')) return 'purple';
    if (normalizedStatus.includes('done') || normalizedStatus.includes('closed')) return 'success';
    
    return 'neutral'; // Default
};

const IssuePopoverContent = (props: IssuePopoverContentProps) => {
    const [parsedBody] = createResource(
        () => props.issue?.body ?? '',
        parseMarkdown
    );

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate tasks progress
    const getTaskProgress = () => {
        if (!props.issue?.body) return { completed: 0, total: 0 };
        const tasks = props.issue.body.match(/- \[.\] .+/g) || [];
        const completed = props.issue.body.match(/- \[x\] .+/g)?.length ?? 0;
        return {
            completed,
            total: tasks.length
        };
    };

    const allAssignees = () => {
        const additionalAssignees = getAdditionalAssignees(props.issue?.comments);
        const mainAssignee = props.issue?.assignee ? [{
            login: props.issue.assignee.login,
            avatar_url: props.issue.assignee.avatar_url,
            assigned_at: props.issue.created_at,
            assigned_by: 'GitHub',
            is_primary: true
        }] : [];

        return [...mainAssignee, ...additionalAssignees];
    };

    const taskProgress = getTaskProgress();

    return (
        <Box 
            p="$6" 
            w="100%"
            maxH="calc(78vh - 4rem)"
            overflow="auto"
            class="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        >
            {/* Header Section */}
            <VStack spacing="$4" alignItems="stretch">
                <HStack spacing="$4" justifyContent="space-between">
                    <HStack spacing="$2">
                        <Badge
                            size="lg"
                            colorScheme={props.issue?.state === 'closed' ? 'success' : 'warning'}
                            class="capitalize"
                        >
                            {props.issue?.state}
                        </Badge>
                        
                        {/* Tambahkan badge status project jika ada */}
                        {props.projectStatus && (
                            <Badge
                                size="lg"
                                colorScheme={getStatusColor(props.projectStatus)}
                                class="capitalize"
                            >
                                {props.projectStatus}
                            </Badge>
                        )}
                    </HStack>
                    <HStack spacing="$2" alignItems="center">
                        <Text color="$neutral11" size="sm">
                            #{props.issue?.number}
                        </Text>
                        <a
                            href={`https://github.com/Smartelco/${props.issue?.repository?.name}/issues/${props.issue?.number}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <FaSolidArrowUpRightFromSquare class="w-4 h-4" />
                        </a>
                    </HStack>
                </HStack>

                <Text
                    size="xl"
                    fontWeight="$bold"
                    class="text-gray-800 leading-tight"
                >
                    {props.issue?.title}
                </Text>

                {/* Repository & Assignee Info */}
                <HStack spacing="$6" class="flex-wrap">
                    <Box class="bg-gray-50 p-4 rounded-lg">
                    <Text size="sm" class="text-gray-500 mb-2">Repository</Text>
                        <HStack spacing="$2" class="min-w-[200px]">
                            <Box class="i-fa-solid-code-branch w-4 h-4 text-gray-500" />
                            <Text size="sm" class="text-gray-600">
                                {props.issue?.repository?.full_name}
                            </Text>
                        </HStack>
                    </Box>
                </HStack>

                <HStack spacing="$6" class="flex-wrap">
                    <Box class="bg-gray-50 p-4 rounded-lg">
                        <Text size="sm" class="text-gray-500 mb-2">Assignees</Text>
                        <VStack spacing="$2" alignItems="stretch">
                            {allAssignees().map((assignee) => (
                                <HStack spacing="$2" alignItems="center" class="bg-white p-2 rounded-md">
                                    <Avatar
                                        size="sm"
                                        src={assignee.avatar_url}
                                        name={assignee.login}
                                        class={`border-2 ${assignee.is_primary ? 'border-blue-500' : 'border-gray-200'} shadow-sm`}
                                    />
                                    <VStack spacing="$0" alignItems="flex-start" flex="1">
                                        <HStack spacing="$2" alignItems="center">
                                            <Text size="sm" class="text-gray-800">{assignee.login}</Text>
                                            {assignee.is_primary && (
                                                <Badge size="sm" colorScheme="primary">Primary</Badge>
                                            )}
                                        </HStack>
                                        <Text size="xs" class="text-gray-500">
                                            {assignee.is_primary
                                                ? `Assigned via GitHub on ${new Date(assignee.assigned_at).toLocaleDateString()}`
                                                : `Assigned by @${assignee.assigned_by} on ${new Date(assignee.assigned_at).toLocaleDateString()}`
                                            }
                                        </Text>
                                    </VStack>
                                </HStack>
                            ))}
                        </VStack>
                    </Box>
                </HStack>

                {/* Dates */}
                <Box class="bg-gray-50 p-4 rounded-lg">
                    <HStack spacing="$8" class="flex-wrap">
                        <VStack spacing="$1" alignItems="flex-start">
                            <Text size="sm" class="text-gray-500">Start Date</Text>
                            <Text fontWeight="$medium">
                                {formatDate(props.issue?.start_date)}
                            </Text>
                        </VStack>
                        <VStack spacing="$1" alignItems="flex-start">
                            <Text size="sm" class="text-gray-500">Due Date</Text>
                            <Text fontWeight="$medium">
                                {formatDate(props.issue?.due_date)}
                            </Text>
                        </VStack>
                        {taskProgress.total > 0 && (
                            <VStack spacing="$1" alignItems="flex-start">
                                <Text size="sm" class="text-gray-500">Tasks Progress</Text>
                                <Text fontWeight="$medium">
                                    {taskProgress.completed}/{taskProgress.total} completed
                                </Text>
                            </VStack>
                        )}
                    </HStack>
                </Box>

                {/* Description */}
                {props.issue?.body && (
                    <Box class="mt-4">
                        <Text size="sm" fontWeight="$medium" class="text-gray-700 mb-2">
                            Description
                        </Text>
                        <Box
                            class="prose prose-sm max-w-none bg-white p-4 rounded-lg border border-gray-100"
                            innerHTML={parsedBody()}
                        />
                    </Box>
                )}
            </VStack>
        </Box>
    );
};

export default IssuePopoverContent;