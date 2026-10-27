import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { DeadlineInputModal } from '../ai/DeadlineInputModal';
import { TaskDetailsModal } from '../tasks/TaskDetailsModal';
import { Task } from '../../types/task';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: (props: {
    searchQuery: string;
    onOpenTaskDetails: (task: Task) => void;
    onOpenAddModal: () => void;
  }) => React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        setIsOpenMobile={setIsMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen flex-1">
        <Topbar
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children({
            searchQuery,
            onOpenTaskDetails: (t: Task) => setSelectedTask(t),
            onOpenAddModal: () => setIsAddModalOpen(true),
          })}
        </main>
      </div>

      {/* Persistent AI Deadline Extractor Modal */}
      {isAddModalOpen && (
        <DeadlineInputModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Task Details & Preparation Editor Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};
