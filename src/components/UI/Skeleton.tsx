import { Component } from 'solid-js';

interface SkeletonProps {
  class?: string;
  height?: string;
  width?: string;
}

export const Skeleton: Component<SkeletonProps> = (props) => {
  return (
    <div 
      class={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${props.class || ''}`}
      style={{
        height: props.height || '1rem',
        width: props.width || '100%'
      }}
    />
  );
}; 