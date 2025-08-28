import { Component, For, createSignal, createMemo } from 'solid-js';
import type { GithubProject, GithubIssue, GithubPullRequest } from '../../types/github';
import { calculateProgressStats } from './progressUtils';
import { SimplifiedProgressCard } from './SimplifiedProgressCard';
import { FilterSort } from '../Common/FilterSort';
import { useRateLimit } from '../../../src/context/RateLimitContext';
import { Card } from '../UI/Card';
import { VStack, Text } from '@hope-ui/solid';

interface ProjectProgressProps {
    projects: GithubProject[];
    issues: GithubIssue[];
    pullRequests: GithubPullRequest[];
    members: any[];
    repositories: any[];
}

export const ProjectProgress: Component<ProjectProgressProps> = (props) => {
    const [memberFilter, setMemberFilter] = createSignal<string[]>([]);
    const [repoFilter, setRepoFilter] = createSignal<string[]>([]);
    const [projectStateFilter, setProjectStateFilter] = createSignal<string[]>(['open']); // Default to open projects
    const [sortBy, setSortBy] = createSignal('progress');
    const [searchQuery, setSearchQuery] = createSignal('');
    const { isRateLimited, rateLimitData } = useRateLimit();

    const getFilterOptions = () => {
        const memberSet = new Set<string>();
        const repoSet = new Set<string>();

        props.projects.forEach(project => {
            project.issues.forEach(issue => {
                repoSet.add(issue.repository);
            });
        });

        props.issues.forEach(issue => {
            if (issue.assignee) {
                memberSet.add(issue.assignee.login);
            }
        });

        return {
            members: Array.from(memberSet),
            repositories: Array.from(repoSet),
        };
    };

    // Helper functions to reduce nesting
    const matchesSearchQuery = (project: GithubProject, query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return project.name.toLowerCase().includes(lowercaseQuery) ||
               project.body?.toLowerCase().includes(lowercaseQuery);
    };

    const getProjectIssues = (project: GithubProject, allIssues: GithubIssue[]) => {
        return allIssues.filter(issue =>
            project.issues.some(pi => 
                pi.number === issue.number && 
                pi.repository === issue.repository.name
            )
        );
    };

    const hasAssignedMember = (issues: GithubIssue[], memberList: string[]) => {
        return issues.some(issue => 
            issue.assignee && memberList.includes(issue.assignee.login)
        );
    };

    const hasMatchingRepository = (project: GithubProject, repoList: string[]) => {
        return project.issues.some(issue => repoList.includes(issue.repository));
    };

    const getProjectState = (project: GithubProject, allIssues: GithubIssue[]): 'open' | 'closed' => {
        const projectIssues = getProjectIssues(project, allIssues);
        const hasOpenIssues = projectIssues.some(issue => issue.state === 'open');
        return hasOpenIssues ? 'open' : 'closed';
    };

    const compareByProgress = (a: GithubProject, b: GithubProject, allIssues: GithubIssue[]) => {
        const progressA = calculateProgressStats(getProjectIssues(a, allIssues));
        const progressB = calculateProgressStats(getProjectIssues(b, allIssues));
        return progressB.issues.percentage - progressA.issues.percentage;
    };

    const filteredProjects = createMemo(() => {
        let filtered = [...props.projects];

        // Apply search filter
        if (searchQuery()) {
            filtered = filtered.filter(project => matchesSearchQuery(project, searchQuery()));
        }

        // Apply member filter
        if (memberFilter().length > 0) {
            filtered = filtered.filter(project => {
                const projectIssues = getProjectIssues(project, props.issues);
                return hasAssignedMember(projectIssues, memberFilter());
            });
        }

        // Apply repository filter
        if (repoFilter().length > 0) {
            filtered = filtered.filter(project => hasMatchingRepository(project, repoFilter()));
        }

        // Apply project state filter
        if (projectStateFilter().length > 0) {
            filtered = filtered.filter(project => {
                const state = getProjectState(project, props.issues);
                return projectStateFilter().includes(state);
            });
        }

        // Apply sorting
        switch (sortBy()) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'issues':
                filtered.sort((a, b) => b.issues.length - a.issues.length);
                break;
            case 'progress':
                filtered.sort((a, b) => compareByProgress(a, b, props.issues));
                break;
        }

        return filtered;
    });

    const filterOptions = getFilterOptions();

    const getProjectMetadata = (project: GithubProject) => {
        // Get issues for this project
        const projectIssues = props.issues.filter(issue =>
            project.issues.some(projectIssue =>
                projectIssue.number === issue.number &&
                projectIssue.repository === issue.repository.name
            )
        );

        // console.log("Project PR Original: ", props.pullRequests);

        // Get pull requests for this project
        const projectPRs = props.pullRequests.filter(pr =>
            project.issues.some(pi => pi.repository === pr.repository.name)
        );

        // console.log("Project PR: ", projectPRs);

        const openPRs = projectPRs.filter(pr => !pr.merged_at && pr.state === 'open');

        // Get unique assignees with no redundancy
        const memberMap = new Map();
        projectIssues.forEach(issue => {
            if (issue.assignee) {
                memberMap.set(issue.assignee.login, {
                    name: issue.assignee.login,
                    avatar: issue.assignee.avatar_url
                });
            }
        });
        const members = Array.from(memberMap.values());

        // Get unique repositories
        const repositories = Array.from(new Set(
            projectIssues.map(issue => issue.repository.name)
        ));

        return {
            issues: projectIssues,
            repositories,
            members,
            pullRequests: projectPRs,
            openPRCount: openPRs.length
        };
    };

    if (isRateLimited()) {
        return (
            <Card>
                <VStack spacing="$4" alignItems="center" p="$6">
                    <Text size="xl" fontWeight="$bold" color="$danger600">
                        Projects Data Temporarily Unavailable
                    </Text>
                    <Text textAlign="center" color="$neutral600">
                        Project details including start dates and due dates are currently unavailable
                        due to <a class='underline text-blue-600' target="_blank" rel="noopener" href="https://docs.github.com/en/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api">GitHub's API rate limit</a>. The limit will reset at:
                        <br />
                        <span class="font-semibold">
                            {rateLimitData() && new Date(rateLimitData().resetAt).toLocaleString()}
                        </span>
                    </Text>
                </VStack>
            </Card>
        );
    }

    const getTotalComments = (issues: GithubIssue[]) => {
        return issues.reduce((total: number, issue) => {
            return total + (issue.comments?.length ?? 0);
        }, 0);
    };


    return (
        <>
            <FilterSort
                filters={[
                    {
                        name: 'Project Status',
                        options: [
                            { label: 'Open Projects', value: 'open' },
                            { label: 'Closed Projects', value: 'closed' }
                        ],
                        selectedValues: projectStateFilter(),
                        onFilterChange: setProjectStateFilter
                    },
                    {
                        name: 'Members',
                        options: filterOptions.members.map(member => ({
                            label: member,
                            value: member
                        })),
                        selectedValues: memberFilter(),
                        onFilterChange: setMemberFilter
                    },
                    {
                        name: 'Repositories',
                        options: filterOptions.repositories.map(repo => ({
                            label: repo,
                            value: repo
                        })),
                        selectedValues: repoFilter(),
                        onFilterChange: setRepoFilter
                    }
                ]}
                sorts={[
                    { label: 'Name', value: 'name' },
                    { label: 'Number of Issues', value: 'issues' },
                    { label: 'Progress', value: 'progress' }
                ]}
                currentSort={sortBy()}
                onSortChange={setSortBy}
                searchValue={searchQuery()}
                onSearchChange={setSearchQuery}
            />

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <For each={filteredProjects()}>
                    {(project) => {
                        const projectIssues = props.issues.filter(issue =>
                            project.issues.some(pi => pi.number === issue.number && pi.repository === issue.repository.name)
                        );
                        const metadata = getProjectMetadata(project);
                        const progress = calculateProgressStats(projectIssues);

                        return (
                            <SimplifiedProgressCard
                                title={project.name}
                                stats={progress}
                                cardType="project"
                                projectNumber={project.number}
                                collaborators={metadata.members}
                                relations={[
                                    {
                                        title: 'Repositories',
                                        items: metadata.repositories.map(repo => ({
                                            label: repo,
                                            href: `https://github.com/Smartelco/${repo}`
                                        }))
                                    }
                                ]}
                                issues={projectIssues}
                                extraContent={
                                    <div class="space-y-1">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600" style={{'font-family': 'Figtree'}}>Open PRs</span>
                                            <span class="text-blue-600">
                                            {metadata.openPRCount}
                                            </span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600" style={{'font-family': 'Figtree'}}>Comments</span>
                                            <span class="text-purple-600">
                                                {getTotalComments(metadata.issues)}
                                            </span>
                                        </div>
                                    </div>
                                }
                                href={project.html_url}
                            />
                        );
                    }}
                </For>
            </div>
        </>
    );
};