import { socket } from "@/lib/socket/socket";
import React, { createContext, useContext, useEffect, useState } from "react";
import { INotification } from "@/types/Notification";
import { useSelector } from "react-redux";
import { getCurrentUserDetails } from "@/utils/helpers/getCurrentUser";
import { IBarber, IClient } from "@/types/User";
import { getBarberNotifications } from "@/services/barber/barberService";
import { getNotificationsForClient } from "@/services/client/clientService";
import { useToaster } from "@/hooks/ui/useToaster";

type NotificationContextType = {
  notifications: INotification[];
  addNotification: (notification: INotification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const user: IBarber | IClient | null = useSelector(getCurrentUserDetails);
  const { notifyToast } = useToaster();

  const getNotifications = () => {
    if (user) {
      if (user.role === "barber") {
        getBarberNotifications().then((data) => {
          setNotifications(data.notifications);
        });
      } else if (user.role === "client") {
        getNotificationsForClient().then((data) => {
          setNotifications(data.notifications);
        });
      }
    }
  };

  useEffect(() => {
    getNotifications();
  }, []);

  useEffect(() => {
    const unreadCount = notifications.filter(
      (notification) => !notification.isRead
    ).length;
    setUnreadCount(unreadCount);
  }, [notifications]);

  const addNotification = (notification: INotification) => {
    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  useEffect(() => {
    socket.on("receive-notification", (notification: INotification) => {
      addNotification({ ...notification, isRead: false });
      notifyToast(notification);
    });

    return () => {
      socket.off("receive-notification");
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAsRead, clearAll, unreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context)
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  return context;
};
