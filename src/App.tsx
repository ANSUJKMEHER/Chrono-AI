import React, { useState } from 'react';
import { TaskProvider } from './context/TaskContext';
import { ToastProvider } from './components/common/Toast';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { InboxPage } from './pages/InboxPage';
import { PlansPage } from './pages/PlansPage';
import { CompletedPage } from './pages/CompletedPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <ToastProvider>
      <TaskProvider>
        <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
          {({ searchQuery, onOpenTaskDetails, onOpenAddModal }) => {
            switch (activeTab) {
              case 'calendar':
                return (
                  <CalendarPage
                    onOpenTaskDetails={onOpenTaskDetails}
                    onOpenAddModal={onOpenAddModal}
                  />
                );
              case 'inbox':
                return <InboxPage onOpenAddModal={onOpenAddModal} />;
              case 'plans':
                return (
                  <PlansPage
                    onOpenTaskDetails={onOpenTaskDetails}
                    onOpenAddModal={onOpenAddModal}
                  />
                );
              case 'completed':
                return (
                  <CompletedPage
                    onOpenTaskDetails={onOpenTaskDetails}
                    searchQuery={searchQuery}
                  />
                );
              case 'settings':
                return <SettingsPage />;
              case 'dashboard':
              default:
                return (
                  <DashboardPage
                    onOpenTaskDetails={onOpenTaskDetails}
                    onOpenAddModal={onOpenAddModal}
                    searchQuery={searchQuery}
                  />
                );
            }
          }}
        </AppLayout>
      </TaskProvider>
    </ToastProvider>
  );
};

export default App;
