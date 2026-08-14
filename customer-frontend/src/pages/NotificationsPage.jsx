import React, { useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import useNotificationStore from '../store/notificationStore';
import useAuthStore from '../store/authStore';
import API from '../api/axios';

const NotificationsPage = () => {
  const { notifications, setNotifications, markAsRead, markAllAsRead, unreadCount } = useNotificationStore();
  const { customer } = useAuthStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await API.get(`/notifications?recipientType=Customer&recipientId=${customer._id}`);
        setNotifications(data.data, data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };

    if (customer?._id) {
      fetchNotifications();
    }
  }, [customer, setNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      markAsRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!customer) return;
    try {
      await API.put('/notifications/mark-all-read', { recipientType: 'Customer', recipientId: customer._id });
      markAllAsRead();
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

  if (!customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Bell size={48} className="text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-text-primary mb-2">Login Required</h2>
        <p className="text-text-secondary">Please identify yourself in "My Orders" to see your notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Bell size={24} className="text-primary" /> Notifications
        </h1>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="text-sm font-medium text-primary hover:underline">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 card">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary">All caught up!</h3>
          <p className="text-text-secondary mt-1">You don't have any notifications right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`card p-4 transition-all flex gap-4 ${notif.read ? 'bg-white opacity-80' : 'bg-primary-lighter/30 border-primary/20'}`}
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-semibold text-sm ${notif.read ? 'text-text-primary' : 'text-primary'}`}>
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-text-secondary flex items-center gap-1">
                    <Clock size={10} /> {formatTimeAgo(notif.createdAt)}
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
