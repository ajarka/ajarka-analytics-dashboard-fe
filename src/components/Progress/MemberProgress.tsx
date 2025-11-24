import { Component, For, createSignal, createMemo } from 'solid-js';
import type { MemberDetailedStats, GithubProject } from '../../types/github';
import { calculateProgressStats } from './progressUtils';
import { SimplifiedProgressCard } from './SimplifiedProgressCard';
import { FilterSort } from '../Common/FilterSort';
import { useRateLimit } from '../../context/RateLimitContext';
import { Card } from '../UI/Card';
import { VStack, Text } from '@hope-ui/solid';

interface MemberProgressProps {
    members: MemberDetailedStats[];
    projects: GithubProject[];
}

export const MemberProgress: Component<MemberProgressProps> = (props) => {
    // Filter and sort states
    const [projectFilter, setProjectFilter] = createSignal<string[]>([]);
    const [repositoryFilter, setRepositoryFilter] = createSignal<string[]>([]);
    const [contributionFilter, setContributionFilter] = createSignal<string[]>([]);
    const [sortBy, setSortBy] = createSignal('progress');
    const [searchQuery, setSearchQuery] = createSignal('');
    const { isRateLimited, rateLimitData } = useRateLimit();

    const contributionLevels = [
        { label: 'Very Active (>100 contributions)', value: 'very-active' },
        { label: 'Active (50-100 contributions)', value: 'active' },
        { label: 'Moderate (20-50 contributions)', value: 'moderate' },
        { label: 'Low (<20 contributions)', value: 'low' }
    ];

    const getMemberContributionLevel = (member: MemberDetailedStats) => {
        const totalContributions =
            member.codeStats.totalCommits +
            member.codeStats.totalPRs +
            member.issues.length;

        if (totalContributions > 100) return 'very-active';
        if (totalContributions >= 50) return 'active';
        if (totalContributions >= 20) return 'moderate';
        return 'low';
    };

    const getUniqueRepositories = createMemo(() => {
        const repoSet = new Set<string>();
        props.members.forEach(member => {
            member.issues.forEach(issue => {
                repoSet.add(issue.repository.name);
            });
        });
        return Array.from(repoSet);
    });

    // Get member metadata including projects and repositories
    const getMemberMetadata = (member: MemberDetailedStats) => {
        // Get unique projects with urls
        const projectMap = new Map();
        props.projects.forEach(project => {
            const hasIssues = project.issues.some(projectIssue =>
                member.issues.some(memberIssue =>
                    memberIssue.number === projectIssue.number &&
                    memberIssue.repository.name === projectIssue.repository
                )
            );
            if (hasIssues) {
                projectMap.set(project.number, {
                    label: project.name,
                    href: `https://github.com/orgs/ajarka/projects/${project.number}`
                });
            }
        });

        // Get unique repositories with urls
        const repoMap = new Map();
        member.issues.forEach(issue => {
            repoMap.set(issue.repository.name, {
                label: issue.repository.name,
                href: `https://github.com/ajarka/${issue.repository.name}`
            });
        });

        console.log("projectMap -> ", Array.from(projectMap.values()));
        console.log("repoMap -> ", Array.from(repoMap.values()));

        console.log("projectMap -> ", JSON.stringify(Array.from(projectMap.values())));
        console.log("repoMap -> ", JSON.stringify(Array.from(repoMap.values())));
        return {
            projects: Array.from(projectMap.values()),
            repositories: Array.from(repoMap.values())
        };
    };

    const filteredMembers = createMemo(() => {
        let filtered = [...props.members];

        // Apply search filter
        if (searchQuery()) {
            const query = searchQuery().toLowerCase();
            filtered = filtered.filter(member =>
                member.member.login.toLowerCase().includes(query)
            );
        }

        // Apply project filter
        if (projectFilter().length > 0) {
            filtered = filtered.filter(member => {
                return props.projects
                    .filter(project => projectFilter().includes(project.name))
                    .some(project =>
                        project.issues.some(projectIssue =>
                            member.issues.some(memberIssue =>
                                memberIssue.number === projectIssue.number &&
                                memberIssue.repository.name === projectIssue.repository
                            )
                        )
                    );
            });
        }

        // Apply repository filter
        if (repositoryFilter().length > 0) {
            filtered = filtered.filter(member =>
                member.issues.some(issue =>
                    repositoryFilter().includes(issue.repository.name)
                )
            );
        }

        // Apply contribution level filter
        if (contributionFilter().length > 0) {
            filtered = filtered.filter(member =>
                contributionFilter().includes(getMemberContributionLevel(member))
            );
        }

        // Apply sorting
        switch (sortBy()) {
            case 'name':
                filtered.sort((a, b) => a.member.login.localeCompare(b.member.login));
                break;
            case 'commits':
                filtered.sort((a, b) => b.codeStats.totalCommits - a.codeStats.totalCommits);
                break;
            case 'pull-requests':
                filtered.sort((a, b) => b.codeStats.totalPRs - a.codeStats.totalPRs);
                break;
            case 'issues':
                filtered.sort((a, b) => b.issues.length - a.issues.length);
                break;
            case 'activity':
                filtered.sort((a, b) => {
                    const activityMapValue = {
                        'very-active': 4,
                        'active': 3,
                        'moderate': 2,
                        'low': 1
                    };
                    return activityMapValue[getMemberContributionLevel(b)] -
                        activityMapValue[getMemberContributionLevel(a)];
                });
                break;
            case 'progress':
                filtered.sort((a, b) => {
                    const progressA = calculateProgressStats(a.issues);
                    const progressB = calculateProgressStats(b.issues);
                    return progressB.issues.percentage - progressA.issues.percentage;
                });
                break;
        }

        console.log("filtered -> ", JSON.stringify(filtered));

        return filtered;
    });

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
                        name: 'Projects',
                        options: props.projects.map(project => ({
                            label: project.name,
                            value: project.name
                        })),
                        selectedValues: projectFilter(),
                        onFilterChange: setProjectFilter
                    },
                    {
                        name: 'Repositories',
                        options: getUniqueRepositories().map(repo => ({
                            label: repo,
                            value: repo
                        })),
                        selectedValues: repositoryFilter(),
                        onFilterChange: setRepositoryFilter
                    },
                    {
                        name: 'Contribution Level',
                        options: contributionLevels,
                        selectedValues: contributionFilter(),
                        onFilterChange: setContributionFilter
                    }
                ]}
                sorts={[
                    { label: 'Name', value: 'name' },
                    { label: 'Number of Commits', value: 'commits' },
                    { label: 'Number of Pull Requests', value: 'pull-requests' },
                    { label: 'Number of Issues', value: 'issues' },
                    { label: 'Activity Level', value: 'activity' },
                    { label: 'Progress', value: 'progress' }
                ]}
                currentSort={sortBy()}
                onSortChange={setSortBy}
                searchValue={searchQuery()}
                onSearchChange={setSearchQuery}
            />

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <For each={filteredMembers()}>
                    {(member) => {
                        const metadata = getMemberMetadata(member);
                        const progress = calculateProgressStats(member.issues);

                        return (
                            <SimplifiedProgressCard
                                title={member.member.login}
                                stats={progress}
                                cardType="member"
                                collaborators={[{
                                    name: member.member.login,
                                    avatar: member.member.avatar_url
                                }]}
                                issues={member.issues}
                                relations={[
                                    ...(metadata.projects.length > 0 ? [{
                                        title: 'Projects',
                                        items: metadata.projects
                                    }] : []),
                                    ...(metadata.repositories.length > 0 ? [{
                                        title: 'Repositories',
                                        items: metadata.repositories
                                    }] : [])
                                ]}
                                extraContent={
                                    <div class="space-y-1">
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Pull Requests</span>
                                            <span class="text-blue-600">
                                                {member.codeStats.totalPRs}
                                            </span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span class="text-gray-600">Commits</span>
                                            <span class="text-green-600">
                                                {member.codeStats.totalCommits}
                                            </span>
                                        </div>
                                    </div>
                                }
                                href={`https://github.com/${member.member.login}`}
                            />
                        );
                    }}
                </For>
            </div>
        </>
    );
};