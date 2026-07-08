import type {Announcement} from "../types";
import AnnouncementCard from "./AnnouncementCard";

interface Props {
  announcements: Announcement[];
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (announcement: Announcement) => void;
}

export default function AnnouncementList({
  announcements,
  onArchive,
  onDelete,
  onEdit,
}: Props) {
  if (announcements.length === 0) {
    return (
      <div>
        <h3>No announcements found.</h3>
      </div>
    );
  }

  return (
    <div>
      {announcements.map((announcement) => (
        <AnnouncementCard
          key={announcement.announcement_id}
          announcement={announcement}
          onArchive={onArchive}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}