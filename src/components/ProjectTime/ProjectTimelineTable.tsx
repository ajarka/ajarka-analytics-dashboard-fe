import { Component, createMemo, For, createSignal, Show } from 'solid-js';
import { Badge, Box, Text, HStack, VStack, Tooltip, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Input, Button } from '@hope-ui/solid';
import { formatDistance, format, differenceInDays, isValid, parseISO } from 'date-fns';
import { GithubProject, GithubIssue } from '../../types/github';
import { FaSolidChevronDown, FaSolidChevronRight, FaSolidCode, FaSolidClock, FaSolidCircle, FaSolidExclamation, FaSolidLink,  FaSolidSort, FaSolidSortUp, FaSolidSortDown } from 'solid-icons/fa';
import { useGithubData } from '../../hooks/useGithubData';

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
    members: Array<{
        login: string;
        avatar_url: string;
        contributions: number;
        firstContribution: string;
        lastContribution: string;
        totalTimeSpent: string;
        activities: Array<{
            id: string;
            type: 'commit' | 'issue_comment' | 'pr_comment' | 'pull_request' | 'push';
            title: string;
            content: string;
            timestamp: string;
            linkUrl: string;
        }>;
    }>;
    recentActivities: Array<{
        id: string;
        type: 'commit' | 'issue_comment' | 'pr_comment' | 'pull_request' | 'push';
        title: string;
        content: string;
        author: {
            login: string;
            avatar_url: string;
        };
        timestamp: string;
        linkUrl: string;
    }>;
}

export const ProjectTimelineTable: Component<ProjectTimelineTableProps> = (props) => {
    const [expandedProjects, setExpandedProjects] = createSignal<Set<number>>(new Set());
    const [expandedRepo, setExpandedRepo] = createSignal<string | null>(null);
    const [selectedRepo] = createSignal<RepositoryTimeline | null>(null);
    const [isModalOpen, setIsModalOpen] = createSignal(false);
    
    // New state for search, sort, and pagination
    const [searchTerm, setSearchTerm] = createSignal('');
    const [projectStateFilter, setProjectStateFilter] = createSignal<'all' | 'open' | 'closed'>('open'); // Default to open projects
    const [sortConfig, setSortConfig] = createSignal<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [currentPage, setCurrentPage] = createSignal(1);
    const itemsPerPage = 10;

    // Get real-time data from useGithubData hook
    const { data: githubData } = useGithubData();

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
        
        // Get all timeline events for this repository from githubData
        const allTimelineEvents = githubData()?.timelineEvents || [];
        const repoEvents = allTimelineEvents.filter(event => 
            event.repository === repoName
        );

        // Get all members from the repository including contributors from commits, PRs, and issues
        const repoMembers = new Map<string, {
            login: string;
            avatar_url: string;
            contributions: number;
            firstContribution: string;
            lastContribution: string;
            totalTimeSpent: string;
            activities: Array<{
                id: string;
                type: 'commit' | 'issue_comment' | 'pr_comment' | 'pull_request' | 'push';
                title: string;
                content: string;
                timestamp: string;
                linkUrl: string;
            }>;
        }>();

        // First process all issue assignments and comments
        repoIssues.forEach(issue => {
            // Track issue assignee
            if (issue.assignee) {
                const member = repoMembers.get(issue.assignee.login) || {
                    login: issue.assignee.login,
                    avatar_url: issue.assignee.avatar_url,
                    contributions: 0,
                    firstContribution: issue.created_at,
                    lastContribution: issue.updated_at,
                    totalTimeSpent: '0',
                    activities: []
                };

                // Add issue assignment as an activity
                member.activities.push({
                    id: `issue-${issue.number}`,
                    type: 'issue_comment',
                    title: `Assigned to issue #${issue.number}`,
                    content: issue.title,
                    timestamp: issue.created_at,
                    linkUrl: issue.html_url
                });

                // Update first and last contribution dates
                if (new Date(issue.created_at) < new Date(member.firstContribution)) {
                    member.firstContribution = issue.created_at;
                }
                if (new Date(issue.updated_at) > new Date(member.lastContribution)) {
                    member.lastContribution = issue.updated_at;
                }

                member.contributions += 1; // Count assignment as a contribution
                repoMembers.set(issue.assignee.login, member);
            }

            // Track issue comments
            if (issue.comments) {
                issue.comments.forEach(comment => {
                    const member = repoMembers.get(comment.user.login) || {
                        login: comment.user.login,
                        avatar_url: comment.user.avatar_url,
                        contributions: 0,
                        firstContribution: comment.created_at,
                        lastContribution: comment.created_at,
                        totalTimeSpent: '0',
                        activities: []
                    };

                    // Add comment as an activity
                    member.activities.push({
                        id: `comment-${comment.id}`,
                        type: 'issue_comment',
                        title: `Commented on issue #${issue.number}`,
                        content: comment.body,
                        timestamp: comment.created_at,
                        linkUrl: comment.html_url
                    });

                    // Update first and last contribution dates
                    if (new Date(comment.created_at) < new Date(member.firstContribution)) {
                        member.firstContribution = comment.created_at;
                    }
                    if (new Date(comment.created_at) > new Date(member.lastContribution)) {
                        member.lastContribution = comment.created_at;
                    }

                    member.contributions += 0.5; // Comments count as 0.5 contribution
                    repoMembers.set(comment.user.login, member);
                });
            }
        });

        // Then process all timeline events
        repoEvents.forEach(event => {
            if (!event.author) return;

            const member = repoMembers.get(event.author.login) || {
                login: event.author.login,
                avatar_url: event.author.avatar_url,
                contributions: 0,
                firstContribution: event.timestamp,
                lastContribution: event.timestamp,
                totalTimeSpent: '0',
                activities: []
            };

            // Add activity with proper type
            member.activities.push({
                id: event.id,
                type: event.type,
                title: event.title,
                content: event.content,
                timestamp: event.timestamp,
                linkUrl: event.linkUrl
            });

            // Increment contributions based on event type
            switch (event.type) {
                case 'commit':
                    member.contributions += 1;
                    break;
                case 'pull_request':
                    member.contributions += 2;
                    break;
                case 'issue_comment':
                case 'pr_comment':
                    member.contributions += 0.5;
                    break;
                case 'push':
                    member.contributions += 1;
                    break;
                default:
                    member.contributions += 1;
            }

            // Update first and last contribution dates
            if (new Date(event.timestamp) < new Date(member.firstContribution)) {
                member.firstContribution = event.timestamp;
            }
            if (new Date(event.timestamp) > new Date(member.lastContribution)) {
                member.lastContribution = event.timestamp;
            }

            repoMembers.set(event.author.login, member);
        });

        // Sort activities by timestamp for each member
        repoMembers.forEach(member => {
            member.activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        });

        // Calculate total time spent for each member
        repoMembers.forEach(member => {
            const activityDates = member.activities.map(a => new Date(a.timestamp));
            const activitiesByDay = new Map<string, number>();
            
            activityDates.forEach(date => {
                const dayKey = date.toISOString().split('T')[0];
                activitiesByDay.set(dayKey, (activitiesByDay.get(dayKey) || 0) + 1);
            });

            let totalHours = 0;
            activitiesByDay.forEach((activityCount) => {
                totalHours += activityCount > 1 ? 8 : 4; // Full day if multiple activities, half day if single activity
            });

            const totalDays = Math.ceil(totalHours / 8);
            member.totalTimeSpent = `${totalDays} days`;
        });

        // Get recent activities for the repository
        const recentActivities = repoEvents
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map(event => ({
                id: event.id,
                type: event.type,
                title: event.title,
                content: event.content,
                author: {
                    login: event.author.login,
                    avatar_url: event.author.avatar_url
                },
                timestamp: event.timestamp,
                linkUrl: event.linkUrl
            }));

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
            isOverdue: plannedCompletionDate ? new Date() > plannedCompletionDate : false,
            members: Array.from(repoMembers.values()),
            recentActivities
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

    // Helper function to determine project state
    const getProjectState = (project: GithubProject): 'open' | 'closed' => {
        const projectIssues = props.issues.filter(issue =>
            project.issues.some(pi => 
                pi.number === issue.number && 
                pi.repository === issue.repository.name
            )
        );
        const hasOpenIssues = projectIssues.some(issue => issue.state === 'open');
        return hasOpenIssues ? 'open' : 'closed';
    };

    const projectTimelines = createMemo(() => 
        props.projects.map(project => ({
            ...project,
            timeline: getProjectTimeline(project),
            state: getProjectState(project)
        }))
    );

    const filteredAndSortedProjects = createMemo(() => {
        let filtered = projectTimelines();
        
        // Apply search filter
        if (searchTerm()) {
            const term = searchTerm().toLowerCase();
            filtered = filtered.filter(project => 
                project.name.toLowerCase().includes(term) ||
                project.body?.toLowerCase().includes(term)
            );
        }
        
        // Apply project state filter
        if (projectStateFilter() !== 'all') {
            filtered = filtered.filter(project => project.state === projectStateFilter());
        }
        
        // Apply sorting
        const { key, direction } = sortConfig();
        filtered = [...filtered].sort((a, b) => {
            if (key === 'name') {
                return direction === 'asc' 
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            }
            if (key === 'progress') {
                return direction === 'asc'
                    ? a.timeline.progress - b.timeline.progress
                    : b.timeline.progress - a.timeline.progress;
            }
            if (key === 'startDate') {
                const dateA = a.timeline.creationDate?.getTime() || 0;
                const dateB = b.timeline.creationDate?.getTime() || 0;
                return direction === 'asc' ? dateA - dateB : dateB - dateA;
            }
            return 0;
        });
        
        return filtered;
    });

    const paginatedProjects = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage;
        return filteredAndSortedProjects().slice(start, start + itemsPerPage);
    });

    const totalPages = createMemo(() => 
        Math.ceil(filteredAndSortedProjects().length / itemsPerPage)
    );

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = (props: { column: string }) => {
        const config = sortConfig();
        if (config.key !== props.column) return <FaSolidSort class="w-4 h-4 text-gray-400" />;
        return config.direction === 'asc' 
            ? <FaSolidSortUp class="w-4 h-4 text-blue-500" /> 
            : <FaSolidSortDown class="w-4 h-4 text-blue-500" />;
    };

    const getGithubUrl = (project: GithubProject, repoName?: string) => {
        // For project URL: https://github.com/orgs/ajarka/projects/7
        if (!repoName) {
            return `https://github.com/orgs/ajarka/projects/${project.number}`;
        }
        
        // For repository URL: https://github.com/ajarka/wfm-osp-fe
        return `https://github.com/ajarka/${repoName}`;
    };

    return (
        <Box class="w-full space-y-4">
            {/* Search and Filter Controls */}
            <div class="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div class="flex items-center gap-4 flex-1"> 
                    <Input
                        placeholder="Search projects..."
                        value={searchTerm()}
                        onInput={(e: Event) => setSearchTerm((e.target as HTMLInputElement).value)}
                        class="flex-1"
                    />
                    <select 
                        value={projectStateFilter()}
                        onChange={(e: Event) => setProjectStateFilter((e.target as HTMLSelectElement).value as 'all' | 'open' | 'closed')}
                        class="w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="open">Open Projects</option>
                        <option value="closed">Closed Projects</option>
                        <option value="all">All Projects</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <Box class="w-full overflow-x-auto" style={{'font-family': 'Figtree'}}>
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr class="bg-gradient-to-r from-blue-900/5 via-blue-900/10 to-purple-800/5 dark:from-blue-900/10 dark:via-blue-800/15 dark:to-purple-800/10">
                            <th class="w-8"></th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300 cursor-pointer" onClick={() => handleSort('name')}>
                                <div class="flex items-center gap-2">
                                    Project Name
                                    <SortIcon column="name" />
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300 cursor-pointer" onClick={() => handleSort('startDate')}>
                                <div class="flex items-center gap-2">
                                    Start Date
                                    <SortIcon column="startDate" />
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Planned End</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Actual End</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Planned Duration</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Actual Duration</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300 cursor-pointer" onClick={() => handleSort('progress')}>
                                <div class="flex items-center gap-2">
                                    Progress
                                    <SortIcon column="progress" />
                                </div>
                            </th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Issues</th>
                            <th class="px-4 py-3 text-left text-xs font-bold text-blue-900 dark:text-blue-300">Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={paginatedProjects()}>
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
                                        <td class="px-4 py-3">
                                            <a 
                                                href={getGithubUrl(project)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <FaSolidLink class="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="10" class="p-0">
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
                                                                <th class="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Link</th>
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
                                                                            <td class="px-4 py-2">
                                                                                <a 
                                                                                    href={getGithubUrl(project, repo.name)}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                                                                >
                                                                                    <FaSolidLink class="w-4 h-4" />
                                                                                </a>
                                                                            </td>
                                                                        </tr>
                                                                        <tr>
                                                                            <td colspan="9" class="p-0">
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

                                                                                        {/* Member Details Section */}
                                                                                        <div class="mt-6">
                                                                                            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Team Members</h4>
                                                                                            <div class="space-y-4">
                                                                                                <For each={repo.members}>
                                                                                                    {(member) => (
                                                                                                        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                                                                                                            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                                                                                                                <div class="flex items-center space-x-3">
                                                                                                                    <img 
                                                                                                                        src={member.avatar_url} 
                                                                                                                        alt={member.login}
                                                                                                                        class="w-10 h-10 rounded-full"
                                                                                                                    />
                                                                                                                    <div class="flex-1">
                                                                                                                        <div class="flex items-center justify-between">
                                                                                                                            <a 
                                                                                                                                href={`https://github.com/${member.login}`}
                                                                                                                                target="_blank"
                                                                                                                                rel="noopener noreferrer"
                                                                                                                                class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                                                                                                                            >
                                                                                                                                {member.login}
                                                                                                                                <FaSolidLink class="w-3 h-3" />
                                                                                                                            </a>
                                                                                                                            <Badge colorScheme="info">
                                                                                                                                {member.contributions} contributions
                                                                                                                            </Badge>
                                                                                                                        </div>
                                                                                                                        <div class="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                                                                                            <div class="flex items-center space-x-1">
                                                                                                                                <FaSolidClock class="w-3 h-3" />
                                                                                                                                <span>Joined: {format(new Date(member.firstContribution), 'MMM d, yyyy')}</span>
                                                                                                                            </div>
                                                                                                                            <div class="flex items-center space-x-1">
                                                                                                                                <FaSolidCircle class="w-3 h-3" />
                                                                                                                                <span>Last Active: {format(new Date(member.lastContribution), 'MMM d, yyyy')}</span>
                                                                                                                            </div>
                                                                                                                            <div class="flex items-center space-x-1">
                                                                                                                                <FaSolidCode class="w-3 h-3" />
                                                                                                                                <span>Time Spent: {member.totalTimeSpent}</span>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                            
                                                                                                            {/* Member Activities */}
                                                                                                            <div class="p-4">
                                                                                                                <h5 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Recent Activities</h5>
                                                                                                                <div class="space-y-2">
                                                                                                                    <For each={member.activities.slice(0, 3)}>
                                                                                                                        {(activity) => (
                                                                                                                            <div class="flex items-start space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                                                                                                <div class="flex-1">
                                                                                                                                    <a 
                                                                                                                                        href={activity.linkUrl}
                                                                                                                                        target="_blank"
                                                                                                                                        rel="noopener noreferrer"
                                                                                                                                        class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                                                                                                    >
                                                                                                                                        {activity.title}
                                                                                                                                        <FaSolidLink class="w-2.5 h-2.5" />
                                                                                                                                    </a>
                                                                                                                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                                                                                                        {activity.content}
                                                                                                                                    </p>
                                                                                                                                    <span class="text-xs text-gray-400 dark:text-gray-500">
                                                                                                                                        {format(new Date(activity.timestamp), 'MMM d, yyyy')}
                                                                                                                                    </span>
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        )}
                                                                                                                    </For>
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </For>
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
            </Box>

            {/* Pagination Controls */}
            <div class="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Showing {Math.min((currentPage() - 1) * itemsPerPage + 1, filteredAndSortedProjects().length)} to {Math.min(currentPage() * itemsPerPage, filteredAndSortedProjects().length)} of {filteredAndSortedProjects().length} projects
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage() === 1}
                    >
                        Previous
                    </Button>
                    <div class="flex items-center gap-2">
                        <For each={Array.from({ length: totalPages() }, (_, i) => i + 1)}>
                            {(page) => (
                                <Button
                                    variant={page === currentPage() ? "solid" : "ghost"}
                                    onClick={() => setCurrentPage(page)}
                                    class="w-8 h-8"
                                >
                                    {page}
                                </Button>
                            )}
                        </For>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages(), prev + 1))}
                        disabled={currentPage() === totalPages()}
                    >
                        Next
                    </Button>
                </div>
            </div>

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