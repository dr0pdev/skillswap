import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyCalendar({ userId }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Fetch sessions for the current month
  useEffect(() => {
    if (!userId) return;

    const fetchSessions = async () => {
      try {
        setLoading(true);
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('scheduled_sessions')
          .select(`
            id,
            session_date,
            start_time,
            end_time,
            duration_minutes,
            status,
            teacher_user_id,
            learner_user_id,
            skill_id,
            skills (name)
          `)
          .or(`teacher_user_id.eq.${userId},learner_user_id.eq.${userId}`)
          .gte('session_date', startDate)
          .lte('session_date', endDate)
          .eq('status', 'scheduled');

        if (error) throw error;

        // Transform data into event format
        const events = data?.map(session => {
          const isTeaching = session.teacher_user_id === userId;
          return {
            id: session.id,
            title: session.skills?.name || 'Session',
            date: session.session_date,
            startTime: session.start_time,
            endTime: session.end_time,
            duration: session.duration_minutes,
            type: isTeaching ? 'teaching' : 'learning',
            hours: session.duration_minutes / 60,
          };
        }) || [];

        setSessions(events);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('calendar-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduled_sessions',
        },
        () => {
          fetchSessions(); // Refetch on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, year, month]);

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [year, month, firstDayOfMonth, daysInMonth]);

  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getSessionsForDay = (day) => {
    if (!day) return [];
    const dateStr = day.toISOString().split('T')[0];
    return sessions.filter(event => event.date === dateStr);
  };

  const { teachingHours, learningHours, totalAllocated } = useMemo(() => {
    let th = 0;
    let lh = 0;
    sessions.forEach(event => {
      if (event.type === 'teaching') th += event.hours;
      if (event.type === 'learning') lh += event.hours;
    });
    return { teachingHours: th, learningHours: lh, totalAllocated: th + lh };
  }, [sessions]);

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToPreviousMonth} className="btn-icon-sm" type="button">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-dark-100">
          {monthNames[month]} {year}
        </h2>
        <button onClick={goToNextMonth} className="btn-icon-sm" type="button">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4 p-3 bg-dark-800/50 border border-dark-700 rounded-lg">
        <div>
          <p className="text-dark-400">Teaching</p>
          <p className="font-semibold text-primary-400">{teachingHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-dark-400">Learning</p>
          <p className="font-semibold text-accent-400">{learningHours.toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-dark-400">Total</p>
          <p className="font-semibold text-dark-100">{totalAllocated.toFixed(1)}h</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-dark-400 mb-2">
            {daysOfWeek.map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isToday = day && day.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg p-1 text-sm relative
                    ${day ? 'bg-dark-800/50 border border-dark-700 hover:bg-dark-800 transition-colors' : 'bg-dark-900/30'}
                    ${isToday ? 'ring-2 ring-primary-600' : ''}
                  `}
                >
                  {day && (
                    <>
                      <span className="text-dark-200 font-medium block mb-1">{day.getDate()}</span>
                      <div className="space-y-0.5">
                        {daySessions.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`
                              text-[9px] px-1.5 py-0.5 rounded-md truncate
                              ${event.type === 'teaching' 
                                ? 'bg-primary-950/50 text-primary-300 border border-primary-800/30' 
                                : 'bg-accent-950/50 text-accent-300 border border-accent-800/30'
                              }
                            `}
                            title={`${event.title} (${event.startTime} - ${event.endTime})`}
                          >
                            {event.startTime.slice(0, 5)} • {event.title.slice(0, 8)}
                          </div>
                        ))}
                        {daySessions.length > 3 && (
                          <div className="text-[8px] text-dark-500 text-center">
                            +{daySessions.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary-950/50 border border-primary-800/30"></div>
          <span className="text-dark-400">Teaching</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent-950/50 border border-accent-800/30"></div>
          <span className="text-dark-400">Learning</span>
        </div>
      </div>
    </div>
  );
}
