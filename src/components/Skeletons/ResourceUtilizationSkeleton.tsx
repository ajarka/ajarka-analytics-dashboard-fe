import { Component } from 'solid-js';
import { Box, HStack, VStack } from '@hope-ui/solid';

const CardSkeleton = () => (
  <Box 
    class="animate-pulse p-6 rounded-xl shadow-sm" 
    style={{
      'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
      'border': '1px solid rgba(0,0,0,0.08)'
    }}
  >
    <VStack alignItems="flex-start" spacing="$4">
      <Box class="h-4 w-24 bg-slate-300 rounded" />
      <Box class="h-8 w-16 bg-blue-200 rounded" />
    </VStack>
  </Box>
);

const ChartSkeleton = () => (
  <Box 
    class="animate-pulse p-6 rounded-xl shadow-sm" 
    style={{
      'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
      'border': '1px solid rgba(0,0,0,0.08)',
      'height': '300px'
    }}
  >
    <VStack alignItems="flex-start" spacing="$4">
      <Box class="h-6 w-48 bg-slate-300 rounded" />
      <Box 
        class="h-[250px] w-full rounded" 
        style={{
          'background': 'linear-gradient(135deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)'
        }}
      />
    </VStack>
  </Box>
);

const TableRowSkeleton = () => (
  <HStack spacing="$4" class="p-4">
    <Box class="h-8 w-8 bg-blue-200 rounded-full" />
    <Box class="h-4 w-32 bg-slate-300 rounded" />
    <Box class="h-4 w-24 bg-slate-200 rounded" />
    <Box class="h-4 w-24 bg-slate-200 rounded" />
  </HStack>
);

export const ResourceUtilizationSkeleton: Component = () => {
  return (
    <div class="space-y-6">
      {/* Header Card */}
      <Box 
        class="animate-pulse p-6 rounded-xl shadow-sm"
        style={{
          'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
          'border': '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <HStack justifyContent="space-between">
          <Box class="h-8 w-64 bg-slate-300 rounded" />
          <HStack spacing="$2">
            {[1,2,3,4].map(() => (
              <Box class="h-8 w-20 bg-blue-200 rounded-full" />
            ))}
          </HStack>
        </HStack>
      </Box>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(() => <CardSkeleton />)}
      </div>

      {/* Quick Recommendations */}
      <Box 
        class="animate-pulse p-6 rounded-xl shadow-sm"
        style={{
          'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
          'border': '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Box class="h-6 w-48 bg-slate-300 rounded mb-4" />
        <VStack spacing="$3">
          <Box 
            class="h-16 w-full rounded-lg" 
            style={{
              'background': 'linear-gradient(to right, #fee2e2 0%, #fecaca 100%)'
            }}
          />
          <Box 
            class="h-16 w-full rounded-lg"
            style={{
              'background': 'linear-gradient(to right, #ffedd5 0%, #fed7aa 100%)'
            }}
          />
        </VStack>
      </Box>

      {/* Charts */}
      <div class="grid grid-cols-1 gap-6">
        <ChartSkeleton /> {/* Workload Distribution */}
        <ChartSkeleton /> {/* Member Load Analysis */}
        <ChartSkeleton /> {/* Capacity Planning */}
      </div>

      {/* Table */}
      <Box 
        class="animate-pulse p-6 rounded-xl shadow-sm"
        style={{
          'background': 'linear-gradient(145deg, #ffffff, #f8fafc)',
          'border': '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Box class="h-6 w-48 bg-slate-300 rounded mb-6" />
        <VStack spacing="$2">
          {[1,2,3,4,5].map(() => <TableRowSkeleton />)}
        </VStack>
      </Box>
    </div>
  );
}; 