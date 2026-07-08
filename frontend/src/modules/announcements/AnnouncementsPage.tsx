import { useEffect, useState } from "react";

import type {
    Announcement,
    AnnouncementCreate,
    AnnouncementUpdate,
} from "./types";

import {
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  archiveAnnouncement,
  getAnnouncements,
  getDashboardSummary,
} from "./api";

import AnnouncementForm from "./components/AnnouncementForm";
import AnnouncementList from "./components/AnnouncementList";
import DashboardSummary from "./components/DashboardSummary";

export default function AnnouncementsPage() {

  const [announcements, setAnnouncements] =
    useState<Announcement[]>([]);

  const [summary, setSummary] = useState<any>(null);

  const [selected, setSelected] =
    useState<Announcement | null>(null);

  const loadAnnouncements = async () => {

    const response = await getAnnouncements();

    setAnnouncements(response.items);
  };

  const loadSummary = async () => {

    const data = await getDashboardSummary();

    setSummary(data);
  };

  useEffect(() => {

    loadAnnouncements();

    loadSummary();

  }, []);

  const handleCreateOrUpdate = async (

    data: AnnouncementCreate | AnnouncementUpdate

  ) => {

    if (selected) {

      await updateAnnouncement(

        selected.announcement_id,

        data as AnnouncementUpdate

      );

      setSelected(null);

    } else {

      await createAnnouncement(

        data as AnnouncementCreate

      );

    }

    loadAnnouncements();

    loadSummary();
  };

  const handleDelete = async (

    id: number

  ) => {

    await deleteAnnouncement(id);

    loadAnnouncements();

    loadSummary();
  };

  const handleArchive = async (

    id: number

  ) => {

    await archiveAnnouncement(id);

    loadAnnouncements();

    loadSummary();
  };

  return (

    <div
      style={{
        maxWidth: 1000,
        margin: "40px auto",
      }}
    >

      <h1>Announcements</h1>

      <DashboardSummary
        summary={summary}
      />

      <AnnouncementForm
        selected={selected}
        onSubmit={handleCreateOrUpdate}
      />

      <hr />

      <AnnouncementList
        announcements={announcements}
        onArchive={handleArchive}
        onDelete={handleDelete}
        onEdit={setSelected}
      />

    </div>

  );
}