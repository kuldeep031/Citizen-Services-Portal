import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  Home,
  FileText,
  Search,
  Shield,
  LayoutDashboard,
  Bell,
  User,
  Menu,
  X,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import { api } from '../../lib/api';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { UserRole } from '../../auth';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const navConfig: Record<UserRole, { titleKey: string; items: { path: string; labelKey: string; icon: typeof Home }[] }[]> = {
  citizen: [
    {
      titleKey: 'nav.citizenServices',
      items: [
        { path: '/citizen', labelKey: 'nav.dashboard', icon: Home },
        { path: '/citizen/submit-complaint', labelKey: 'nav.submitComplaint', icon: FileText },
        { path: '/citizen/track-application', labelKey: 'nav.trackApplication', icon: Search },
      ],
    },
  ],
  officer: [
    {
      titleKey: 'nav.officerPanel',
      items: [
        { path: '/officer', labelKey: 'nav.dashboard', icon: Shield },
      ],
    },
  ],
  admin: [
    {
      titleKey: 'nav.administration',
      items: [
        { path: '/admin', labelKey: 'nav.dashboard', icon: LayoutDashboard },
        { path: '/admin/complaints', labelKey: 'nav.manageComplaints', icon: FileText },
      ],
    },
  ],
};

export function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  useEffect(() => {
    api.get<{ notifications: NotificationItem[]; unreadCount: number }>('notifications')
      .then((res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      })
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`notifications/${id}/read`, {});
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const sections = navConfig[user.role] ?? [];

  const isActive = (path: string) => {
    if (path === `/citizen` || path === '/officer' || path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const NavSection = ({ titleKey, items }: { titleKey: string; items: typeof navConfig.citizen[0]['items'] }) => (
    <div className="mb-8" role="group" aria-label={t(titleKey)}>
      <p className="px-3 mb-3 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest">
        {t(titleKey)}
      </p>
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-lg transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">Skip to main content</a>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[272px] bg-sidebar transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-5 h-5 text-sidebar-primary-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-sidebar-foreground leading-tight">{t('header.portalName')}</p>
                <p className="text-[11px] text-sidebar-foreground/60 mt-0.5 capitalize">{user.role} {t('header.panel')}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors rounded-lg"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 pt-6 pb-4 overflow-y-auto">
            {sections.map((section) => (
              <NavSection key={section.titleKey} titleKey={section.titleKey} items={section.items} />
            ))}
          </nav>

          {/* User Profile + Logout */}
          <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
            <Link
              to={`/${user.role}/profile`}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 transition-colors"
            >
              <div className="w-9 h-9 bg-sidebar-primary/80 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-sidebar-primary-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-[11px] text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </Link>
            <Link
              to="/change-password"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <KeyRound className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">Change Password</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 min-h-[44px] rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm">{t('header.signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[272px]">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground hover:text-primary transition-colors rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                  aria-label={`View notifications (${unreadCount} unread)`}
                  aria-expanded={notifOpen}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden" role="menu">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-card-foreground">{t('header.notifications')}</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[12px] text-primary font-medium hover:underline"
                        >
                          {t('header.markAllRead')}
                        </button>
                      )}
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && handleMarkRead(n.id)}
                            className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 transition-colors ${!n.isRead ? 'bg-primary/5' : ''}`}
                            role="menuitem"
                          >
                            <div className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-primary' : 'bg-transparent'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-card-foreground">{
                                  n.title === 'Complaint Submitted' ? t('notifications.complaintSubmitted') :
                                  n.title === 'Status Updated' ? t('notifications.statusUpdated') :
                                  n.title === 'New Assignment' ? t('notifications.newAssignment') :
                                  n.title === 'Officer Assigned' ? t('notifications.officerAssigned') :
                                  n.title
                                }</p>
                                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                                <time className="text-[11px] text-muted-foreground/60 mt-1 block">
                                  {new Date(n.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </time>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-muted-foreground">{t('header.noNotifications')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden sm:flex items-center gap-2.5 ml-2 pl-3 border-l border-border">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
