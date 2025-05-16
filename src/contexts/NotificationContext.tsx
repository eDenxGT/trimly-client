import { socket } from "@/lib/socket/socket";
import React, { createContext, useContext, useEffect, useState } from "react";
import { INotification } from "@/types/Notification";
import { useSelector } from "react-redux";
import { getCurrentUserDetails } from "@/utils/helpers/getCurrentUser";
import { IBarber, IClient } from "@/types/User";
import { getBarberNotifications } from "@/services/barber/barberService";
import { getNotificationsForClient } from "@/services/client/clientService";

type NotificationContextType = {
  notifications: INotification[];
  addNotification: (notif: INotification) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
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

  const user: IBarber | IClient | null = useSelector(getCurrentUserDetails);

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

  const addNotification = (notif: INotification) => {
    setNotifications((prev) => [notif, ...prev]);
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
    socket.on("receive-notification", (notif: INotification) => {
      addNotification({ ...notif, isRead: false });
    });

    return () => {
      socket.off("receive-notification");
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, addNotification, markAsRead, clearAll }}
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
