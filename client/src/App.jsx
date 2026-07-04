import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AuthWrapper } from './components/Auth/AuthWrapper';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { UserSearchModal } from './components/Modals/UserSearchModal';
import { GroupCreationModal } from './components/Modals/GroupCreationModal';
import { GroupInfoPanel } from './components/Modals/GroupInfoPanel';
import { ProfileSettingsModal } from './components/Modals/ProfileSettingsModal';
import { AdminDashboardModal } from './components/Admin/AdminDashboardModal';
import { NotificationToast } from './components/UI/NotificationToast';
import { useSocket } from './hooks/useSocket';

export function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Connect Socket.IO
  useSocket();

  if (!isAuthenticated) {
    return <AuthWrapper />;
  }

  return (
    <div className="flex h-screen w-full max-w-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative box-border">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Chat Feed Window */}
      <ChatWindow />

      {/* Modals & Overlay Drawers */}
      <UserSearchModal />
      <GroupCreationModal />
      <GroupInfoPanel />
      <ProfileSettingsModal />
      <AdminDashboardModal />

      {/* Floating Notifications */}
      <NotificationToast />
    </div>
  );
}

export default App;
