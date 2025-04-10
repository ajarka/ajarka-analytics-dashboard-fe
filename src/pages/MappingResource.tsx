import { Component } from 'solid-js';
import { VStack, Spinner, Text } from '@hope-ui/solid';
import { useGithubData } from '../hooks/useGithubData';   
import MappingTopology from '../components/MappingResource/MappingTopology';

export const MappingResource: Component = () => {
    const {
        data,
        view,
        setView,
        memberDetailedStats,
        overallStats
    } = useGithubData();

  return (
    <div  style={{'font-family': 'Figtree'}}>
      {data.loading ? (
        <div class="flex items-center justify-center h-full">
          <Spinner size="xl" />
        </div>
      ) : (
        (() => {
          const currentData = data();
          return currentData?.issues && currentData?.members ? (
            <MappingTopology  
                members={memberDetailedStats()}
                projects={currentData.projects} 
            />
          ) : (
            <div class="flex items-center justify-center h-full">
              <Text>No data available</Text>
            </div>
          );
        })()
      )}
    </div>
  );
};

export default MappingResource;