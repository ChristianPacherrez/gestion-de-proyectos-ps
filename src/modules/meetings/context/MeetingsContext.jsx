import { createContext, useContext, useState, useEffect } from 'react';
import { load, save } from '../../../utils/storage';

// ─── Context ──────────────────────────────────────────────────────────────────
const MeetingsContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function MeetingsProvider({ children }) {
  const [meetings, setMeetings] = useState(() => load('meetings', []));

  useEffect(() => {
    save('meetings', meetings);
  }, [meetings]);

  function addMeeting(meeting) {
    setMeetings((prev) => [meeting, ...prev]);
  }

  function updateMeeting(id, changes) {
    setMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...changes } : m))
    );
  }

  function deleteMeeting(id) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  function getProjectMeetings(projectId) {
    return meetings.filter((m) => m.projectId === projectId);
  }

  const value = { meetings, addMeeting, updateMeeting, deleteMeeting, getProjectMeetings };

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useMeetingsContext() {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetingsContext must be inside <MeetingsProvider>');
  return ctx;
}
