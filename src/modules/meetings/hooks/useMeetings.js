import { useMeetingsContext } from '../context/MeetingsContext';

/**
 * Pass projectId to get meetings scoped to that project,
 * or omit to get all meetings.
 */
export function useMeetings(projectId) {
  const { meetings, addMeeting, updateMeeting, deleteMeeting, getProjectMeetings } =
    useMeetingsContext();

  const scopedMeetings = projectId ? getProjectMeetings(projectId) : meetings;

  // Sorted chronologically
  const sorted = [...scopedMeetings].sort((a, b) => {
    const da = a.date + 'T' + (a.time || '00:00');
    const db = b.date + 'T' + (b.time || '00:00');
    return da.localeCompare(db);
  });

  return {
    meetings:    sorted,
    allMeetings: meetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
