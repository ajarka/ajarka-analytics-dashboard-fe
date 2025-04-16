import { Component, createMemo, For, createSignal, Show } from 'solid-js';
import { Badge, Box, Text, HStack, VStack, Tooltip, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton } from '@hope-ui/solid';
import { formatDistance, format, differenceInDays, isValid, parseISO, isDate } from 'date-fns';
import { GithubProject, GithubIssue } from '../types/github';
import { FaSolidChevronDown, FaSolidChevronRight, FaSolidCode, FaSolidClock, FaSolidCircle, FaSolidExclamation } from 'solid-icons/fa';

interface ProjectTimelineTableProps {
    projects: GithubProject[];
    issues: GithubIssue[];
}

interface RepositoryTimeline {
    name: string;
    creationDate: Date | null;
    plannedCompletionDate: Date | null;
    actualCompletionDate: Date | null;
    plannedDuration: string;
    actualDuration: string;
    totalIssues: number;
    completedIssues: number;
    inProgressIssues: number;
    progress: number;
    isOverdue: boolean;
}

export const ProjectTimelineTable: Component<ProjectTimelineTableProps> = (props) => {
    const [expandedProjects, setExpandedProjects] = createSignal<Set<number>>(new Set());
    const [expandedRepo, setExpandedRepo] = createSignal<string | null>(null);
    const [selectedRepo, setSelectedRepo] = createSignal<RepositoryTimeline | null>(null);
    const [isModalOpen, setIsModalOpen] = createSignal(false);

    const toggleProject = (projectId: number) => {
        const current = new Set(expandedProjects());
        if (current.has(projectId)) {
            current.delete(projectId);
            setExpandedRepo(null);
        } else {
            current.add(projectId);
        }
        setExpandedProjects(current);
    };

    const toggleRepo = (repoName: string) => {
        setExpandedRepo(expandedRepo() === repoName ? null : repoName);
    };

    const getRepositoryTimeline = (repoName: string, projectIssues: GithubIssue[]): RepositoryTimeline => {
        const repoIssues = projectIssues.filter(issue => issue.repository.name === repoName);
        
        const safeParseDate = (dateStr: string | null | undefined): Date | null => {
            if (!dateStr) return null;
            try {
                const date = parseISO(dateStr);
                return isValid(date) ? date : null;
            } catch (e) {
                return null;
            }
        };

        const safeMinDate = (dates: (Date | null)[]): Date | null => {
            const validDates = dates.filter((date): date is Date => date !== null && isValid(date));
            return validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null;
        };

        const safeMaxDate = (dates: (Date | null)[]): Date | null => {
            const validDates = dates.filter((date): date is Date => date !== null && isValid(date));
            return validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null;
        };

        const creationDates = repoIssues.map(i => safeParseDate(i.created_at));
        const creationDate = safeMinDate(creationDates);

        const plannedDates = repoIssues.map(i => safeParseDate(i.due_date));
        const plannedCompletionDate = safeMaxDate(plannedDates);

        const closedDates = repoIssues
            .filter(i => i.state === 'closed')
            .map(i => safeParseDate(i.updated_at));
        const actualCompletionDate = safeMaxDate(closedDates);

        const safeFormatDistance = (start: Date | null, end: Date | null): string => {
            if (!start || !end || !isValid(start) || !isValid(end)) return 'N/A';
            try {
                return formatDistance(end, start);
            } catch (e) {
                return 'N/A';
            }
        };

        const safeDifferenceInDays = (date1: Date | null, date2: Date | null): number => {
            if (!date1 || !date2 || !isValid(date1) || !isValid(date2)) return 0;
            try {
                return differenceInDays(date2, date1);
            } catch (e) {
                return 0;
            }
        };

        const plannedDuration = safeFormatDistance(creationDate, plannedCompletionDate);
        const actualDuration = safeFormatDistance(creationDate, actualCompletionDate);

        const totalIssues = repoIssues.length;
        const completedIssues = repoIssues.filter(i => i.state === 'closed').length;
        const inProgressIssues = repoIssues.filter(i => i.state === 'open').length;
        
        const issueProgress = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
        
        const timeProgress = creationDate && plannedCompletionDate
            ? Math.min(100, (safeDifferenceInDays(creationDate, new Date()) / 
                           safeDifferenceInDays(creationDate, plannedCompletionDate)) * 100)
            : 0;

        const progress = (issueProgress * 0.7) + (timeProgress * 0.3);

        return {
            name: repoName,
            creationDate,
            plannedCompletionDate,
            actualCompletionDate,
            plannedDuration,
            actualDuration,
            totalIssues,
            completedIssues,
            inProgressIssues,
            progress,
            isOverdue: plannedCompletionDate ? new Date() > plannedCompletionDate : false
        };
    };

    const getProjectTimeline = (project: GithubProject) => {
        const projectIssues = props.issues.filter(issue =>
            project.issues.some(pi => 
                pi.number === issue.number && 
                pi.repository === issue.repository.name
            )
        );

        // Get unique repositories
        const repositories = Array.from(new Set(projectIssues.map(i => i.repository.name)));

        // Calculate repository timelines
        const repoTimelines = repositories.map(repoName => 
            getRepositoryTimeline(repoName, projectIssues)
        );

        // Calculate project timeline based on repository timelines
        const safeMinDate = (dates: (Date | null)[]): Date | null => {
            const validDates = dates.filter((date): date is Date => date !== null && isValid(date));
            return validDates.length > 0 ? new Date(Math.min(...validDates.map(d => d.getTime()))) : null;
        };

        const safeMaxDate = (dates: (Date | null)[]): Date | null => {
            const validDates = dates.filter((date): date is Date => date !== null && isValid(date));
            return validDates.length > 0 ? new Date(Math.max(...validDates.map(d => d.getTime()))) : null;
        };

        const creationDate = safeMinDate(repoTimelines.map(r => r.creationDate));
        const plannedCompletionDate = safeMaxDate(repoTimelines.map(r => r.plannedCompletionDate));
        const actualCompletionDate = safeMaxDate(repoTimelines.map(r => r.actualCompletionDate));

        const safeFormatDistance = (start: Date | null, end: Date | null): string => {
            if (!start || !end || !isValid(start) || !isValid(end)) return 'N/A';
            try {
                return formatDistance(end, start);
            } catch (e) {
                return 'N/A';
            }
        };

        const safeDifferenceInDays = (date1: Date | null, date2: Date | null): number => {
            if (!date1 || !date2 || !isValid(date1) || !isValid(date2)) return 0;
            try {
                return differenceInDays(date2, date1);
            } catch (e) {
                return 0;
            }
        };

        const plannedDuration = safeFormatDistance(creationDate, plannedCompletionDate);
        const actualDuration = safeFormatDistance(creationDate, actualCompletionDate);

        const totalIssues = projectIssues.length;
        const completedIssues = projectIssues.filter(i => i.state === 'closed').length;
        const inProgressIssues = projectIssues.filter(i => i.state === 'open').length;
        
        const issueProgress = totalIssues > 0 ? (completedIssues / totalIssues) * 100 : 0;
        
        const timeProgress = creationDate && plannedCompletionDate
            ? Math.min(100, (safeDifferenceInDays(creationDate, new Date()) / 
                           safeDifferenceInDays(creationDate, plannedCompletionDate)) * 100)
            : 0;

        const progress = (issueProgress * 0.7) + (timeProgress * 0.3);

        return {
            creationDate,
            plannedCompletionDate,
            actualCompletionDate,
            plannedDuration,
            actualDuration,
            totalIssues,
            completedIssues,
            inProgressIssues,
            progress,
            isOverdue: plannedCompletionDate ? new Date() > plannedCompletionDate : false,
            repositories: repoTimelines
        };
    };

    const projectTimelines = createMemo(() => 
        props.projects.map(project => ({
            ...project,
            timeline: getProjectTimeline(project)
        }))
    );

    const openRepoDetails = (repo: RepositoryTimeline) => {
        setSelectedRepo(repo);
        setIsModalOpen(true);
    };

    return (
        <Box class="w-full overflow-x-auto" style={{'font-family': 'Figtree'}}>
            <table class="w-full border-collapse text-sm">
                <thead>
                    <tr class="bg-gradient-to-r from-blue-900/5 via-blue-900/10 to-purple-800/5 dark:from-blue-900/10 dark:via-blue-800/15 dark:to-purple-800/10">
                        <th class="w-8"></th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Project Name</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Start Date</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Planned End</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Actual End</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Planned Duration</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Actual Duration</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Progress</th>
                        <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Issues</th>
                    </tr>
                </thead>
                <tbody>
                    <For each={projectTimelines()}>
                        {(project) => (
                            <>
                                <tr 
                                    class="
                                        border-b border-blue-900/10 dark:border-blue-300/10
                                        hover:bg-blue-50/30 dark:hover:bg-blue-900/10
                                        transition-colors duration-200
                                        cursor-pointer
                                    "
                                    onClick={() => toggleProject(project.id)}
                                >
                                    <td class="px-2">
                                        {expandedProjects().has(project.id) ? (
                                            <FaSolidChevronDown class="w-4 h-4 text-blue-900 dark:text-blue-300" />
                                        ) : (
                                            <FaSolidChevronRight class="w-4 h-4 text-blue-900 dark:text-blue-300" />
                                        )}
                                    </td>
                                    <td class="px-4 py-3">
                                        <VStack alignItems="start" spacing="1">
                                            <Text fontWeight="bold" class="text-blue-900 dark:text-blue-300">
                                                {project.name}
                                            </Text>
                                            <Text size="sm" class="text-gray-600 dark:text-gray-400">
                                                {project.body || 'No description'}
                                            </Text>
                                        </VStack>
                                    </td>
                                    <td class="px-4 py-3">
                                        {project.timeline.creationDate 
                                            ? format(project.timeline.creationDate, 'MMM d, yyyy')
                                            : 'N/A'}
                                    </td>
                                    <td class="px-4 py-3">
                                        {project.timeline.plannedCompletionDate
                                            ? format(project.timeline.plannedCompletionDate, 'MMM d, yyyy')
                                            : 'N/A'}
                                    </td>
                                    <td class="px-4 py-3">
                                        {project.timeline.actualCompletionDate
                                            ? format(project.timeline.actualCompletionDate, 'MMM d, yyyy')
                                            : 'In Progress'}
                                    </td>
                                    <td class="px-4 py-3">{project.timeline.plannedDuration}</td>
                                    <td class="px-4 py-3">{project.timeline.actualDuration}</td>
                                    <td class="px-4 py-3">
                                        <Tooltip label={`${project.timeline.progress.toFixed(1)}%`}>
                                            <Box>
                                                <Badge
                                                    colorScheme={
                                                        project.timeline.progress === 100
                                                            ? 'success'
                                                            : project.timeline.isOverdue
                                                            ? 'danger'
                                                            : project.timeline.progress > 50
                                                            ? 'info'
                                                            : 'warning'
                                                    }
                                                >
                                                    {project.timeline.progress.toFixed(1)}%
                                                </Badge>
                                            </Box>
                                        </Tooltip>
                                    </td>
                                    <td class="px-4 py-3">
                                        <HStack spacing="2">
                                            <Badge colorScheme="neutral">
                                                {project.timeline.completedIssues}/{project.timeline.totalIssues}
                                            </Badge>
                                            {project.timeline.inProgressIssues > 0 && (
                                                <Badge colorScheme="info">
                                                    {project.timeline.inProgressIssues} in progress
                                                </Badge>
                                            )}
                                        </HStack>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="9" class="p-0">
                                        <Show when={expandedProjects().has(project.id)}>
                                            <div class="bg-gray-50 dark:bg-gray-800/50 p-4">
                                                <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                                                    Repository Details
                                                </h3>
                                                <table class="w-full border-collapse text-xs">
                                                    <thead>
                                                        <tr class="bg-gray-100 dark:bg-gray-700/50">
                                                            <th class="w-8"></th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Repository</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Start Date</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Planned End</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Actual End</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Duration</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Progress</th>
                                                            <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Issues</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <For each={project.timeline.repositories}>
                                                            {(repo) => (
                                                                <>
                                                                    <tr 
                                                                        class="
                                                                            border-t border-gray-200 dark:border-gray-700
                                                                            hover:bg-blue-50/20 dark:hover:bg-blue-900/20
                                                                            transition-colors duration-200
                                                                            cursor-pointer
                                                                        "
                                                                        onClick={() => toggleRepo(repo.name)}
                                                                    >
                                                                        <td class="px-2">
                                                                            {expandedRepo() === repo.name ? (
                                                                                <FaSolidChevronDown class="w-4 h-4 text-blue-900 dark:text-blue-300" />
                                                                            ) : (
                                                                                <FaSolidChevronRight class="w-4 h-4 text-blue-900 dark:text-blue-300" />
                                                                            )}
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            <Text class="text-blue-900 dark:text-blue-300">
                                                                                {repo.name}
                                                                            </Text>
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            {repo.creationDate 
                                                                                ? format(repo.creationDate, 'MMM d, yyyy')
                                                                                : 'N/A'}
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            {repo.plannedCompletionDate
                                                                                ? format(repo.plannedCompletionDate, 'MMM d, yyyy')
                                                                                : 'N/A'}
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            {repo.actualCompletionDate
                                                                                ? format(repo.actualCompletionDate, 'MMM d, yyyy')
                                                                                : 'In Progress'}
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            <VStack spacing="1" alignItems="start">
                                                                                <Text size="sm" class="text-gray-600 dark:text-gray-400">
                                                                                    Planned: {repo.plannedDuration}
                                                                                </Text>
                                                                                <Text size="sm" class="text-gray-600 dark:text-gray-400">
                                                                                    Actual: {repo.actualDuration}
                                                                                </Text>
                                                                            </VStack>
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            <Tooltip label={`${repo.progress.toFixed(1)}%`}>
                                                                                <Box>
                                                                                    <Badge
                                                                                        colorScheme={
                                                                                            repo.progress === 100
                                                                                                ? 'success'
                                                                                                : repo.isOverdue
                                                                                                ? 'danger'
                                                                                                : repo.progress > 50
                                                                                                ? 'info'
                                                                                                : 'warning'
                                                                                        }
                                                                                    >
                                                                                        {repo.progress.toFixed(1)}%
                                                                                    </Badge>
                                                                                </Box>
                                                                            </Tooltip>
                                                                        </td>
                                                                        <td class="px-4 py-2">
                                                                            <HStack spacing="2">
                                                                                <Badge colorScheme="neutral">
                                                                                    {repo.completedIssues}/{repo.totalIssues}
                                                                                </Badge>
                                                                                {repo.inProgressIssues > 0 && (
                                                                                    <Badge colorScheme="info">
                                                                                        {repo.inProgressIssues} in progress
                                                                                    </Badge>
                                                                                )}
                                                                            </HStack>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td colspan="8" class="p-0">
                                                                            <Show when={expandedRepo() === repo.name}>
                                                                                <div class="bg-gray-100 dark:bg-gray-700/30 p-4">
                                                                                    <div class="grid grid-cols-2 gap-4">
                                                                                        <div class="space-y-3">
                                                                                            <div class="flex items-center space-x-2">
                                                                                                <FaSolidClock class="w-4 h-4 text-blue-500" />
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">
                                                                                                    Start: {repo.creationDate ? format(repo.creationDate, 'MMM d, yyyy') : 'N/A'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div class="flex items-center space-x-2">
                                                                                                <FaSolidCircle class="w-4 h-4 text-green-500" />
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">
                                                                                                    Planned End: {repo.plannedCompletionDate ? format(repo.plannedCompletionDate, 'MMM d, yyyy') : 'N/A'}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div class="flex items-center space-x-2">
                                                                                                <FaSolidExclamation class="w-4 h-4 text-purple-500" />
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">
                                                                                                    Actual End: {repo.actualCompletionDate ? format(repo.actualCompletionDate, 'MMM d, yyyy') : 'In Progress'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div class="space-y-3">
                                                                                            <div class="flex items-center justify-between">
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">Total Issues:</span>
                                                                                                <span class="text-xs font-medium text-gray-900 dark:text-white">
                                                                                                    {repo.totalIssues}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div class="flex items-center justify-between">
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">Completed:</span>
                                                                                                <span class="text-xs font-medium text-gray-900 dark:text-white">
                                                                                                    {repo.completedIssues}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div class="flex items-center justify-between">
                                                                                                <span class="text-xs text-gray-600 dark:text-gray-400">In Progress:</span>
                                                                                                <span class="text-xs font-medium text-gray-900 dark:text-white">
                                                                                                    {repo.inProgressIssues}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div class="mt-4">
                                                                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                                            <div 
                                                                                                class="h-2 rounded-full transition-all duration-500"
                                                                                                classList={{
                                                                                                    'bg-green-500': repo.progress === 100,
                                                                                                    'bg-red-500': repo.isOverdue,
                                                                                                    'bg-blue-500': repo.progress > 50 && !repo.isOverdue,
                                                                                                    'bg-yellow-500': repo.progress <= 50 && !repo.isOverdue
                                                                                                }}
                                                                                                style={{
                                                                                                    width: `${repo.progress}%`
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </Show>
                                                                        </td>
                                                                    </tr>
                                                                </>
                                                            )}
                                                        </For>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Show>
                                    </td>
                                </tr>
                            </>
                        )}
                    </For>
                </tbody>
            </table>

            <Modal opened={isModalOpen()} onClose={() => setIsModalOpen(false)} size="xl">
                <ModalOverlay />
                <ModalContent class="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                    <ModalHeader class="border-b border-gray-200 dark:border-gray-700 p-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <FaSolidCode class="w-5 h-5 text-blue-500" />
                                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedRepo()?.name}
                                </h2>
                            </div>
                            <ModalCloseButton />
                        </div>
                    </ModalHeader>
                    <ModalBody class="p-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timeline</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center space-x-2">
                                            <FaSolidClock class="w-4 h-4 text-blue-500" />
                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                Start: {selectedRepo()?.creationDate ? format(selectedRepo()?.creationDate!, 'MMM d, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <FaSolidCircle class="w-4 h-4 text-green-500" />
                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                Planned End: {selectedRepo()?.plannedCompletionDate ? format(selectedRepo()?.plannedCompletionDate!, 'MMM d, yyyy') : 'N/A'}
                                            </span>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <FaSolidExclamation class="w-4 h-4 text-purple-500" />
                                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                                Actual End: {selectedRepo()?.actualCompletionDate ? format(selectedRepo()?.actualCompletionDate!, 'MMM d, yyyy') : 'In Progress'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Duration</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">Planned:</span>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedRepo()?.plannedDuration}
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">Actual:</span>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedRepo()?.actualDuration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Progress</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">Overall Progress:</span>
                                            <Badge
                                                colorScheme={
                                                    selectedRepo()?.progress === 100
                                                        ? 'success'
                                                        : selectedRepo()?.isOverdue
                                                        ? 'danger'
                                                        : selectedRepo()?.progress! > 50
                                                        ? 'info'
                                                        : 'warning'
                                                }
                                            >
                                                {selectedRepo()?.progress.toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div 
                                                class="h-2 rounded-full transition-all duration-500"
                                                classList={{
                                                    'bg-green-500': selectedRepo()?.progress === 100,
                                                    'bg-red-500': selectedRepo()?.isOverdue,
                                                    'bg-blue-500': selectedRepo()?.progress! > 50 && !selectedRepo()?.isOverdue,
                                                    'bg-yellow-500': selectedRepo()?.progress! <= 50 && !selectedRepo()?.isOverdue
                                                }}
                                                style={{
                                                    width: `${selectedRepo()?.progress}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Issues</h3>
                                    <div class="space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">Total Issues:</span>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedRepo()?.totalIssues}
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">Completed:</span>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedRepo()?.completedIssues}
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-sm text-gray-600 dark:text-gray-400">In Progress:</span>
                                            <span class="text-sm font-medium text-gray-900 dark:text-white">
                                                {selectedRepo()?.inProgressIssues}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
}; 