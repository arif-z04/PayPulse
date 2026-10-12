import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  UserCheck,
  ChevronDown,
  Shield,
  Briefcase,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { INITIAL_USERS } from '@/mocks/mockData';
import { formatDate } from '@/utils/formatters';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenSearch }) => {
  const { user, logout, switchRole } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile hamburger & Global search trigger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/80 hover:bg-slate-200/60 rounded-lg border border-slate-200/60 transition-colors w-44 sm:w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Search anything...</span>
            <span className="sm:hidden">Search...</span>
          </div>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls: Demo Role Switcher, Notification center, User menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Switcher Pill */}
        <div className="relative" ref={roleMenuRef}>
          <button
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors"
            title="Preview as another role"
          >
            <Shield className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="hidden md:inline font-semibold text-slate-900">{user?.role}</span>
            <span className="md:hidden font-semibold text-slate-900 truncate max-w-[80px]">
              {user?.role.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Role Simulation
              </div>
              {INITIAL_USERS.map((u) => {
                const isSelected = user?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={async () => {
                      await switchRole(u.id);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-brand-50/60 font-semibold text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-900">{u.fullName}</p>
                      <p className="text-[10px] text-slate-500">{u.role}</p>
                    </div>
                    {isSelected && <UserCheck className="w-4 h-4 text-brand-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">System Notifications</h4>
                  <p className="text-[10px] text-slate-500">{unreadCount} unread message(s)</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications available</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          navigate(n.link);
                          setNotifMenuOpen(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors flex items-start gap-2.5 ${
                        !n.isRead ? 'bg-brand-50/30' : ''
                      }`}
                    >
                      <div
                        className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                          !n.isRead ? 'bg-brand-500' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800 truncate">{n.title}</p>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatDate(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-semibold text-slate-800 leading-tight">{user?.fullName}</div>
              <div className="text-[10px] text-slate-500 leading-tight">{user?.departmentName || 'Enterprise'}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <div className="py-1">
                {user?.employeeId && (
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/employees/${user.employeeId}`);
                      setUserMenuOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    My Employee Profile
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
