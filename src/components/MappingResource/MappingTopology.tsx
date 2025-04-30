import { Component, createMemo, createSignal, For, onMount } from 'solid-js';
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
} from '@hope-ui/solid';
import {  GithubProject, MemberDetailedStats } from '../../types/github';
import {  FiActivity } from 'solid-icons/fi';  
import { SolidFlow } from "solid-flow";
import { calculateProgressStats } from '../Progress/progressUtils';
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
   

const MappingTopology: Component<MappingTopologyProps> = (props) => {
  const [projectFilter] = createSignal<string[]>([]);
  const [repositoryFilter] = createSignal<string[]>([]);
  const [contributionFilter] = createSignal<string[]>([]);
  const [sortBy] = createSignal('progress');
  const [searchQuery] = createSignal('');
  const [totalHeight, setTotalHeight] = createSignal(1000);
  const [selectedNode, setSelectedNode] = createSignal<any>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [lastNodePosition, setLastNodePosition] = createSignal<{ [key: string]: { x: number; y: number } }>({});
  const [isDragging, setIsDragging] = createSignal(false);
  const [showLegend, setShowLegend] = createSignal(true);

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

    // console.log("filtered -> ", JSON.stringify(filtered));

    return filtered;
});

const getMemberMetadata = (member: MemberDetailedStats, projects: ExtendedGithubProject[]) => {
  // Map to store project-repository relationships
  const projectRepoMap = new Map();
  
  // First, process all projects and their repositories
  projects.forEach(project => {
    const projectRepos = new Set();
    project.issues.forEach(projectIssue => {
      // Check if member has this issue
      const memberHasIssue = member.issues.some(memberIssue => 
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
          href: `https://github.com/orgs/Smartelco/projects/${project.number}`
        },
        repositories: Array.from(projectRepos).map(repoName => ({
          label: repoName,
          href: `https://github.com/Smartelco/${repoName}`
        }))
      });
    }
  });

  return Array.from(projectRepoMap.values());
};

// Function to generate nodes and edges from filtered members
const generateTopologyData = createMemo(() => {
  // console.log('Memulai pembuatan data topologi...');
  const nodes: any[] = [];
  const edges: any[] = [];
  let memberYOffset = 10;

  // Log filtered members
  // console.log('Member yang difilter:', filteredMembers());

  filteredMembers().forEach((member) => {
    const memberData = getMemberMetadata(member, props.projects);
    console.log(`Metadata untuk ${member.member.login}:`, memberData);
    
    const memberSpacing = 150; // Reduced from 200 to 150
    
    // Create member node with even smaller size
    const memberNode  = {
      id: `member-${member.member.login}`,
      position: { x: 50, y: memberYOffset + 50 },
      data: {
        label: '',
        content: (
          <div 
            class="flex items-center gap-1 py-1 px-2 bg-blue-100 rounded-md shadow-sm cursor-pointer hover:bg-gray-100"
            onClick={() => handleNodeClick({
              id: `member-${member.member.login}`,
              type: 'member',
              data: {
                content: {
                  props: {
                    children: [
                      { props: { src: member.member.avatar_url } },
                      { props: { children: member.member.login } }
                    ]
                  }
                }
              }
            })}
          >
            <img src={member.member.avatar_url} class="w-5 h-5 rounded-full border border-blue-300" />
            <span class="text-xs font-medium truncate max-w-[80px]">{member.member.login}</span>
          </div>
        ),
      },
      inputs: 0,
      outputs: 1,

    };
    nodes.push(memberNode);

    // Calculate spacing
    // const maxReposPerProject = Math.max(...memberData.map(data => data.repositories.length), 1);
    const nodeSpacing = 100; // Reduced from 80 to 60

    // Create project and repository nodes
    memberData.forEach((data, projectIndex) => {
      const projectYPos = memberYOffset + (projectIndex * nodeSpacing * 1.2); // Reduced multiplier from 1.5 to 1.2

      // console.log('[MappingTopology304] data -> ', data);
      
      // Check if this project has any open issues from this author
      const projectHasOpenIssues = props.projects
        .find(p => p.name === data.project.label)?.issues
        .filter(issue => member.issues.some(mi => mi.number === issue.number))
        .some(issue => issue.state === 'open');
        
      // Also check if any repositories in this project have open issues
      const anyRepoInProjectHasOpenIssues = data.repositories.some((repo: { label: string; href: string }) => 
        member.issues
          .filter(issue => issue.repository.name === repo.label)
          .some(issue => issue.state === 'open')
      );
      
      // Project is red if it has open issues or any of its repos have open issues
      const shouldBeRed = projectHasOpenIssues || anyRepoInProjectHasOpenIssues;
      
      // Create project node with smaller size
      const projectNode = {
        id: `project-${member.member.login}-${projectIndex}`,
        position: { x: 350, y: projectYPos + 50},
        data: {
          label: '',
          content: (
            <div 
              class={`py-1 px-2 ${shouldBeRed ? 'bg-red-100 hover:bg-red-200' : 'bg-purple-100 hover:bg-purple-200'} rounded-md shadow-sm cursor-pointer border ${shouldBeRed ? 'border-red-400' : 'border-purple-400'}`}
              onClick={() => handleNodeClick({
                id: `project-${member.member.login}-${projectIndex}`,
                type: 'project',
                data: {
                  content: {
                    props: {
                      children: {
                        props: {
                          children: data.project.label
                        }
                      }
                    }
                  }
                }
              })}
            >
              <span class={`text-xs font-medium truncate max-w-[200px] block ${shouldBeRed ? 'text-red-800' : 'text-purple-800'}`}>{data.project.label}</span>
            </div>
          ),
        },
        inputs: 1,
        outputs:1,
      };
      nodes.push(projectNode);

      // Connect member to project
      edges.push({
        id: `edge-member-${member.member.login}-project-${projectIndex}`,
        sourceNode: memberNode.id,
        sourceOutput: 0,
        targetNode: projectNode.id,
        targetInput: 0,
        type: 'smoothstep'
      });

      // Create repository nodes for this project with smaller size and zigzag pattern
      data.repositories.forEach((repo: { label: string; href: string }, repoIndex: number) => {
        // Calculate zigzag offset based on index
        const isEven = repoIndex % 2 === 0;
        const horizontalOffset = isEven ? 0 : 160; // Offset for odd numbered repos
        const verticalSpacing = nodeSpacing * 0.8; // Tighter vertical spacing
        const repoYPos = projectYPos + (repoIndex * verticalSpacing);
        
        // Check if this repository has any open issues for this author
        const repoHasOpenIssues = member.issues
          .filter(issue => issue.repository.name === repo.label)
          .some(issue => issue.state === 'open');
        
        const repoNode = {
          id: `repo-${member.member.login}-${projectIndex}-${repoIndex}`,
          position: { 
            x: 650 + horizontalOffset, 
            y: repoYPos + 50
          },
          data: {
            label: '',
            content: (
              <div 
                class={`py-1 px-2 ${repoHasOpenIssues ? 'bg-red-100 hover:bg-red-200' : 'bg-green-100 hover:bg-green-200'} rounded-md shadow-sm cursor-pointer border ${repoHasOpenIssues ? 'border-red-400' : 'border-green-400'}`}
                onClick={() => handleNodeClick({
                  id: `repo-${member.member.login}-${projectIndex}-${repoIndex}`,
                  type: 'repo',
                  data: {
                    content: {
                      props: {
                        children: {
                          props: {
                            children: repo.label
                          }
                        }
                      }
                    }
                  }
                })}
              >
                <span class={`text-xs font-medium truncate max-w-[200px] block ${repoHasOpenIssues ? 'text-red-800' : 'text-green-800'}`}>{repo.label}</span>
              </div>
            ),
          },
          inputs: 1,
          outputs: 0,
        };
        nodes.push(repoNode);

        // Connect project to repository with curved edges
        edges.push({
          id: `edge-project-${member.member.login}-${projectIndex}-repo-${repoIndex}`,
          sourceNode: projectNode.id,
          sourceOutput: 0,
          targetNode: repoNode.id,
          targetInput: 0,
          type: 'smoothstep'
        });
      });
    });

    // Calculate next member's starting Y position with adjusted spacing for zigzag
    const totalProjectHeight = memberData.length * nodeSpacing * 1.5; // Increased multiplier for zigzag
    memberYOffset += Math.max(totalProjectHeight, memberSpacing);
  });

  // Update total height needed with adjusted minimum for zigzag layout
  setTotalHeight(Math.max(700, memberYOffset + 100));

  // console.log('Nodes yang dihasilkan:', nodes);
  // console.log('Edges yang dihasilkan:', edges);
  console.log('Data Topologi Lengkap:', { nodes, edges });
  
  return { nodes, edges };
});

const [nodes, setNodes] = createSignal(generateTopologyData().nodes);
const [edges, setEdges] = createSignal(generateTopologyData().edges);

// // Tambahkan console log untuk melihat data
// console.log('Data Nodes:', nodes());
// console.log('Data Edges:', edges());
// console.log('Data Topologi Lengkap:', generateTopologyData());

// // Jika ingin melihat data props yang masuk
// console.log('Data Member:', props.members);
// console.log('Data Projects:', props.projects);

const handleNodesChange = (newNodes: any[]) => {
  // Check if any node position has changed significantly
  const hasPositionChanged = newNodes.some(node => {
    const lastPos = lastNodePosition()[node.id];
    if (!lastPos) return false;
    const dx = Math.abs(lastPos.x - node.position.x);
    const dy = Math.abs(lastPos.y - node.position.y);
    return dx > 5 || dy > 5; // Threshold for considering it a drag
  });

  if (hasPositionChanged) {
    setIsDragging(true);
  } else if (!isDragging()) {
    // If not dragging and positions haven't changed, it's a click
    const clickedNode = newNodes.find(node => {
      const lastPos = lastNodePosition()[node.id];
      return lastPos && 
             Math.abs(lastPos.x - node.position.x) < 5 && 
             Math.abs(lastPos.y - node.position.y) < 5;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      setIsModalOpen(true);
    }
  }

  // Update last known positions
  const newPositions = newNodes.reduce((acc, node) => {
    acc[node.id] = { x: node.position.x, y: node.position.y };
    return acc;
  }, {} as { [key: string]: { x: number; y: number } });
  setLastNodePosition(newPositions);

  // console.log('[MappingTopology290425] newNodes',newNodes);

  setNodes(newNodes);
};

// Reset dragging state when mouse is released
onMount(() => { 
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  window.addEventListener('mouseup', handleMouseUp);
  return () => window.removeEventListener('mouseup', handleMouseUp);
});

const handleNodeClick = (node: any) => { 
  console.log('Node yang diklik:', node);
  console.log('Tipe node:', node.type);
  console.log('Data node:', node.data);
  
  setSelectedNode(node);
  setIsModalOpen(true);
};

const renderNodeDetails = () => {
  const node = selectedNode();
  if (!node) return null;

  const nodeType = node.type;
  const nodeData = node.data;

  switch (nodeType) {
    case 'member':
      const member : any = props.members.find(m => m.member.login === nodeData.content.props.children[1].props.children);
      return (
        <div class="flex gap-8 w-full">
          {/* Left Column - Profile & Basic Stats */}
          <div class="w-1/4 space-y-6">
            <div class="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm">
              <img src={nodeData.content.props.children[0].props.src} class="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg" />
              <div class="mt-4 text-center">
                <h2 class="text-2xl font-fightree font-bold text-blue-600">{member?.member.login}</h2>
                <p class="text-sm font-fightree text-gray-600 mt-1">Type: {member?.type || 'Contributor'}</p>
                <div class="flex gap-2 mt-3 justify-center">
                  <Badge colorScheme="blue" class="px-3 py-1 rounded-full">Contributor</Badge>
                  <Badge colorScheme="green" class="px-3 py-1 rounded-full">Active</Badge>
                </div>
              </div>
            </div>

            {/* Code Stats Summary */}
            <div class="p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl shadow-sm space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800 border-b border-gray-200 pb-2">Code Statistics</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Lines Added</span>
                  <span class="text-sm font-fightree font-bold text-green-600">+{member?.codeStats.linesAdded || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Lines Deleted</span>
                  <span class="text-sm font-fightree font-bold text-red-600">-{member?.codeStats.linesDeleted || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Files Changed</span>
                  <span class="text-sm font-fightree font-bold text-blue-600">{member?.codeStats.filesChanged || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Total PRs</span>
                  <span class="text-sm font-fightree font-bold text-purple-600">{member?.codeStats.totalPRs || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Total Commits</span>
                  <span class="text-sm font-fightree font-bold text-indigo-600">{member?.codeStats.totalCommits || 0}</span>
                </div>
              </div>
            </div>

            {/* Issue Stats */}
            <div class="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800 border-b border-gray-200 pb-2">Issue Statistics</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Open Issues</span>
                  <span class="text-sm font-fightree font-bold text-green-600">{member?.issueStats?.open || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Closed Issues</span>
                  <span class="text-sm font-fightree font-bold text-red-600">{member?.issueStats?.closed || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">In Progress</span>
                  <span class="text-sm font-fightree font-bold text-yellow-600">{member?.issueStats?.inProgress || 0}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-fightree text-gray-600">Total Issues</span>
                  <span class="text-sm font-fightree font-bold text-blue-600">{member?.issueStats?.total || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Tasks & Activity */}
          <div class="w-2/5 space-y-6">
            {/* Task Statistics */}
            <div class="p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-sm">
              <h3 class="text-lg font-fightree font-bold text-gray-800 border-b border-gray-200 pb-2 mb-4">Task Statistics</h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-white/60 rounded-lg">
                  <p class="text-sm font-fightree text-gray-600">Completed Tasks</p>
                  <p class="text-2xl font-fightree font-bold text-green-600">{member?.taskStats?.completed || 0}</p>
                  <div class="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      class="h-2 bg-green-500 rounded-full" 
                      style={{ width: `${((member?.taskStats?.completed || 0) / (member?.taskStats?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div class="p-4 bg-white/60 rounded-lg">
                  <p class="text-sm font-fightree text-gray-600">In Progress</p>
                  <p class="text-2xl font-fightree font-bold text-yellow-600">{member?.taskStats?.inProgress || 0}</p>
                  <div class="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      class="h-2 bg-yellow-500 rounded-full" 
                      style={{ width: `${((member?.taskStats?.inProgress || 0) / (member?.taskStats?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div class="p-4 bg-white/60 rounded-lg">
                  <p class="text-sm font-fightree text-gray-600">Pending Review</p>
                  <p class="text-2xl font-fightree font-bold text-orange-600">{member?.taskStats?.pendingReview || 0}</p>
                  <div class="h-2 bg-gray-200 rounded-full mt-2">
                    <div 
                      class="h-2 bg-orange-500 rounded-full" 
                      style={{ width: `${((member?.taskStats?.pendingReview || 0) / (member?.taskStats?.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
                <div class="p-4 bg-white/60 rounded-lg">
                  <p class="text-sm font-fightree text-gray-600">Total Tasks</p>
                  <p class="text-2xl font-fightree font-bold text-blue-600">{member?.taskStats?.total || 0}</p>
                  <div class="h-2 bg-gray-200 rounded-full mt-2">
                    <div class="h-2 bg-blue-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Timeline */}
            <div class="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm space-y-4">
              <div class="flex justify-between items-center border-b border-gray-200 pb-2">
                <h3 class="text-lg font-fightree font-bold text-gray-800">Recent Activity</h3>
                <Badge colorScheme="blue" class="px-3 py-1">Last {member?.issues.length || 0} Activities</Badge>
              </div>
              <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <For each={member?.issues.slice(0, 8)}>
                  {(issue) => (
                    <div class="p-4 bg-white rounded-lg hover:shadow-md transition-all border border-gray-100">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                          <div class={`w-2 h-2 rounded-full ${issue.state === 'open' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <p class="text-sm font-fightree font-medium">{issue.title}</p>
                        </div>
                        <Badge colorScheme={issue.state === 'open' ? 'green' : 'red'} class="px-3 py-1 rounded-full">
                          {issue.state}
                        </Badge>
                      </div>
                      <div class="mt-2 flex justify-between items-center text-xs font-fightree text-gray-500">
                        <div class="flex items-center gap-4">
                          <span>Repository: {issue.repository.name}</span>
                          <span>#{issue.number}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>

          {/* Right Column - Repository Stats */}
          <div class="w-1/3 space-y-6">
            {/* Repository Contributions */}
            <div class="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800 border-b border-gray-200 pb-2">Repository Activity</h3>
              <div class="grid grid-cols-1 gap-4">
                <For each={Array.from(new Set(member?.issues.map((i: { repository: { name: any; }; }) => i.repository.name)))}>
                  {(repoName) => {
                    const repoIssues = member?.issues.filter((i: { repository: { name: unknown; }; }) => i.repository.name === repoName);
                    const openIssues = repoIssues?.filter((i: { state: string; }) => i.state === 'open').length || 0;
                    const closedIssues = repoIssues?.filter((i: { state: string; }) => i.state === 'closed').length || 0;
                    const totalIssues = openIssues + closedIssues;
                    
                    return (
                      <div class="p-4 bg-white rounded-lg border border-gray-100">
                        <div class="flex justify-between items-center mb-2">
                          <h4 class="font-fightree font-bold text-gray-700">{repoName as string}</h4>
                          <Badge colorScheme="purple" class="px-2 py-0.5 text-xs rounded-full">
                            {totalIssues} issues
                          </Badge>
                        </div>
                        <div class="space-y-2">
                          <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Open</span>
                            <div class="flex items-center gap-2">
                              <div class="w-24 h-2 bg-gray-200 rounded-full">
                                <div 
                                  class="h-2 bg-green-500 rounded-full" 
                                  style={{ width: `${(openIssues / totalIssues) * 100}%` }}
                                />
                              </div>
                              <span class="font-medium text-green-600">{openIssues}</span>
                            </div>
                          </div>
                          <div class="flex justify-between items-center text-sm">
                            <span class="text-gray-600">Closed</span>
                            <div class="flex items-center gap-2">
                              <div class="w-24 h-2 bg-gray-200 rounded-full">
                                <div 
                                  class="h-2 bg-red-500 rounded-full" 
                                  style={{ width: `${(closedIssues / totalIssues) * 100}%` }}
                                />
                              </div>
                              <span class="font-medium text-red-600">{closedIssues}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            {/* Additional Stats or Charts can be added here */}
            <div class="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl shadow-sm space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800 border-b border-gray-200 pb-2">Contribution Summary</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span class="text-sm font-fightree text-gray-600">Total Repositories</span>
                  <span class="text-lg font-fightree font-bold text-purple-600">
                    {new Set(member?.issues.map((i: { repository: { name: any; }; }) => i.repository.name)).size}
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span class="text-sm font-fightree text-gray-600">Active Days</span>
                  <span class="text-lg font-fightree font-bold text-blue-600">
                    {member?.codeStats?.activeDays || 0}
                  </span>
                </div>
                <div class="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span class="text-sm font-fightree text-gray-600">Avg. Daily Commits</span>
                  <span class="text-lg font-fightree font-bold text-green-600">
                    {((member?.codeStats?.totalCommits || 0) / (member?.codeStats?.activeDays || 1)).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'project':
      const project = props.projects.find(p => p.name === nodeData.content.props.children.props.children);
      return (
        <div class="flex gap-6 w-full">
          <div class="w-1/3 flex flex-col p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
            <h2 class="text-2xl font-fightree font-bold text-purple-600">{project?.name}</h2>
            <p class="text-sm font-fightree text-gray-600 mt-2">{project?.description || 'No description available'}</p>
          </div>

          <div class="w-2/3">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-purple-600">Total Issues</p>
                <p class="text-2xl font-fightree font-bold text-purple-800">{project?.issues.length}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-blue-600">Open Issues</p>
                <p class="text-2xl font-fightree font-bold text-blue-800">
                  {project?.issues.filter(i => i.state === 'open').length}
                </p>
              </div>
              <div class="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-green-600">Closed Issues</p>
                <p class="text-2xl font-fightree font-bold text-green-800">
                  {project?.issues.filter(i => i.state === 'closed').length}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800">Project Timeline</h3>
              <For each={project?.issues.slice(0, 5)}>
                {(issue) => (
                  <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all">
                    <div class="flex justify-between items-center">
                      <p class="text-sm font-fightree font-medium">#{issue.number} - {issue.title}</p>
                      <Badge colorScheme={issue.state === 'open' ? 'green' : 'red'} class="px-3 py-1 rounded-full">
                        {issue.state}
                      </Badge>
                    </div>
                    <p class="text-xs font-fightree text-gray-500 mt-1">Repository: {issue.repository}</p>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      );

    case 'repo':
      const repoName = nodeData.content.props.children.props.children;
      const repoIssues = props.members.flatMap(m => m.issues.filter(i => i.repository.name === repoName));
      const repoContributors = props.members.filter(m => 
        m.issues.some(i => i.repository.name === repoName)
      );
      
      return (
        <div class="flex gap-6 w-full">
          <div class="w-1/3 flex flex-col p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
            <h2 class="text-2xl font-fightree font-bold text-green-600">{repoName}</h2>
            <div class="flex gap-2 mt-4">
              <Badge colorScheme="green" class="px-3 py-1 rounded-full">Active</Badge>
              <Badge colorScheme="blue" class="px-3 py-1 rounded-full">{repoContributors.length} Contributors</Badge>
            </div>
          </div>

          <div class="w-2/3">
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-green-600">Total Issues</p>
                <p class="text-2xl font-fightree font-bold text-green-800">{repoIssues.length}</p>
              </div>
              <div class="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-blue-600">Open Issues</p>
                <p class="text-2xl font-fightree font-bold text-blue-800">
                  {repoIssues.filter(i => i.state === 'open').length}
                </p>
              </div>
              <div class="p-4 bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-purple-600">Contributors</p>
                <p class="text-2xl font-fightree font-bold text-purple-800">{repoContributors.length}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-lg font-fightree font-bold text-gray-800">Recent Activity</h3>
                <For each={repoIssues.slice(0, 5)}>
                  {(issue) => (
                    <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all">
                      <div class="flex justify-between items-center">
                        <p class="text-sm font-fightree font-medium">#{issue.number} - {issue.title}</p>
                        <Badge colorScheme={issue.state === 'open' ? 'green' : 'red'} class="px-3 py-1 rounded-full">
                          {issue.state}
                        </Badge>
                      </div>
                      <p class="text-xs font-fightree text-gray-500 mt-1">Created by: {issue.repository.name}</p>
                    </div>
                  )}
                </For>
              </div>

              <div class="space-y-4">
                <h3 class="text-lg font-fightree font-bold text-gray-800">Top Contributors</h3>
                <For each={repoContributors.slice(0, 5)}>
                  {(contributor) => (
                    <div class="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all">
                      <img src={contributor.member.avatar_url} class="w-10 h-10 rounded-full border-2 border-blue-300" />
                      <div>
                        <p class="text-sm font-fightree font-medium">{contributor.member.login}</p>
                        <p class="text-xs font-fightree text-gray-500">
                          {contributor.issues.filter(i => i.repository.name === repoName).length} contributions
                        </p>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      );

    case 'issue':
      return (
        <div class="flex gap-6 w-full">
          <div class="w-1/3 flex flex-col p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg">
            <h2 class="text-2xl font-fightree font-bold text-yellow-600">
              {nodeData.content.props.children.props.children}
            </h2>
            <div class="flex gap-2 mt-4">
              <Badge colorScheme={nodeData.content.props.children.props.state === 'open' ? 'green' : 'red'} class="px-3 py-1 rounded-full">
                {nodeData.content.props.children.props.state}
              </Badge>
              <Badge colorScheme="blue" class="px-3 py-1 rounded-full">Issue</Badge>
            </div>
          </div>

          <div class="w-2/3">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-yellow-600">Status</p>
                <p class="text-2xl font-fightree font-bold text-yellow-800">
                  {nodeData.content.props.children.props.state}
                </p>
              </div>
              <div class="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg shadow-sm">
                <p class="text-sm font-fightree text-blue-600">Repository</p>
                <p class="text-2xl font-fightree font-bold text-blue-800">
                  {nodeData.content.props.children.props.repository?.name || 'Unknown'}
                </p>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-lg font-fightree font-bold text-gray-800">Issue Details</h3>
              <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <p class="text-sm font-fightree">{nodeData.content.props.children.props.body || 'No description available'}</p>
              </div>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

return (
  <div class="w-full h-full overflow-hidden">
    <Box class="w-full h-full flex flex-col bg-white max-h-[80vh] max-w-[80vw] rounded-lg shadow-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200 bg-white z-10 ">
        <HStack spacing="4" justify="space-between">
          <HStack spacing="2">
            <div class="w-5 h-5">
              <FiActivity class="w-full h-full" />
            </div>
            <Text size="xl" fontWeight="bold" class="font-fightree">Team Topology</Text> 
          </HStack>
          <IconButton
            aria-label="Refresh"
            icon={<FiActivity />}
            variant="ghost"
            colorScheme="neutral"
          />
        </HStack>
      </div>
      <SolidFlow
              nodes={nodes()}
              edges={edges()}
              onNodesChange={handleNodesChange}
              onEdgesChange={(newEdges) => {
                  setEdges(newEdges as any);
              }}
          />
      <div >
        <div  >
         
        </div>
      </div>
    </Box>

    {/* Floating Legend Component */}
    <div class="fixed bottom-4 right-4 z-50 pointer-events-auto">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div 
          class="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer"
          onClick={() => setShowLegend(!showLegend())}
        >
          <Text size="sm" fontWeight="bold" class="text-gray-700">Color Legend</Text>
          <div class="transform transition-transform duration-200" classList={{ 'rotate-180': !showLegend() }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 15L12 9L18 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div 
          class="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ 
            'max-height': showLegend() ? '200px' : '0px',
            opacity: showLegend() ? '1' : '0'
          }}
        >
          <div class="p-4 space-y-3">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <Text size="xs" class="text-gray-700">Author</Text>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-purple-100 border border-purple-400 rounded"></div>
              <Text size="xs" class="text-gray-700">Project (No Open Issues)</Text>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
              <Text size="xs" class="text-gray-700">Repository (No Open Issues)</Text>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
              <Text size="xs" class="text-gray-700">Project/Repository (Has Open Issues)</Text>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal opened={isModalOpen()} onClose={() => setIsModalOpen(false)} size="7xl">
      <ModalOverlay />
      <ModalContent class="max-w-[90vw]">
        <ModalCloseButton />
        <ModalHeader class="font-fightree text-2xl border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">Node Details</ModalHeader>
        <ModalBody class="p-8">
          {renderNodeDetails()}
        </ModalBody>
        <ModalFooter class="border-t border-gray-200">
          <HStack spacing="$4" justify="flex-end">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} class="font-fightree">
              Close
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  </div>
);
};

export default MappingTopology;