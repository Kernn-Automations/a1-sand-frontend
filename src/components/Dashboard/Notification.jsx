import React from "react";
import {
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverRoot,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GrAnnounce } from "react-icons/gr";

const Notification = ({
  notifications = [],
  onItemClick,
  onMarkAllRead,
  emptyLabel = "No Notifications found",
}) => {
  function getTime(createdTime) {
    const currentTime = new Date();
    const notificationTime = new Date(createdTime); // Convert createdTime to Date object
    const diffInMs = currentTime - notificationTime; // Difference in milliseconds

    // Calculate time differences
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    return diffInWeeks > 0
      ? `${diffInWeeks}w ago`
      : diffInDays > 0
      ? `${diffInDays}d ago`
      : diffInHours > 0
      ? `${diffInHours}hr ago`
      : diffInMinutes > 0
      ? `${diffInMinutes}min ago`
      : `${diffInSeconds}sec ago`;
  }

  return (
    // <div className="notification-container">
    //   <button onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} className="notification-icon" >
    //   <i class="bi bi-bell"></i>
    //     {notifications && notifications.length > 0 && <span className="notbadge">{notifications.length}</span>}
    //   </button>
    //   {open && notifications && (
    //     <div className="notdropdown">
    //       <h5 className="noth5"><u>Notifications</u></h5>
    //       <ul className="notdropdown-list">
    //         {notifications.map((n) => (
    //           <li key={n.id} className="notdropdown-item">
    //             <h6>{n.title}</h6>
    //             <p>{getTime(n.createdAt)}</p>
    //           </li>
    //         ))}
    //       </ul>
    //       {notifications.length === 0 && <h6 className="emptynot">No Notifications found</h6>}
    //     </div>
    //   )}
    // </div>

    <PopoverRoot>
      <PopoverTrigger asChild>
        <button className="notification-icon">
          <GrAnnounce/>
          {notifications && notifications.length > 0 && (
            <span className="notbadge">{notifications.length}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent>
      <PopoverArrow className="notdropdown-color" />
          {notifications && (
             <PopoverBody className="notdropdown">
              <h5 className="noth5">
                <u>Notifications</u>
              </h5>
              <ul className="notdropdown-list">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="notdropdown-item"
                    onClick={() => onItemClick?.(n)}
                    style={{
                      cursor: onItemClick ? "pointer" : "default",
                      opacity: n.isRead ? 0.72 : 1,
                    }}
                  >
                    <h6 style={{ marginBottom: 4 }}>{n.title}</h6>
                    {n.message && (
                      <p style={{ margin: "0 0 6px 0", fontSize: 12 }}>
                        {n.message}
                      </p>
                    )}
                    <p>{getTime(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
              {notifications.length > 0 && onMarkAllRead && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  style={{
                    marginTop: 10,
                    border: "none",
                    background: "#0f3d8a",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Mark All Read
                </button>
              )}
              {notifications.length === 0 && (
                <h6 className="emptynot">{emptyLabel}</h6>
              )}
           </PopoverBody>
          )}
        
      </PopoverContent>
    </PopoverRoot>
  );
};

export default Notification;
