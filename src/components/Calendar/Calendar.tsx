import { createMemo, createSignal } from 'solid-js';
import { Card } from '../UI/Card';
import {
  Popover,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  VStack,
  PopoverTrigger,
  Text
} from '@hope-ui/solid';
import { GithubIssue, GithubProject } from '../../types/github';
import FullCalendarWrapper from './FullCalendarWrapper';
import { FilterSort, FilterOption } from '../Common/FilterSort';
import IssuePopoverContent from './IssuePopoverContent';
import { useRateLimit } from '../../context/RateLimitContext';

// Definisikan konstanta untuk status proyek dan warnanya
const PROJECT_STATUSES = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in progress',
  REVIEW: 'review',
  DONE: 'done',
};

// Mapping warna untuk setiap status
const STATUS_COLORS = {
  [PROJECT_STATUSES.BACKLOG]: '#94A3B8', // gray-400
  [PROJECT_STATUSES.TODO]: '#3B82F6', // blue-500
  [PROJECT_STATUSES.IN_PROGRESS]: '#F59E0B',    // amber-500
  [PROJECT_STATUSES.REVIEW]: '#8B5CF6',  // violet-500
  [PROJECT_STATUSES.DONE]: '#10B981',    // emerald-500
  'open': '#F59E0B',                     // default open
  'closed': '#10B981',                   // default closed
};

interface CalendarProps {
  issues: GithubIssue[];
  members: { login: string }[];
  projects: GithubProject[];
}

const Calendar = (props: CalendarProps) => {
  const [selectedMembers, setSelectedMembers] = createSignal<string[]>([]);
  const [selectedProject, setSelectedProject] = createSignal('all');
  const [searchValue, setSearchValue] = createSignal('');
  const [currentSort, setCurrentSort] = createSignal('date');
  const [selectedIssue, setSelectedIssue] = createSignal<GithubIssue | null>(null);
  const [selectedRepository, setSelectedRepository] = createSignal<string>('all');
  const { isRateLimited, rateLimitData } = useRateLimit();

  // Tambahkan state untuk filter status
  const [selectedStatuses, setSelectedStatuses] = createSignal<string[]>(
    Object.values(PROJECT_STATUSES).filter(s => s !== PROJECT_STATUSES.BACKLOG)
  );

  // Helper function untuk mendapatkan status proyek dari issue
  const getIssueStatus = (issue: GithubIssue): string => {
    for (const project of props.projects) {
      const projectIssue = project.issues.find(pi =>
        pi.number === issue.number && pi.repository === issue.repository.name
      );

      if (projectIssue?.status) {
        return projectIssue.status.toLowerCase();
      }
    }

    // Default status berdasarkan state jika tidak ada status proyek
    return issue.state;
  };

  // Helper function untuk mendapatkan warna berdasarkan status
  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    for (const [key, value] of Object.entries(STATUS_COLORS)) {
      if (normalizedStatus.includes(key)) {
        return value;
      }
    }

    // Default color
    return status === 'closed' ? STATUS_COLORS.closed : STATUS_COLORS.open;
  };

  const mapIssuesToProjects = (issues: GithubIssue[], projects: GithubProject[]) => {
    return issues.map(issue => enrichIssueWithProject(issue, findProjectForIssue(projects, issue)));
  };

  const findProjectForIssue = (projects: GithubProject[], issue: GithubIssue) => {
    return projects.find(project => doesProjectContainIssue(project, issue));
  };

  const doesProjectContainIssue = (project: GithubProject, issue: GithubIssue) => {
    return project.issues.some(projectIssue => projectIssueMatches(projectIssue, issue));
  };

  const projectIssueMatches = (projectIssue: any, issue: GithubIssue) => {
    return projectIssue.number === issue.number &&
      projectIssue.repository === issue.repository.name;
  };

  const enrichIssueWithProject = (issue: GithubIssue, project?: GithubProject) => {
    return {
      ...issue,
      project: project ? { name: project.name, number: project.number } : undefined,
      projectStatus: project ? getIssueProjectStatus(issue, project) : undefined
    };
  };

  // Helper function untuk mendapatkan status proyek dari issue
  const getIssueProjectStatus = (issue: GithubIssue, project: GithubProject): string | undefined => {
    const projectIssue = project.issues.find(pi =>
      pi.number === issue.number && pi.repository === issue.repository.name
    );

    return projectIssue?.status;
  };

  const repositoryOptions: FilterOption[] = [
    { label: 'All Repositories', value: 'all' },
    ...Array.from(new Set(props.issues.map(issue => issue.repository.name))).map(name => ({
      label: name,
      value: name
    }))
  ];

  // Prepare members filter options
  const memberOptions: FilterOption[] = [
    ...props.members.map(member => ({
      label: member.login,
      value: member.login
    }))
  ];

  // Prepare projects filter options
  const projectOptions: FilterOption[] = [
    ...props.projects.map(project => ({
      label: project.name,
      value: project.number.toString()
    }))
  ];

  // Prepare status filter options
  const statusOptions: FilterOption[] = Object.entries(PROJECT_STATUSES).map(([_, value]) => ({
    label: value.charAt(0).toUpperCase() + value.slice(1),
    value: value
  }));

  const mappedIssues = createMemo(() => mapIssuesToProjects(props.issues, props.projects));

  const filteredIssues = createMemo(() => {
    return mappedIssues().filter(issue => {
      if (!issue.start_date) return false;

      const isSelectedMember = selectedMembers().length === 0 ||
        (issue.assignee && selectedMembers().includes(issue.assignee.login));

      const isSelectedProject = selectedProject() === 'all' ||
        (issue.project && issue.project.number.toString() === selectedProject());

      const isSelectedRepository = selectedRepository() === 'all' ||
        issue.repository.name === selectedRepository();

      const matchesSearch = searchValue() === '' ||
        issue.title.toLowerCase().includes(searchValue().toLowerCase());

      // Filter berdasarkan status
      const status = getIssueStatus(issue);
      const isSelectedStatus = selectedStatuses().length === 0 ||
        selectedStatuses().some(s => status.includes(s));

      return isSelectedMember && isSelectedProject &&
        matchesSearch && isSelectedStatus && isSelectedRepository;
    });
  });

  const handleEventClick = (info: any) => {
    const issue = info.event.extendedProps.issue;
    console.log("Handle Click: ", issue);
    setSelectedIssue(issue);
  };

  const sortOptions = [
    { label: 'By Date', value: 'date' },
    { label: 'By Project', value: 'project' }
  ];

  if (isRateLimited()) {
    return (
      <Card>
        <VStack spacing="$4" alignItems="center" p="$6" style={{'font-family': 'Figtree'}}>
          <Text size="xl" fontWeight="$bold" color="$danger600" style={{'font-family': 'Figtree'}}>
            Projects Data Temporarily Unavailable
          </Text>
          <Text textAlign="center" color="$neutral600" style={{'font-family': 'Figtree'}}>
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
    <VStack spacing="4" h="100%" w="100%" position="relative" style={{'font-family': 'Figtree'}}>
      {/* Filter Section */}
      <Card p="4" w="100%" maxW="none">
        <FilterSort
          filters={[
            {
              name: 'Members',
              options: memberOptions,
              selectedValues: selectedMembers(),
              onFilterChange: setSelectedMembers
            },
            {
              name: 'Status',
              options: statusOptions,
              selectedValues: selectedStatuses(),
              onFilterChange: setSelectedStatuses
            },
            {
              name: 'Repository',
              options: repositoryOptions,
              selectedValues: [selectedRepository()],
              onFilterChange: (values) => setSelectedRepository(values[0] || 'all')
            },
            {
              name: 'Projects',
              options: projectOptions,
              selectedValues: [selectedProject()],
              onFilterChange: (values) => setSelectedProject(values[0] || 'all')
            }
          ]}
          sorts={sortOptions}
          currentSort={currentSort()}
          onSortChange={setCurrentSort}
          searchValue={searchValue()}
          onSearchChange={setSearchValue}
        />
      </Card>

      {/* Status Filter */}
      {/* <StatusFilter /> */}

      {/* Calendar Section */}
      <Card w="100%" maxW="none">
        <FullCalendarWrapper
          issues={filteredIssues()}
          onEventClick={handleEventClick}
          getStatusColor={getStatusColor}
          getIssueStatus={getIssueStatus}
        />
      </Card>

      {/* Popover */}
      <Popover
        opened={selectedIssue() !== null}
        onClose={() => setSelectedIssue(null)}
      >
        <PopoverTrigger />
        {selectedIssue() && (
          <PopoverContent style={{'font-family': 'Figtree'}}>
            <PopoverArrow />
            <PopoverCloseButton />
            <IssuePopoverContent
              issue={selectedIssue()!}
              projectStatus={getIssueStatus(selectedIssue()!)}
            />
          </PopoverContent>
        )}
      </Popover>
    </VStack>
  );
};

export default Calendar;