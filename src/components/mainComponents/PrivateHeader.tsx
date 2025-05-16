import {
  Settings2,
  Menu,
  MapPin,
  User,
  LogOut,
  HelpCircle,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Button, IconButton, Tooltip } from "@mui/material";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { IAdmin, IBarber, IClient, UserDTO } from "@/types/User";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { getSmartDate } from "@/utils/helpers/timeFormatter";
import { useNotifications } from "@/contexts/NotificationContext";
interface HeaderProps {
  user: UserDTO | null;
  onSidebarToggle?: () => void;
  onLogout: () => void;
  className?: string;
}

export function PrivateHeader({
  user,
  onSidebarToggle,
  onLogout,
  className,
}: HeaderProps) {
  const navigate = useNavigate();

  const isClient = user?.role === "client";
  const isBarber = user?.role === "barber";

  const displayName = isBarber
    ? (user as IBarber)?.shopName
    : (user as IClient | IAdmin)?.fullName || "User";

  const initials = `${displayName?.trim().slice(0, 1) || ""}`;

  const locationName = (user as IBarber | IClient)?.location?.name;
  const settingsPath = isClient
    ? "/settings"
    : isBarber
    ? "/barber/settings"
    : "/admin/settings";
  const profilePath = isClient
    ? "/settings/profile"
    : isBarber
    ? "/barber/settings/profile"
    : "/admin/settings/profile";

  const notificationPath = isClient
    ? "/notifications"
    : "/barber/notifications";

  const { notifications } = useNotifications();

  const unreadCount = notifications.filter((notif) => !notif.isRead).length;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-16 border-b border-gray-700 bg-[#121212] shadow-md",
        className
      )}
    >
      <div className=" mx-auto justify-between flex h-full items-center px-4">
        {/* Hamburger menu button */}
        <div className="flex items-center">
          <Tooltip title="Toggle sidebar" arrow placement="bottom">
            <Button
              variant="text"
              sx={{
                minWidth: "auto",
                padding: "8px",
                color: "white",
                "&:hover": {
                  backgroundColor: "#2a2a2a",
                },
                "& .MuiButton-startIcon": {
                  margin: 0, // Fix padding issue in Edge
                },
              }}
              onClick={onSidebarToggle}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </Tooltip>

          {/* Logo */}
          <div className="ml-2 mr-8 flex items-center space-x-2">
            <img src="/logo.svg" alt="Logo" className="w-7 h-7" />
            <span className="text-xl font-young text-white">Trimly</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-8 flex items-center space-x-6">
          {/* User Info */}
          {(isClient || isBarber) && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium text-white">
                  {displayName}
                </span>
                <div className="flex items-center text-xs text-gray-400">
                  <MapPin className="mr-1 h-3 w-3" />
                  {locationName?.slice(0, 50) || "Location"}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <Tooltip title="Notifications" arrow placement="bottom">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <IconButton
                    sx={{
                      minWidth: "auto",
                      padding: "8px",
                      color: "white",
                      position: "relative",
                      "&:hover": {
                        backgroundColor: "#2a2a2a",
                      },
                    }}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </IconButton>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 bg-[#1e1e1e] text-white border-[#2a2a2a] shadow-lg p-0 overflow-hidden"
                  align="end"
                >
                  <div className="px-4 py-4 border-b border-[#2a2a2a]">
                    <h4 className="font-medium leading-none">Notifications</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      You have {unreadCount} unread{" "}
                      {unreadCount === 1 ? "notification" : "notifications"}
                    </p>
                  </div>

                  <div className="max-h-[350px] overflow-y-auto">
                    {notifications.slice(0, 5).map((notification, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          console.log(
                            `Notification clicked: ${notification.notificationId}`
                          )
                        }
                        className={cn(
                          "px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer border-b border-[#2a2a2a] last:border-b-0",
                          !notification.isRead && "bg-[#252525]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                              notification.isRead
                                ? "bg-gray-600"
                                : "bg-amber-500"
                            )}
                          >
                            <img
                              src="/logo.svg"
                              alt="Logo"
                              className="w-4 h-4"
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-sm",
                                !notification.isRead && "font-medium"
                              )}
                            >
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {getSmartDate(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    className="px-4 py-3 text-center border-t border-[#2a2a2a] text-sm font-medium text-amber-500 hover:bg-[#2a2a2a] cursor-pointer flex items-center justify-center"
                    onClick={() => navigate(notificationPath)}
                  >
                    View all notifications
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </Tooltip>

          {/* Avatar with Dropdown */}
          <Tooltip title="Account" arrow placement="bottom">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="cursor-pointer">
                    <Avatar className="h-8 w-8 ring-offset-amber-200 transition-colors hover:ring-2  hover:ring-offset-2">
                      <AvatarImage
                        className="object-cover hover:scale-110 transition-transform duration-200"
                        src={user?.avatar}
                        alt={displayName}
                      />
                      <AvatarFallback className="bg-[var(--yellow)] text-black">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-[#1e1e1e] text-white border-[#2a2a2a] shadow-lg"
                  align="end"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => navigate(profilePath)}
                      className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(settingsPath)}
                      className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white"
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-white">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-500 hover:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-white"
                    onClick={onLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
