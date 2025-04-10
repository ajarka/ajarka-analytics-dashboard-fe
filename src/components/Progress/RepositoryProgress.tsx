import { Component, For, createSignal, createMemo } from 'solid-js';
import type {
    GithubRepository,
    GithubIssue,
    GithubPullRequest,
    GithubCommit,
    GithubProject
} from '../../types/github';
import { calculateProgressStats } from './progressUtils';
import { SimplifiedProgressCard } from './SimplifiedProgressCard';
import { FilterSort } from '../Common/FilterSort';
import { useRateLimit } from '../../context/RateLimitContext';
import { Card } from '../UI/Card';
import { VStack, Text } from '@hope-ui/solid';

interface RepositoryProgressProps {
    repositories: GithubRepository[];
    issues: GithubIssue[];
    pullRequests: GithubPullRequest[];
    commits: GithubCommit[];
    projects: GithubProject[];
}

export const RepositoryProgress: Component<RepositoryProgressProps> = (props) => {
    // Filter and sort states
    const [memberFilter, setMemberFilter] = createSignal<string[]>([]);
    const [projectFilter, setProjectFilter] = createSignal<string[]>([]);
    const [activityFilter, setActivityFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal('progress');
    const [searchQuery, setSearchQuery] = createSignal('');
    const { isRateLimited, rateLimitData } = useRateLimit();

    // Get unique members across issues, PRs, and commits
    const getUniqueMembers = () => {
        const memberSet = new Set<string>();

        // From issues
        props.issues.forEach(issue => {
            if (issue.assignee) {
                memberSet.add(issue.assignee.login);
            }
        });

        // From PRs
        props.pullRequests.forEach(pr => {
            if (pr.user) {
                memberSet.add(pr.user.login);
            }
        });

        // From commits
        props.commits.forEach(commit => {
            if (commit.author?.login) {
                memberSet.add(commit.author.login);
            }
        });

        return Array.from(memberSet);
    };

    // Activity levels for filtering
    const activityLevels = [
        { label: 'High Activity (>100 commits)', value: 'high' },
        { label: 'Medium Activity (20-100 commits)', value: 'medium' },
        { label: 'Low Activity (<20 commits)', value: 'low' }
    ];

    const getRepoActivityLevel = (repoName: string) => {
        const commitCount = props.commits.filter(c => c.repository.name === repoName).length;
        if (commitCount > 100) return 'high';
        if (commitCount >= 20) return 'medium';
        return 'low';
    };

    // Helper functions for filtering
    const hasMemberInIssues = (repo: GithubRepository, members: string[]) => {
        return props.issues.some(issue => 
            issue.repository.name === repo.name && 
            issue.assignee && 
            members.includes(issue.assignee.login)
        );
    };

    const hasMemberInPRs = (repo: GithubRepository, members: string[]) => {
        return props.pullRequests.some(pr => 
            pr.repository.name === repo.name && 
            members.includes(pr.user.login)
        );
    };

    const hasMemberInCommits = (repo: GithubRepository, members: string[]) => {
        return props.commits.some(commit => 
            commit.repository.name === repo.name && 
            commit.author?.login && 
            members.includes(commit.author.login)
        );
    };

    const hasProjectIssues = (repo: GithubRepository, projectNames: string[]) => {
        return props.projects
            .some(project => 
                projectNames.includes(project.name) && 
                project.issues.some(issue => issue.repository === repo.name)
            );
    };

    // Filter repositories based on all criteria
    const filteredRepositories = createMemo(() => {
        let filtered = [...props.repositories];

        // Apply search filter
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filtered = filtered.filter(repo =>
                repo.name.toLowerCase().includes(query) ||
                repo.description?.toLowerCase().includes(query)
            );
        }

        // Apply member filter
        if (memberFilter().length > 0) {
            const members = memberFilter();
            filtered = filtered.filter(repo => 
                hasMemberInIssues(repo, members) || 
                hasMemberInPRs(repo, members) || 
                hasMemberInCommits(repo, members)
            );
        }

        // Apply project filter
        if (projectFilter().length > 0) {
            filtered = filtered.filter(repo => hasProjectIssues(repo, projectFilter()));
        }

        // Apply activity filter
        if (activityFilter().length > 0) {
            filtered = filtered.filter(repo => activityFilter().includes(getRepoActivityLevel(repo.name)));
        }

        // Apply sorting
        switch (sortBy()) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'issues':
                filtered.sort((a, b) => {
                    const issuesA = props.issues.filter(i => i.repository.name === a.name).length;
                    const issuesB = props.issues.filter(i => i.repository.name === b.name).length;
                    return issuesB - issuesA;
                });
                break;
            case 'commits':
                filtered.sort((a, b) => {
                    const commitsA = props.commits.filter(c => c.repository.name === a.name).length;
                    const commitsB = props.commits.filter(c => c.repository.name === b.name).length;
                    return commitsB - commitsA;
                });
                break;
            case 'activity':
                filtered.sort((a, b) => {
                    const activityMapValue = { high: 3, medium: 2, low: 1 };
                    return activityMapValue[getRepoActivityLevel(b.name)] -
                        activityMapValue[getRepoActivityLevel(a.name)];
                });
                break;
            case 'progress':
                filtered.sort((a, b) => {
                    const progressA = calculateProgressStats(props.issues.filter(i => i.repository.name === a.name));
                    const progressB = calculateProgressStats(props.issues.filter(i => i.repository.name === b.name));
                    return progressB.issues.percentage - progressA.issues.percentage;
                });
                break;
        }

        return filtered;
    });

    const getRepoMetadata = (repo: GithubRepository) => {
        // Get all issues for this repo
        const repoIssues = props.issues.filter(issue =>
            issue.repository.name === repo.name
        );

        // Get unique members
        const memberMap = new Map();
        repoIssues.forEach(issue => {
            if (issue.assignee) {
                memberMap.set(issue.assignee.login, {
                    name: issue.assignee.login,
                    avatar: issue.assignee.avatar_url
                });
            }
        });

        // Find related projects
        const relatedProjects = props.projects
            .filter(project => project.issues.some(issue => issue.repository === repo.name))
            .map(project => ({
                label: project.name,
                href: `https://github.com/orgs/Smartelco/projects/${project.number}`
            }));

        return {
            issues: repoIssues,
            members: Array.from(memberMap.values()),
            projects: relatedProjects
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

    return (
        <>
            <FilterSort
                filters={[
                    {
                        name: 'Members',
                        options: getUniqueMembers().map(member => ({
                            label: member,
                            value: member
                        })),
                        selectedValues: memberFilter(),
                        onFilterChange: setMemberFilter
                    },
                    {
                        name: 'Projects',
                        options: props.projects.map(project => ({
                            label: project.name,
                            value: project.name
                        })),
                        selectedValues: projectFilter(),
                        onFilterChange: setProjectFilter
                    },
                    {
                        name: 'Activity Level',
                        options: activityLevels,
                        selectedValues: activityFilter(),
                        onFilterChange: setActivityFilter
                    }
                ]}
                sorts={[
                    { label: 'Name', value: 'name' },
                    { label: 'Number of Issues', value: 'issues' },
                    { label: 'Number of Commits', value: 'commits' },
                    { label: 'Activity Level', value: 'activity' },
                    { label: 'Progress', value: 'progress' }
                ]}
                currentSort={sortBy()}
                onSortChange={setSortBy}
                searchValue={searchQuery()}
                onSearchChange={setSearchQuery}
            />

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <For each={filteredRepositories()}>
                    {(repo) => {
                        const metadata = getRepoMetadata(repo);
                        const progress = calculateProgressStats(metadata.issues);

                        const repoPRs = props.pullRequests.filter(pr =>
                            pr.repository.name === repo.name
                        );
                        const repoCommits = props.commits.filter(commit =>
                            commit.repository.name === repo.name
                        );

                        return (
                            <SimplifiedProgressCard
                                title={repo.name}
                                stats={progress}
                                cardType="repository"
                                collaborators={metadata.members}
                                relations={metadata.projects.length > 0 ? [
                                    {
                                        title: 'Projects',
                                        items: metadata.projects
                                    }
                                ] : undefined}
                                issues={metadata.issues} 
                                extraContent={
                                    <div class="space-y-1">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Pull Requests</span>
                                            <span class="text-blue-600">{repoPRs.length}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Commits</span>
                                            <span class="text-green-600">{repoCommits.length}</span>
                                        </div>
                                    </div>
                                }
                                href={`https://github.com/Smartelco/${repo.name}`}
                            />
                        );
                    }}
                </For>
            </div>
        </>
    );
};