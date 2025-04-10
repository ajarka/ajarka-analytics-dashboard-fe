declare module '@motionone/solid' {
  import { JSX } from 'solid-js'
  
  export interface MotionProps {
    animate?: Record<string, any>
    transition?: {
      duration?: number
      repeat?: number | boolean
      ease?: string | number[]
      delay?: number
    }
    class?: string
    style?: JSX.CSSProperties
    children?: JSX.Element
  }

  export interface PresenceProps {
    children?: any
  }

  export const Motion: (props: MotionProps) => JSX.Element
  export const Presence: (props: PresenceProps) => JSX.Element
} 