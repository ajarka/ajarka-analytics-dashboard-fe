import { Component, createMemo, createSignal, For, onMount, createEffect } from "solid-js";
import {
  HStack,
  Text,
  Box,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Badge,
} from "@hope-ui/solid";
import { GithubProject, MemberDetailedStats } from "../../types/github";
import { FiActivity } from "solid-icons/fi";
import { SolidFlow } from "solid-flow";
import { calculateProgressStats } from "../Progress/progressUtils";
import styles from "../../styles.module.css";

interface ProjectIssue {
  number: number;
  title: string;
  state: string;
  repository: string;
  description?: string;
  status: any;
}

interface ExtendedGithubProject extends GithubProject {
  description?: string;
  issues: ProjectIssue[];
}

interface MappingTopologyProps {
  members: MemberDetailedStats[];
  projects: ExtendedGithubProject[];
}

// Simplified filter types based on color legend
type StateFilter = "all" | "hasOpenIssues" | "noOpenIssues";

const MappingTopology: Component<MappingTopologyProps> = (props) => {
  const [selectedNode, setSelectedNode] = createSignal<any>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [showLegend, setShowLegend] = createSignal(true);
  
  // Simplified state filter - only what's needed
  const [stateFilter, setStateFilter] = createSignal<StateFilter>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = createSignal(false);

  // Initialize nodes and edges signals
  const [nodes, setNodes] = createSignal<any[]>([]);
  const [edges, setEdges] = createSignal<any[]>([]);

  // Check if project has open issues for this member
  const hasOpenIssuesForMember = (project: ExtendedGithubProject, member: MemberDetailedStats): boolean => {
    return project.issues
      .filter(issue => member.issues.some(mi => mi.number === issue.number))
      .some(issue => issue.state === "open");
  };

  // Check if any repository in project has open issues for this member
  const hasOpenRepoIssuesForMember = (project: ExtendedGithubProject, member: MemberDetailedStats): boolean => {
    const projectRepos = new Set(project.issues.map(issue => issue.repository));
    return Array.from(projectRepos).some(repoName =>
      member.issues
        .filter(issue => issue.repository.name === repoName)
        .some(issue => issue.state === "open")
    );
  };

  const getMemberMetadata = (
    member: MemberDetailedStats,
    projects: ExtendedGithubProject[]
  ) => {
    const projectRepoMap = new Map();

    projects.forEach((project) => {
      const projectRepos = new Set();
      project.issues.forEach((projectIssue) => {
        const memberHasIssue = member.issues.some(
          (memberIssue) =>
            memberIssue.number === projectIssue.number &&
            memberIssue.repository.name === projectIssue.repository
        );

        if (memberHasIssue) {
          projectRepos.add(projectIssue.repository);
        }
      });

      if (projectRepos.size > 0) {
        projectRepoMap.set(project.number, {
          project: {
            label: project.name,
            href: `https://github.com/orgs/Smartelco/projects/${project.number}`,
          },
          repositories: Array.from(projectRepos).map((repoName) => ({
            label: repoName,
            href: `https://github.com/Smartelco/${repoName}`,
          })),
        });
      }
    });

    return Array.from(projectRepoMap.values());
  };

  // Get detailed node info for modal
  const getNodeDetailedInfo = (nodeId: string, nodeType: string, nodeData: any) => {
    if (nodeType === "member") {
      const member = nodeData.member;
      const openIssues = member.issues.filter((issue: any) => issue.state === "open");
      const closedIssues = member.issues.filter((issue: any) => issue.state === "closed");
      
      return {
        ...member,
        detailedStats: {
          totalIssues: member.issues.length,
          openIssues: openIssues.length,
          closedIssues: closedIssues.length,
          totalCommits: member.codeStats.totalCommits,
          openIssuesList: openIssues,
          closedIssuesList: closedIssues
        }
      };
    } else if (nodeType === "project") {
      const project = nodeData.project;
      const openIssues = project.issues.filter((issue: any) => issue.state === "open");
      const closedIssues = project.issues.filter((issue: any) => issue.state === "closed");
      
      return {
        ...project,
        detailedStats: {
          totalIssues: project.issues.length,
          openIssues: openIssues.length,
          closedIssues: closedIssues.length,
          openIssuesList: openIssues,
          closedIssuesList: closedIssues
        }
      };
    } else if (nodeType === "repo") {
      // Find issues for this specific repository across all members
      const repoName = nodeData.repo;
      const allIssuesForRepo: any[] = [];
      
      props.members.forEach(member => {
        const repoIssues = member.issues.filter(issue => issue.repository.name === repoName);
        allIssuesForRepo.push(...repoIssues);
      });
      
      // Remove duplicates based on issue number
      const uniqueIssues = allIssuesForRepo.filter((issue, index, self) => 
        index === self.findIndex(i => i.number === issue.number)
      );
      
      const openIssues = uniqueIssues.filter(issue => issue.state === "open");
      const closedIssues = uniqueIssues.filter(issue => issue.state === "closed");
      
      return {
        name: repoName,
        detailedStats: {
          totalIssues: uniqueIssues.length,
          openIssues: openIssues.length,
          closedIssues: closedIssues.length,
          openIssuesList: openIssues,
          closedIssuesList: closedIssues
        }
      };
    }
    
    return nodeData;
  };

  const generateTopologyData = createMemo(() => {
    const nodes: any[] = [];
    const edges: any[] = [];
    let memberYOffset = 10;

    // Filter members first - only show members that have matching entities for the current filter
    const filteredMembers = props.members.filter(member => {
      if (stateFilter() === "all") {
        return true; // Show all members when filter is "all"
      }

      const memberProjects = props.projects.filter(project =>
        project.issues.some(projectIssue =>
          member.issues.some(memberIssue =>
            memberIssue.number === projectIssue.number &&
            memberIssue.repository.name === projectIssue.repository
          )
        )
      );

      // Check if member has any projects/repos that match the filter
      const hasMatchingEntities = memberProjects.some(project => {
        const projectHasOpenIssues = hasOpenIssuesForMember(project, member);
        const anyRepoHasOpenIssues = hasOpenRepoIssuesForMember(project, member);
        
        if (stateFilter() === "hasOpenIssues") {
          // Member should be shown if they have any red project or red repo
          const hasRedProject = projectHasOpenIssues || anyRepoHasOpenIssues;
          const hasRedRepo = project.issues.some(projectIssue => {
            const repoName = projectIssue.repository;
            return member.issues
              .filter(issue => issue.repository.name === repoName)
              .some(issue => issue.state === "open");
          });
          return hasRedProject || hasRedRepo;
        } else if (stateFilter() === "noOpenIssues") {
          // Member should be shown if they have any purple project or green repo
          const hasNonRedProject = !projectHasOpenIssues && !anyRepoHasOpenIssues;
          const hasGreenRepo = project.issues.some(projectIssue => {
            const repoName = projectIssue.repository;
            const repoIssues = member.issues.filter(issue => issue.repository.name === repoName);
            return repoIssues.length > 0 && repoIssues.every(issue => issue.state === "closed");
          });
          return hasNonRedProject || hasGreenRepo;
        }
        return true;
      });

      return hasMatchingEntities;
    });

    filteredMembers.forEach((member) => {
      const memberData = getMemberMetadata(member, props.projects);
      const memberSpacing = 150;

      // Filter member data based on state filter
      const filteredMemberData = memberData.filter((data) => {
        const currentProject = props.projects.find(p => p.name === data.project.label);
        if (!currentProject) return false;

        const projectHasOpenIssues = hasOpenIssuesForMember(currentProject, member);
        const anyRepoHasOpenIssues = hasOpenRepoIssuesForMember(currentProject, member);
        const shouldBeRed = projectHasOpenIssues || anyRepoHasOpenIssues;

        // Apply state filter to projects
        if (stateFilter() === "hasOpenIssues") {
          return shouldBeRed; // Only show red projects
        } else if (stateFilter() === "noOpenIssues") {
          return !shouldBeRed; // Only show purple projects
        }
        return true; // Show all if filter is "all"
      });

      // Skip member if no projects match the filter
      if (filteredMemberData.length === 0 && stateFilter() !== "all") {
        return;
      }

      // Create member node
      const memberNode = {
        id: `member-${member.member.login}`,
        position: { x: 50, y: memberYOffset + 50 },
        data: {
          label: "",
          content: (
            <div
              class="flex items-center gap-1 py-1 px-2 bg-blue-100 rounded-md shadow-sm cursor-pointer hover:bg-gray-100"
              onClick={() =>
                handleNodeClick({
                  id: `member-${member.member.login}`,
                  type: "member",
                  data: { member }
                })
              }
            >
              <img
                src={member.member.avatar_url}
                class="w-5 h-5 rounded-full border border-blue-300"
                loading="lazy"
              />
              <span class="text-xs font-medium truncate max-w-[80px]">
                {member.member.login}
              </span>
            </div>
          ),
        },
        inputs: 0,
        outputs: 1,
      };
      nodes.push(memberNode);

      const nodeSpacing = 100;

      // Create project and repository nodes (only for filtered data)
      filteredMemberData.forEach((data, projectIndex) => {
        const projectYPos = memberYOffset + projectIndex * nodeSpacing * 1.2;
        const currentProject = props.projects.find(p => p.name === data.project.label);

        if (!currentProject) return;

        // Determine color based on open issues
        const projectHasOpenIssues = hasOpenIssuesForMember(currentProject, member);
        const anyRepoHasOpenIssues = hasOpenRepoIssuesForMember(currentProject, member);
        const shouldBeRed = projectHasOpenIssues || anyRepoHasOpenIssues;

        // Create project node
        const projectNode = {
          id: `project-${member.member.login}-${projectIndex}`,
          position: { x: 350, y: projectYPos + 50 },
          data: {
            label: "",
            content: (
              <div
                class={`py-1 px-2 ${
                  shouldBeRed
                    ? "bg-red-100 hover:bg-red-200 border-red-400 text-red-800"
                    : "bg-purple-100 hover:bg-purple-200 border-purple-400 text-purple-800"
                } rounded-md shadow-sm cursor-pointer border`}
                onClick={() =>
                  handleNodeClick({
                    id: `project-${member.member.login}-${projectIndex}`,
                    type: "project",
                    data: { project: currentProject }
                  })
                }
              >
                <span class="text-xs font-medium truncate max-w-[200px] block">
                  {data.project.label}
                </span>
              </div>
            ),
          },
          inputs: 1,
          outputs: 1,
        };
        nodes.push(projectNode);

        // Connect member to project
        edges.push({
          id: `edge-member-${member.member.login}-project-${projectIndex}`,
          sourceNode: memberNode.id,
          sourceOutput: 0,
          targetNode: projectNode.id,
          targetInput: 0,
          type: "smoothstep",
        });

        // Filter repositories based on state filter
        const filteredRepositories = data.repositories.filter(
          (repo: { label: string; href: string }) => {
            const repoHasOpenIssues = member.issues
              .filter((issue) => issue.repository.name === repo.label)
              .some((issue) => issue.state === "open");

            // Apply state filter to repositories
            if (stateFilter() === "hasOpenIssues") {
              return repoHasOpenIssues; // Only show red repositories
            } else if (stateFilter() === "noOpenIssues") {
              return !repoHasOpenIssues; // Only show green repositories
            }
            return true; // Show all if filter is "all"
          }
        );

        // Create repository nodes (only for filtered repositories)
        filteredRepositories.forEach(
          (repo: { label: string; href: string }, repoIndex: number) => {
            const isEven = repoIndex % 2 === 0;
            const horizontalOffset = isEven ? 0 : 160;
            const verticalSpacing = nodeSpacing * 0.8;
            const repoYPos = projectYPos + repoIndex * verticalSpacing;

            // Check if this repository has open issues
            const repoHasOpenIssues = member.issues
              .filter((issue) => issue.repository.name === repo.label)
              .some((issue) => issue.state === "open");

            const repoNode = {
              id: `repo-${member.member.login}-${projectIndex}-${repoIndex}`,
              position: {
                x: 650 + horizontalOffset,
                y: repoYPos + 50,
              },
              data: {
                label: "",
                content: (
                  <div
                    class={`py-1 px-2 ${
                      repoHasOpenIssues
                        ? "bg-red-100 hover:bg-red-200 border-red-400 text-red-800"
                        : "bg-green-100 hover:bg-green-200 border-green-400 text-green-800"
                    } rounded-md shadow-sm cursor-pointer border`}
                    onClick={() =>
                      handleNodeClick({
                        id: `repo-${member.member.login}-${projectIndex}-${repoIndex}`,
                        type: "repo",
                        data: { repo: repo.label }
                      })
                    }
                  >
                    <span class="text-xs font-medium truncate max-w-[200px] block">
                      {repo.label}
                    </span>
                  </div>
                ),
              },
              inputs: 1,
              outputs: 0,
            };
            nodes.push(repoNode);

            // Connect project to repository
            edges.push({
              id: `edge-project-${member.member.login}-${projectIndex}-repo-${repoIndex}`,
              sourceNode: projectNode.id,
              sourceOutput: 0,
              targetNode: repoNode.id,
              targetInput: 0,
              type: "smoothstep",
            });
          }
        );
      });

      const totalProjectHeight = filteredMemberData.length * nodeSpacing * 1.5;
      memberYOffset += Math.max(totalProjectHeight, memberSpacing);
    });

    return { nodes, edges };
  });

  // Update nodes and edges when topology data changes
  createEffect(() => {
    const topologyData = generateTopologyData();
    setNodes(topologyData.nodes);
    setEdges(topologyData.edges);
  });

  const handleNodesChange = (newNodes: any[]) => {
    setNodes(newNodes);
  };

  const handleNodeClick = (node: any) => {
    console.log("Node clicked:", node);
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  // Click outside handler for dropdown
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const dropdown = document.querySelector(".filter-dropdown") as HTMLElement | null;

      if (target && dropdown && !dropdown.contains(target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  });

  const renderNodeDetails = () => {
    const node = selectedNode();
    if (!node) return null;

    const nodeType = node.type;
    const detailedInfo = getNodeDetailedInfo(node.id, nodeType, node.data);

    switch (nodeType) {
      case "member":
        return (
          <div class="p-6">
            <div class="flex items-center gap-4 mb-6">
              <img
                src={detailedInfo.member.avatar_url}
                class="w-16 h-16 rounded-full border-2 border-blue-500"
              />
              <div>
                <h2 class="text-xl font-bold text-blue-600">
                  {detailedInfo.member.login}
                </h2>
                <p class="text-gray-600">Team Member</p>
              </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-blue-50 rounded-lg">
                <p class="text-sm text-gray-600">Total Commits</p>
                <p class="text-xl font-bold text-blue-600">
                  {detailedInfo.detailedStats.totalCommits}
                </p>
              </div>
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">Total Issues</p>
                <p class="text-xl font-bold text-gray-600">
                  {detailedInfo.detailedStats.totalIssues}
                </p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg">
                <p class="text-sm text-gray-600">Open Issues</p>
                <p class="text-xl font-bold text-red-600">
                  {detailedInfo.detailedStats.openIssues}
                </p>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <p class="text-sm text-gray-600">Closed Issues</p>
                <p class="text-xl font-bold text-green-600">
                  {detailedInfo.detailedStats.closedIssues}
                </p>
              </div>
            </div>

            {detailedInfo.detailedStats.openIssues > 0 && (
              <div class="mt-4">
                <h3 class="text-sm font-semibold text-red-600 mb-2">Recent Open Issues:</h3>
                <div class="max-h-32 overflow-y-auto space-y-1">
                  {detailedInfo.detailedStats.openIssuesList.slice(0, 5).map((issue: any) => (
                    <div class="text-xs p-2 bg-red-50 rounded border-l-2 border-red-400">
                      <div class="font-medium">#{issue.number}</div>
                      <div class="text-gray-600 truncate">{issue.title}</div>
                      <div class="text-gray-500">in {issue.repository.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "project":
        return (
          <div class="p-6">
            <h2 class="text-xl font-bold text-purple-600 mb-4">
              {detailedInfo.name}
            </h2>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">Total Issues</p>
                <p class="text-xl font-bold text-gray-600">
                  {detailedInfo.detailedStats.totalIssues}
                </p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg">
                <p class="text-sm text-gray-600">Open Issues</p>
                <p class="text-xl font-bold text-red-600">
                  {detailedInfo.detailedStats.openIssues}
                </p>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <p class="text-sm text-gray-600">Closed Issues</p>
                <p class="text-xl font-bold text-green-600">
                  {detailedInfo.detailedStats.closedIssues}
                </p>
              </div>
            </div>

            {detailedInfo.detailedStats.openIssues > 0 && (
              <div class="mt-4">
                <h3 class="text-sm font-semibold text-red-600 mb-2">Open Issues:</h3>
                <div class="max-h-32 overflow-y-auto space-y-1">
                  {detailedInfo.detailedStats.openIssuesList.slice(0, 5).map((issue: any) => (
                    <div class="text-xs p-2 bg-red-50 rounded border-l-2 border-red-400">
                      <div class="font-medium">#{issue.number}</div>
                      <div class="text-gray-600 truncate">{issue.title}</div>
                      <div class="text-gray-500">in {issue.repository}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "repo":
        return (
          <div class="p-6">
            <h2 class="text-xl font-bold text-green-600 mb-4">
              {detailedInfo.name}
            </h2>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">Total Issues</p>
                <p class="text-xl font-bold text-gray-600">
                  {detailedInfo.detailedStats.totalIssues}
                </p>
              </div>
              <div class="p-4 bg-red-50 rounded-lg">
                <p class="text-sm text-gray-600">Open Issues</p>
                <p class="text-xl font-bold text-red-600">
                  {detailedInfo.detailedStats.openIssues}
                </p>
              </div>
              <div class="p-4 bg-green-50 rounded-lg">
                <p class="text-sm text-gray-600">Closed Issues</p>
                <p class="text-xl font-bold text-green-600">
                  {detailedInfo.detailedStats.closedIssues}
                </p>
              </div>
            </div>

            {detailedInfo.detailedStats.openIssues > 0 && (
              <div class="mt-4">
                <h3 class="text-sm font-semibold text-red-600 mb-2">Open Issues:</h3>
                <div class="max-h-32 overflow-y-auto space-y-1">
                  {detailedInfo.detailedStats.openIssuesList.slice(0, 5).map((issue: any) => (
                    <div class="text-xs p-2 bg-red-50 rounded border-l-2 border-red-400">
                      <div class="font-medium">#{issue.number}</div>
                      <div class="text-gray-600 truncate">{issue.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return <div class="p-6">Details not available</div>;
    }
  };

  return (
    <div class="w-full h-full overflow-hidden">
      <div class="h-full bg-white max-h-[80vh] rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div class="p-4 border-b border-gray-200 bg-white z-10">
          <HStack spacing="4" justify="space-between">
            <HStack spacing="2">
              <div class="w-5 h-5">
                <FiActivity class="w-full h-full" />
              </div>
              <Text size="xl" fontWeight="bold" class="font-fightree">
                Team Topology
              </Text>
            </HStack>
            <IconButton
              aria-label="Refresh"
              icon={<FiActivity />}
              variant="ghost"
              colorScheme="neutral"
            />
          </HStack>
          
          {/* Simplified Filter Controls */}
          <div class="mt-4 flex flex-wrap gap-4 items-center">
            <div class="relative filter-dropdown">
              <div class="flex items-center gap-2">
                <Text size="sm" class="font-medium">Filter by State:</Text>
                <div class="relative">
                  <button
                    class="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium transition-colors min-w-[160px] justify-between"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen())}
                  >
                    <span>
                      {stateFilter() === "all" && "All Projects"}
                      {stateFilter() === "hasOpenIssues" && "Has Open Issues"}
                      {stateFilter() === "noOpenIssues" && "No Open Issues"}
                    </span>
                    <svg
                      class={`w-4 h-4 transition-transform ${
                        isFilterDropdownOpen() ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isFilterDropdownOpen() && (
                    <div class="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20">
                      <div class="p-1">
                        <button
                          class={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded ${
                            stateFilter() === "all" ? "bg-blue-50 text-blue-700" : ""
                          }`}
                          onClick={() => {
                            setStateFilter("all");
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-gray-300 rounded"></div>
                            <span>All Projects</span>
                          </div>
                        </button>
                        <button
                          class={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded ${
                            stateFilter() === "hasOpenIssues" ? "bg-blue-50 text-blue-700" : ""
                          }`}
                          onClick={() => {
                            setStateFilter("hasOpenIssues");
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-red-100 border border-red-400 rounded"></div>
                            <span>Has Open Issues</span>
                          </div>
                        </button>
                        <button
                          class={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded ${
                            stateFilter() === "noOpenIssues" ? "bg-blue-50 text-blue-700" : ""
                          }`}
                          onClick={() => {
                            setStateFilter("noOpenIssues");
                            setIsFilterDropdownOpen(false);
                          }}
                        >
                          <div class="flex items-center gap-2">
                            <div class="w-3 h-3 bg-purple-100 border border-purple-400 rounded mr-1"></div>
                            <div class="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
                            <span>No Open Issues</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Filter Summary */}
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing:</span>
              <Badge colorScheme="blue">
                {nodes().filter(n => n.id.startsWith('member-')).length} members
              </Badge>
              <Badge colorScheme="purple">
                {nodes().filter(n => n.id.startsWith('project-')).length} projects
              </Badge>
              <Badge colorScheme="green">
                {nodes().filter(n => n.id.startsWith('repo-')).length} repositories
              </Badge>
              {stateFilter() !== "all" && (
                <Badge colorScheme="orange">
                  {stateFilter() === "hasOpenIssues" ? "Red Only" : "Purple/Green Only"}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Fixed width, height scrollable */}
        <Box class="relative p-4 overflow-x-hidden overflow-y-auto" style={{ height: "calc(100vh - 180px)", width: "100%" }}>
          <div class={styles.main} style={{ height: "100%", width: "100%", "max-width": "75vw" }}>
            {nodes().length === 0 ? (
              <div class="flex items-center justify-center h-full w-full">
                <div class="text-center p-8">
                  <div class="text-6xl mb-4">🔍</div>
                  <Text size="lg" class="font-medium text-gray-600 mb-2">
                    No entities match the selected filter
                  </Text>
                  <Text size="sm" class="text-gray-500 mb-4">
                    {stateFilter() === "hasOpenIssues" 
                      ? "No red projects or repositories found"
                      : stateFilter() === "noOpenIssues"
                      ? "No purple/green projects or repositories found" 
                      : "Try selecting a different state filter"
                    }
                  </Text>
                  <Button
                    onClick={() => setStateFilter("all")}
                    variant="outline"
                  >
                    Show All Entities
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ width: "100%", height: "100%" }}>
                <SolidFlow
                  nodes={nodes()}
                  edges={edges()}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={setEdges}
                />
              </div>
            )}
          </div>
        </Box>

        {/* Enhanced Floating Legend - Fixed width */}
        <div class="fixed bottom-4 right-4 z-50 pointer-events-auto">
          <div class="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 min-w-[300px]">
            <div
              class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer"
              onClick={() => setShowLegend(!showLegend())}
            >
              <Text size="sm" fontWeight="bold" class="text-gray-700">
                Color Legend & Filter Guide
              </Text>
              <div
                class="transform transition-transform duration-200"
                classList={{ "rotate-180": !showLegend() }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 15L12 9L18 15"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div
              class="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                "max-height": showLegend() ? "500px" : "0px",
                opacity: showLegend() ? "1" : "0",
              }}
            >
              <div class="p-4 space-y-3 max-w-[300px]">
                <div class="text-xs font-semibold text-gray-700 border-b pb-2">
                  Node Types
                </div>
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <Text size="xs" class="text-gray-700">Team Member (Always Blue)</Text>
                </div>
                
                <div class="text-xs font-semibold text-gray-700 border-b pb-2 pt-2">
                  Entity States
                </div>
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-purple-100 border border-purple-400 rounded"></div>
                    <Text size="xs" class="text-gray-700">Project (No Open Issues)</Text>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
                    <Text size="xs" class="text-gray-700">Repository (No Open Issues)</Text>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
                    <Text size="xs" class="text-gray-700">Project/Repository (Has Open Issues)</Text>
                  </div>
                </div>
                
                <div class="text-xs font-semibold text-gray-700 border-b pb-2 pt-2">
                  Filter Effects
                </div>
                <div class="space-y-2">
                  <div class="p-2 bg-gray-50 rounded text-xs">
                    <div class="font-medium text-gray-700 mb-1">All Projects</div>
                    <div class="text-gray-600">Shows all members and all colored entities</div>
                  </div>
                  <div class="p-2 bg-red-50 rounded text-xs">
                    <div class="font-medium text-red-700 mb-1">Has Open Issues</div>
                    <div class="text-red-600">Shows only RED projects and repositories</div>
                  </div>
                  <div class="p-2 bg-purple-50 rounded text-xs">
                    <div class="font-medium text-purple-700 mb-1">No Open Issues</div>
                    <div class="text-purple-600">Shows only PURPLE projects and GREEN repositories</div>
                  </div>
                </div>
                
                <div class="text-xs text-gray-500 mt-3 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                  <strong>Note:</strong> Members are shown only if they have entities matching the selected filter
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal
          opened={isModalOpen()}
          onClose={() => setIsModalOpen(false)}
          size="xl"
        >
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalHeader class="font-fightree text-xl border-b border-gray-200">
              Node Details
            </ModalHeader>
            <ModalBody>
              {renderNodeDetails()}
            </ModalBody>
            <ModalFooter class="border-t border-gray-200">
              <HStack spacing="$4" justify="flex-end">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  class="font-fightree"
                >
                  Close
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default MappingTopology;