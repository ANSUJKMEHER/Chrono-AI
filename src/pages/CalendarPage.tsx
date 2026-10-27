import React from 'react';
import { CalendarView } from '../components/calendar/CalendarView';
import { Task } from '../types/task';

interface CalendarPageProps {
  onOpenTaskDetails: (task: Task) => void;
  onOpenAddModal: () => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onOpenTaskDetails,
  onOpenAddModal,
}) => {
  return (
    <div className="space-y-6">
      <CalendarView
        onOpenTaskDetails={onOpenTaskDetails}
        onOpenAddModal={onOpenAddModal}
      />
    </div>
  );
};
