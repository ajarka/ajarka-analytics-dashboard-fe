import { onMount, onCleanup, createSignal, createEffect } from 'solid-js';
import { GithubIssue } from '../../types/github';
import { VStack, Spinner, Text, Button } from "@hope-ui/solid";
import { getAdditionalAssignees } from '../../utils/issueUtils';

interface FullCalendarProps {
  issues: GithubIssue[];
  onEventClick?: (info: any) => void;
  // Tambahkan props untuk mendapatkan warna dan status
  getStatusColor: (status: string) => string;
  getIssueStatus: (issue: GithubIssue) => string;
}

interface TimeConfig {
  start: string;  // format "HH:mm"
  end: string;    // format "HH:mm"
  isFullDay: boolean;
}

const FullCalendarWrapper = (props: FullCalendarProps) => {
  let calendarEl: HTMLDivElement | undefined;
  let calendar: any;
  const [isLoading, setIsLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  // Debug logging
  props.issues.forEach(issue => {
    if (issue.assignee && issue.assignee.login === 'aditira' && issue.body?.includes('calendar')) {
      console.log("Issue: ", issue);
    }
  });

  const getAllAssignees = (issue: GithubIssue) => {
    const additionalAssignees = getAdditionalAssignees(issue.comments);
    const mainAssignee = issue.assignee ? [{
      login: issue.assignee.login,
      avatar_url: issue.assignee.avatar_url,
      assigned_at: issue.created_at,
      is_primary: true
    }] : [];

    return [...mainAssignee, ...additionalAssignees];
  };

  const parseTimeFromBody = (body: string | null): TimeConfig => {
    if (!body) {
      return {
        start: '00:00',
        end: '23:59',
        isFullDay: true
      };
    }

    // Support both formats:
    // 1. time: HH:MM-HH:MM    -> Specific time range
    // 2. time: full-day       -> Full day event
    // Also support with or without markdown headers
    const timeFormats = [
      /time:\s*((?:\d{2}:\d{2}-\d{2}:\d{2})|full-day)/i,  // Original format
      /### Time Configuration\s*\ntime:\s*((?:\d{2}:\d{2}-\d{2}:\d{2})|full-day)/i  // Markdown header format
    ];

    // Try each format
    for (const regex of timeFormats) {
      const match = regex.exec(body);
      if (match) {
        const timeValue = match[1].toLowerCase();
        if (timeValue === 'full-day') {
          return {
            start: '00:00',
            end: '23:59',
            isFullDay: true
          };
        }

        const [start, end] = timeValue.split('-');
        return {
          start,
          end,
          isFullDay: false
        };
      }
    }

    // If no time format is found, return default full-day config
    return {
      start: '00:00',
      end: '23:59',
      isFullDay: true
    };
  };

  const transformIssues = () => {
    return props.issues.map(issue => {
      const timeConfig = parseTimeFromBody(issue.body)
      const assignees = getAllAssignees(issue);

      if (!issue.start_date) {
        console.log("Skipping issue due to missing start_date:", issue.number);
        return null;
      }

      const formatDate = (date: string) => {
        if (!date) return null;
        if (timeConfig.isFullDay) {
          return date;
        }
        return `${date}T${timeConfig.start}`;
      };

      const formatEndDate = (date: string) => {
        if (!date) return null;

        if (timeConfig.isFullDay) {
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          return endDate.toISOString().split('T')[0];
        }

        return `${date}T${timeConfig.end}`;
      };

      // Dapatkan status dan warna berdasarkan status project
      const status = props.getIssueStatus(issue);
      const statusColor = props.getStatusColor(status);

      const event: CalendarEvent = {
        id: `${issue.repository.name}-${issue.number}`,
        title: issue.title,
        start: formatDate(issue.start_date),
        end: formatEndDate(issue.due_date ?? issue.start_date),
        allDay: timeConfig.isFullDay,
        backgroundColor: statusColor,  // Gunakan warna status
        extendedProps: {
          issue: issue,
          timeConfig,
          assignees,
          status: status  // Tambahkan status ke extendedProps
        },
        startRecur: issue.start_date,
        endRecur: issue.due_date ?? issue.start_date,
        display: timeConfig.isFullDay ? 'block' : 'auto',
        groupId: `${issue.repository.name}-${issue.number}`
      };

      if (!timeConfig.isFullDay) {
        event.startTime = timeConfig.start;
        event.endTime = timeConfig.end;
      }

      return event;
    }).filter(event => event !== null);
  };

  const initializeCalendar = async () => {
    if (!calendarEl) return;

    try {
      if (typeof window.FullCalendar === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (typeof window.FullCalendar === 'undefined') {
        throw new Error('FullCalendar failed to load');
      }

      calendar = new window.FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: transformIssues(),
        eventClick: info => {
          if (props.onEventClick) {
            props.onEventClick(info);
          }
        },
        eventDidMount: info => {
          const timeConfig = info.event.extendedProps.timeConfig;
          const status = info.event.extendedProps.status;
          
          let tooltipText = `${info.event.title}\n`;
          tooltipText += `Status: ${status}\n`;
          
          if (timeConfig.isFullDay) {
            tooltipText += 'Full Day Event';
          } else {
            tooltipText += `${timeConfig.start} - ${timeConfig.end}`;
          }
          info.el.title = tooltipText;
          
          // Optional: Tambahkan kelas CSS berdasarkan status
          const statusClass = `fc-event-status-${status.replace(/\s+/g, '-')}`;
          info.el.classList.add(statusClass);
        },
        slotMinTime: '00:00:00',
        slotMaxTime: '23:59:59',
        allDaySlot: true,
        allDayText: 'all-day',
        dayMaxEvents: true,
        editable: false,
        selectable: true,
        selectMirror: true,
        displayEventTime: true,        
        displayEventEnd: true, 
        businessHours: {
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          startTime: '08:00',
          endTime: '18:00',
        },
        weekends: true,
        height: '100%',
        eventDurationEditable: false,
        nextDayThreshold: '00:00:00',
        nowIndicator: true, 
        defaultTimedEventDuration: '01:00:00', 
        eventContent: (arg: { event: { extendedProps: { assignees: never[]; status: string; }; title: string; }; }) => {
          const assignees = arg.event.extendedProps.assignees || [];
          const status = arg.event.extendedProps.status;

          // Buat container untuk event
          const container = document.createElement('div');
          container.className = 'fc-event-main-container';

          // Tambahkan badge status
          const statusBadge = document.createElement('div');
          statusBadge.className = 'fc-event-status-badge';
          statusBadge.style.cssText = `
              display: inline-block;
              border-radius: 9999px;
              font-size: 10px;
              padding: 2px 6px;
              margin-bottom: 4px;
              color: white;
              background-color: ${props.getStatusColor(status)};
            `;
          statusBadge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
          container.appendChild(statusBadge);

          // Tambahkan title
          const title = document.createElement('div');
          title.className = 'fc-event-title';
          title.innerHTML = arg.event.title;
          container.appendChild(title);

          // Buat container untuk avatars
          const avatarsContainer = document.createElement('div');
          avatarsContainer.className = 'fc-event-avatars';
          avatarsContainer.style.cssText = `
              display: flex;
              gap: 2px;
              margin-top: 4px;
              margin-left: 4px;
            `;

          // Tambahkan style ke head dokumen jika belum ada
          if (!document.getElementById('calendar-avatar-styles')) {
            const style = document.createElement('style');
            style.id = 'calendar-avatar-styles';
            style.textContent = `
                .fc-event-avatar {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
                  position: relative;
                }
                .fc-event-avatar[data-primary="true"] {
                  border-color: #3B82F6;
                }
                .fc-event-avatar-tooltip {
                  position: absolute;
                  background: #1F2937;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  bottom: 100%;
                  left: 50%;
                  transform: translateX(-50%);
                  white-space: nowrap;
                  opacity: 0;
                  visibility: hidden;
                  transition: all 0.2s;
                  z-index: 1000;
                }
                .fc-event-avatar:hover .fc-event-avatar-tooltip {
                  opacity: 1;
                  visibility: visible;
                }
                .fc-event-status-badge {
                  font-weight: 500;
                  display: inline-block;
                }
              `;
            document.head.appendChild(style);
          }

          // Tambahkan avatars (maksimal 3)
          assignees.slice(0, 3).forEach((assignee: any) => {
            const avatarContainer = document.createElement('div');
            avatarContainer.className = 'fc-event-avatar';
            avatarContainer.setAttribute('data-primary', assignee.is_primary ? 'true' : 'false');

            const avatar = document.createElement('img');
            avatar.src = assignee.avatar_url;
            avatar.alt = assignee.login;
            avatar.style.cssText = `
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
              `;

            const tooltip = document.createElement('div');
            tooltip.className = 'fc-event-avatar-tooltip';
            tooltip.textContent = assignee.login;

            avatarContainer.appendChild(avatar);
            avatarContainer.appendChild(tooltip);
            avatarsContainer.appendChild(avatarContainer);
          });

          // Tambahkan indikator jika ada lebih banyak assignee
          if (assignees.length > 3) {
            const moreContainer = document.createElement('div');
            moreContainer.className = 'fc-event-avatar';
            moreContainer.style.cssText = `
                background: #E5E7EB;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #4B5563;
              `;
            moreContainer.textContent = `+${assignees.length - 3}`;

            const tooltip = document.createElement('div');
            tooltip.className = 'fc-event-avatar-tooltip';
            tooltip.textContent = assignees.slice(3).map((a: any) => a.login).join(', ');

            moreContainer.appendChild(tooltip);
            avatarsContainer.appendChild(moreContainer);
          }

          container.appendChild(avatarsContainer);
          return { domNodes: [container] };
        }
      });

      calendar.render();
      setIsLoading(false);
    } catch (err) {
      console.error('Error initializing calendar:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar');
      setIsLoading(false);
    }
  };

  onMount(() => {
    initializeCalendar();
  });

  createEffect(() => {
    if (calendar && props.issues) {
      calendar.removeAllEvents();
      calendar.addEventSource(transformIssues());
    }
  });

  onCleanup(() => {
    if (calendar) {
      calendar.destroy();
    }
  });

  return (
    <VStack spacing="$2" h="57vh" w="100%" position="relative">
      {isLoading() && (
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          spacing="$4"
          zIndex="1"
        >
          <Spinner size="lg" />
          <Text>Loading calendar...</Text>
        </VStack>
      )}

      {error() && (
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          spacing="$4"
          zIndex="1"
        >
          <Text color="$danger9">Error: {error()}</Text>
          <Button
            colorScheme="primary"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              initializeCalendar();
            }}
          >
            Retry
          </Button>
        </VStack>
      )}

      <div
        ref={calendarEl}
        style={{
          height: '100%',
          width: '100%',
          opacity: isLoading() ? '0.5' : '1'
        }}
      />
    </VStack>
  );
};

export default FullCalendarWrapper;