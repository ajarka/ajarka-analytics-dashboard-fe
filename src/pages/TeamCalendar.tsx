import { Component } from 'solid-js';
import { VStack, Spinner, Text, Skeleton } from '@hope-ui/solid';
import { useGithubData } from '../hooks/useGithubData';
import Calendar from '../components/Calendar/Calendar';

const CalendarSkeleton = () => {
  return (
    <div class="w-full space-y-4" style={{'font-family': 'Figtree'}}>
      {/* Filter & Sort Skeleton */}
      <Skeleton>
        <div class="h-[60px] w-full bg-gray-200 rounded-lg"></div>
      </Skeleton>

      {/* Calendar Header Skeleton */}
      <div class="flex justify-between items-center mb-4">
        <Skeleton>
          <div class="h-[40px] w-[120px] bg-gray-200 rounded"></div>
        </Skeleton>
        <Skeleton>
          <div class="h-[40px] w-[200px] bg-gray-200 rounded"></div>
        </Skeleton>
        <Skeleton>
          <div class="h-[40px] w-[120px] bg-gray-200 rounded"></div>
        </Skeleton>
      </div>

      {/* Calendar Grid Skeleton */}
      <div class="grid grid-cols-7 gap-2">
        {/* Calendar Days Header */}
        {Array(7).fill(0).map(() => (
          <Skeleton>
            <div class="h-[30px] bg-gray-200 rounded"></div>
          </Skeleton>
        ))}
        
        {/* Calendar Cells */}
        {Array(35).fill(0).map(() => (
          <Skeleton>
            <div class="h-[120px] bg-gray-200 rounded">
              {/* Event Placeholder */}
              <div class="p-2">
                <div class="h-[20px] w-3/4 bg-gray-300 rounded mb-2"></div>
                <div class="h-[20px] w-1/2 bg-gray-300 rounded"></div>
              </div>
            </div>
          </Skeleton>
        ))}
      </div>
    </div>
  );
};

export const TeamCalendar: Component = () => {
  const { data } = useGithubData();

  return (
    <div class="max-w-7xl mx-auto" style={{'font-family': 'Figtree'}}>
       {data.loading ? (
         <div class="p-4">
           <CalendarSkeleton />
         </div>
       ) : (
         (() => {
           const currentData = data();
           return currentData?.issues && currentData?.members ? (
             <Calendar 
               issues={currentData.issues}
               members={currentData.members}
               projects={currentData.projects}
             />
           ) : null;
         })()
       )}
    </div>
  );
};

export default TeamCalendar;