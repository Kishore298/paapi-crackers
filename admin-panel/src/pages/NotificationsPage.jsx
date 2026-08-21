import React, { useEffect, useState } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import API from '../api/axios';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get(`/notifications?recipientType=admin`);
        setNotifications(data.data, data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchNotifications();
    }
  }, [user, setNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      markAsRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await API.put('/notifications/mark-all-read', { recipientType: 'admin' });
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error(error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8 text-center text-text-secondary">Loading notifications...</div>;
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell size={24} className="text-primary" /> Notifications
          </h1>
          <p className="text-text-secondary text-sm mt-1">View alerts and recent activities</p>
        </div>
        
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm font-medium text-primary hover:underline bg-primary/10 px-4 py-2 rounded-xl">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell size={32} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-text-primary">All caught up!</h3>
          <p className="text-text-secondary mt-1">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`bg-white rounded-xl p-4 shadow-sm border transition-all flex gap-4 ${notif.read ? 'border-border opacity-80' : 'border-primary/30 bg-primary/5'}`}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold text-sm truncate pr-4 ${notif.read ? 'text-text-primary' : 'text-primary'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[11px] font-medium text-text-secondary flex items-center gap-1 whitespace-nowrap">
                    <Clock size={12} /> {formatTimeAgo(notif.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">{notif.message}</p>
              </div>
              
              {!notif.read && (
                <button 
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center flex-shrink-0 text-text-secondary transition-colors"
                  title="Mark as read"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
