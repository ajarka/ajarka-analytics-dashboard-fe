import { Component, For } from 'solid-js';
import type { GithubProject, GithubIssue, GithubPullRequest } from '../../types/github';
import { calculateProgressStats } from './progressUtils';
import { calculateDueStatus } from '../../utils/dateUtils';
import { useNavigate } from '@solidjs/router';
import { 
    FaSolidFolder,
    FaSolidCodeBranch,
    FaSolidLink,
    FaSolidEye
} from 'solid-icons/fa';
import type { ViewType } from '../../types/github';

interface ProgressListViewProps {
    viewType: ViewType;
    projects?: GithubProject[];
    repositories?: any[];
    members?: any[];
    issues?: GithubIssue[];
    pullRequests?: GithubPullRequest[];
    commits?: any[];
    memberDetailedStats?: any[];
    // Filter options - will be pre-filtered from Dashboard
    filteredProjects?: GithubProject[];
    filteredRepositories?: any[];
    filteredMembers?: any[];
}

export const ProgressListView: Component<ProgressListViewProps> = (props) => {
    const navigate = useNavigate();
    
    const getProjectMetadata = (project: GithubProject) => {
        const projectIssues = props.issues?.filter(issue =>
            project.issues.some(projectIssue =>
                projectIssue.number === issue.number &&
                projectIssue.repository === issue.repository.name
            )
        ) || [];

        const projectPRs = props.pullRequests?.filter(pr =>
            project.issues.some(pi => pi.repository === pr.repository.name)
        ) || [];

        const openPRs = projectPRs.filter(pr => !pr.merged_at && pr.state === 'open');

        return {
            issues: projectIssues,
            pullRequests: projectPRs,
            openPRCount: openPRs.length
        };
    };

    const getDueStats = (issues: GithubIssue[]) => {
        let safe = 0, soon = 0, overdue = 0, none = 0;
        
        issues.forEach(issue => {
            const status = calculateDueStatus(issue.due_date || '', '');
            switch(status) {
                case 'safe': safe++; break;
                case 'soon': soon++; break;
                case 'overdue': overdue++; break;
                default: none++; break;
            }
        });

        return { safe, soon, overdue, none, total: issues.length };
    };

    const MiniProgressChart: Component<{ percentage: number; size?: 'sm' | 'md' }> = (props) => {
        const size = props.size || 'sm';
        const sizeClass = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
        const strokeWidth = size === 'sm' ? 2 : 3;
        const radius = size === 'sm' ? 14 : 20;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (props.percentage / 100) * circumference;

        return (
            <div class={`${sizeClass} relative`}>
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                    <circle
                        cx="16"
                        cy="16"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        stroke-width={strokeWidth}
                        class="text-gray-200 dark:text-gray-700"
                    />
                    <circle
                        cx="16"
                        cy="16"
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        stroke-width={strokeWidth}
                        stroke-dasharray={circumference.toString()}
                        stroke-dashoffset={strokeDashoffset.toString()}
                        class={
                            props.percentage === 100 ? 'text-green-500' :
                            props.percentage >= 70 ? 'text-blue-500' :
                            props.percentage >= 40 ? 'text-yellow-500' : 'text-red-500'
                        }
                        stroke-linecap="round"
                    />
                </svg>
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {props.percentage.toFixed(0)}%
                    </span>
                </div>
            </div>
        );
    };

    const MiniBarChart: Component<{ data: number[]; colors: string[] }> = (props) => {
        const maxValue = Math.max(...props.data);
        return (
            <div class="flex items-end space-x-1 h-8">
                <For each={props.data}>
                    {(value, index) => (
                        <div 
                            class={`w-2 rounded-t ${props.colors[index()] || 'bg-gray-400'} transition-all duration-300`}
                            style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%` }}
                            title={`${value}`}
                        />
                    )}
                </For>
            </div>
        );
    };

    const DueDateMiniChart: Component<{ stats: { safe: number; soon: number; overdue: number; none: number; total: number } }> = (props) => {
        if (props.stats.total === 0) return <div class="w-16 h-2 bg-gray-200 rounded" />;

        return (
            <div class="w-16 h-2 flex rounded overflow-hidden">
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
        );
    };

    const renderProjectsList = () => (
        <div class="space-y-2">
            <For each={props.filteredProjects || props.projects}>
                {(project) => {
                    const metadata = getProjectMetadata(project);
                    const progress = calculateProgressStats(metadata.issues);
                    const dueStats = getDueStats(metadata.issues);
                    
                    return (
                        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg border border-blue-900/10 dark:border-blue-300/10 p-4 hover:shadow-lg transition-all duration-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4 flex-1">
                                    {/* Project Icon */}
                                    <div class="p-2 rounded-lg bg-gradient-to-br from-blue-900 to-purple-800 dark:from-blue-700 dark:to-purple-600">
                                        <FaSolidFolder class="w-4 h-4 text-white" />
                                    </div>
                                    
                                    {/* Project Info */}
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <h3 class="text-sm font-bold text-blue-900 dark:text-blue-300 truncate" style={{'font-family': 'Figtree'}}>
                                                {project.name}
                                            </h3>
                                            {project.html_url && (
                                                <a href={project.html_url} target="_blank" rel="noopener noreferrer" 
                                                   class="text-blue-500 hover:text-blue-700 dark:text-blue-400">
                                                    <FaSolidLink class="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-6">
                                    {/* Progress Chart */}
                                    <div class="flex items-center space-x-2">
                                        <MiniProgressChart percentage={progress.issues.percentage} />
                                        <div class="text-right">
                                            <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {progress.issues.completed}/{progress.issues.total}
                                            </div>
                                            <div class="text-xs text-gray-500">issues</div>
                                        </div>
                                    </div>

                                    {/* Tasks Info */}
                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-purple-600 dark:text-purple-400">
                                            {progress.tasks?.completed || 0}/{progress.tasks?.total || 0}
                                        </div>
                                        <div class="text-xs text-gray-500">tasks</div>
                                    </div>

                                    {/* Open PRs */}
                                    <div class="text-center min-w-[50px]">
                                        <div class="text-sm font-bold text-green-600 dark:text-green-400">
                                            {metadata.openPRCount}
                                        </div>
                                        <div class="text-xs text-gray-500">PRs</div>
                                    </div>

                                    {/* Due Date Chart */}
                                    <div class="text-center min-w-[70px]">
                                        <DueDateMiniChart stats={dueStats} />
                                        <div class="text-xs text-gray-500 mt-1">due dates</div>
                                    </div>

                                    {/* Status */}
                                    <div class="text-right min-w-[80px]">
                                        <div class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            progress.issues.percentage === 100 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : progress.issues.percentage >= 70 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                : progress.issues.percentage >= 40 
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {progress.issues.percentage === 100 ? 'Complete' :
                                             progress.issues.percentage >= 70 ? 'On Track' :
                                             progress.issues.percentage >= 40 ? 'Behind' : 'Critical'}
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <div class="min-w-[110px]">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (project.number) {
                                                    navigate(`/project/${project.number}`);
                                                }
                                            }}
                                            class="
                                                inline-flex items-center px-3 py-1.5 
                                                bg-gradient-to-r from-blue-600 to-blue-700 
                                                hover:from-blue-700 hover:to-blue-800
                                                dark:from-blue-500 dark:to-blue-600
                                                dark:hover:from-blue-600 dark:hover:to-blue-700
                                                text-white text-xs font-medium
                                                rounded-lg transition-all duration-200
                                                shadow-sm hover:shadow-md
                                                transform hover:scale-105
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                            "
                                            disabled={!project.html_url}
                                        >
                                            <FaSolidEye class="w-3 h-3 mr-1.5" />
                                            <span style={{'font-family': 'Figtree'}}>View Details</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </For>
        </div>
    );

    const renderRepositoriesList = () => (
        <div class="space-y-2">
            <For each={props.repositories}>
                {(repo) => {
                    const repoIssues = props.issues?.filter(issue => issue.repository.name === repo.name) || [];
                    const repoPRs = props.pullRequests?.filter(pr => pr.repository.name === repo.name) || [];
                    const repoCommits = props.commits?.filter(commit => commit.repository?.name === repo.name) || [];
                    
                    return (
                        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg border border-blue-900/10 dark:border-blue-300/10 p-4 hover:shadow-lg transition-all duration-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4 flex-1">
                                    <div class="p-2 rounded-lg bg-gradient-to-br from-blue-900 to-purple-800">
                                        <FaSolidCodeBranch class="w-4 h-4 text-white" />
                                    </div>
                                    
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <h3 class="text-sm font-bold text-blue-900 dark:text-blue-300 truncate">
                                                {repo.name}
                                            </h3>
                                            <a href={repo.html_url} target="_blank" rel="noopener noreferrer" 
                                               class="text-blue-500 hover:text-blue-700 dark:text-blue-400">
                                                <FaSolidLink class="w-3 h-3" />
                                            </a>
                                        </div>
                                        <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                                            {repo.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-6">
                                    {/* Issues */}
                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-purple-600 dark:text-purple-400">
                                            {repoIssues.length}
                                        </div>
                                        <div class="text-xs text-gray-500">issues</div>
                                    </div>

                                    {/* PRs */}
                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-green-600 dark:text-green-400">
                                            {repoPRs.length}
                                        </div>
                                        <div class="text-xs text-gray-500">PRs</div>
                                    </div>

                                    {/* Commits */}
                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-blue-600 dark:text-blue-400">
                                            {repoCommits.length}
                                        </div>
                                        <div class="text-xs text-gray-500">commits</div>
                                    </div>

                                    {/* Activity Chart */}
                                    <div class="flex items-center space-x-2">
                                        <MiniBarChart 
                                            data={[repoIssues.length, repoPRs.length, repoCommits.length]} 
                                            colors={['bg-purple-500', 'bg-green-500', 'bg-blue-500']}
                                        />
                                    </div>

                                    {/* View Details Button */}
                                    <div class="min-w-[110px]">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate(`/repository/${repo.name}`);
                                            }}
                                            class="
                                                inline-flex items-center px-3 py-1.5 
                                                bg-gradient-to-r from-purple-600 to-purple-700 
                                                hover:from-purple-700 hover:to-purple-800
                                                dark:from-purple-500 dark:to-purple-600
                                                dark:hover:from-purple-600 dark:hover:to-purple-700
                                                text-white text-xs font-medium
                                                rounded-lg transition-all duration-200
                                                shadow-sm hover:shadow-md
                                                transform hover:scale-105
                                                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1
                                            "
                                            disabled={!repo.html_url}
                                        >
                                            <FaSolidEye class="w-3 h-3 mr-1.5" />
                                            <span style={{'font-family': 'Figtree'}}>View Details</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </For>
        </div>
    );

    const renderMembersList = () => (
        <div class="space-y-2">
            <For each={props.memberDetailedStats}>
                {(member) => {
                    const memberIssues = member.issues || [];
                    const progress = calculateProgressStats(memberIssues);
                    
                    return (
                        <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg border border-blue-900/10 dark:border-blue-300/10 p-4 hover:shadow-lg transition-all duration-200">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4 flex-1">
                                    <img 
                                        src={member.member.avatar_url} 
                                        alt={member.member.login}
                                        class="w-10 h-10 rounded-full border-2 border-blue-200"
                                    />
                                    
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center space-x-2">
                                            <h3 class="text-sm font-bold text-blue-900 dark:text-blue-300">
                                                {member.member.login}
                                            </h3>
                                            <a href={`https://github.com/${member.member.login}`} 
                                               target="_blank" rel="noopener noreferrer" 
                                               class="text-blue-500 hover:text-blue-700 dark:text-blue-400">
                                                <FaSolidLink class="w-3 h-3" />
                                            </a>
                                        </div>
                                        <p class="text-xs text-gray-600 dark:text-gray-400">
                                            Team Member
                                        </p>
                                    </div>
                                </div>

                                <div class="flex items-center space-x-6">
                                    {/* Issues Progress */}
                                    <div class="flex items-center space-x-2">
                                        <MiniProgressChart percentage={progress.issues.percentage} />
                                        <div class="text-right">
                                            <div class="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {progress.issues.completed}/{progress.issues.total}
                                            </div>
                                            <div class="text-xs text-gray-500">issues</div>
                                        </div>
                                    </div>

                                    {/* Code Stats */}
                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-purple-600 dark:text-purple-400">
                                            {member.codeStats?.totalCommits || 0}
                                        </div>
                                        <div class="text-xs text-gray-500">commits</div>
                                    </div>

                                    <div class="text-center min-w-[60px]">
                                        <div class="text-sm font-bold text-green-600 dark:text-green-400">
                                            {member.codeStats?.totalPRs || 0}
                                        </div>
                                        <div class="text-xs text-gray-500">PRs</div>
                                    </div>

                                    {/* Activity Chart */}
                                    <div class="flex items-center space-x-2">
                                        <MiniBarChart 
                                            data={[
                                                progress.issues.total,
                                                member.codeStats?.totalCommits || 0,
                                                member.codeStats?.totalPRs || 0
                                            ]} 
                                            colors={['bg-blue-500', 'bg-purple-500', 'bg-green-500']}
                                        />
                                    </div>

                                    {/* Completion Rate */}
                                    <div class="text-right min-w-[80px]">
                                        <div class={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            progress.issues.percentage >= 80 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : progress.issues.percentage >= 60 
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                : progress.issues.percentage >= 40 
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {progress.issues.percentage >= 80 ? 'Excellent' :
                                             progress.issues.percentage >= 60 ? 'Good' :
                                             progress.issues.percentage >= 40 ? 'Average' : 'Needs Focus'}
                                        </div>
                                    </div>

                                    {/* View Details Button */}
                                    <div class="min-w-[110px]">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                navigate(`/member/${member.member.login}`);
                                            }}
                                            class="
                                                inline-flex items-center px-3 py-1.5 
                                                bg-gradient-to-r from-green-600 to-green-700 
                                                hover:from-green-700 hover:to-green-800
                                                dark:from-green-500 dark:to-green-600
                                                dark:hover:from-green-600 dark:hover:to-green-700
                                                text-white text-xs font-medium
                                                rounded-lg transition-all duration-200
                                                shadow-sm hover:shadow-md
                                                transform hover:scale-105
                                                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                                            "
                                        >
                                            <FaSolidEye class="w-3 h-3 mr-1.5" />
                                            <span style={{'font-family': 'Figtree'}}>View Details</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </For>
        </div>
    );

    return (
        <div class="space-y-4">
            {props.viewType === 'projects' && renderProjectsList()}
            {props.viewType === 'repositories' && renderRepositoriesList()}
            {props.viewType === 'members' && renderMembersList()}
        </div>
    );
};

export default ProgressListView;