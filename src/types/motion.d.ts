declare module '@motionone/solid' {
  import { JSX } from 'solid-js'
  
  export interface MotionProps {
    initial?: any
    animate?: any
    exit?: any
    transition?: any
    children?: any
    style?: any
    class?: string
  }

  export interface PresenceProps {
    children?: any
  }

  export const Motion: (props: MotionProps) => JSX.Element
  export const Presence: (props: PresenceProps) => JSX.Element
} 