declare namespace FullCalendar {
  interface Calendar {
    render(): void;
    destroy(): void;
    removeAllEvents(): void;
    addEventSource(source: any[]): void;
  }

  interface CalendarOptions {
    initialView?: string;
    headerToolbar?: {
      left?: string;
      center?: string;
      right?: string;
    };
    events?: any[];
    eventClick?: (info: any) => void;
    eventDidMount?: (info: any) => void;
    eventContent?: (arg: { event: { extendedProps: { assignees: never[]; status: string; }; title: string; }; }) => void;
    slotMinTime?: string;
    slotMaxTime?: string;
    allDaySlot?: boolean;
    allDayText?: string;
    editable?: boolean;
    selectable?: boolean;
    selectMirror?: boolean;
    displayEventTime?: boolean;
    displayEventEnd?: boolean;
    dayMaxEvents?: boolean;
    height?: string | number;
    businessHours?: {
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
    };
    weekends?: boolean;
    eventDurationEditable?: boolean;
    nextDayThreshold?: string;
    nowIndicator?: boolean;
    defaultTimedEventDuration?: string | null;
  }

  interface CalendarConstructor {
    new (element: HTMLElement, options?: CalendarOptions): Calendar;
  }
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  backgroundColor: string;
  extendedProps: {
    issue: GithubIssue;
    timeConfig: TimeConfig;
    status: string;
    assignees: Array<{
      login: string;
      avatar_url: string;
      assigned_at: string;
      is_primary: boolean;
    }>;
  };
  startRecur: string;
  endRecur: string;
  display: string;
  groupId: string;
  startTime?: string;
  endTime?: string;
}

interface Window {
  FullCalendar: {
    Calendar: FullCalendar.CalendarConstructor;
  };
}