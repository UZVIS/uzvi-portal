import type { Announcement } from "../types";

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArchiveIcon from "@mui/icons-material/Archive";
import CampaignIcon from "@mui/icons-material/Campaign";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";

interface Props {
  announcement: Announcement;
  onArchive: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (announcement: Announcement) => void;
}

export default function AnnouncementCard({
  announcement,
  onArchive,
  onDelete,
  onEdit,
}: Props) {
  return (
    <Card
      elevation={4}
      sx={{
        mb: 3,
        borderRadius: 3,
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 8,
        },
      }}
    >
      <CardContent>

       <Stack
  direction="row"
  sx={{
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold" }}
            color="primary"
          >
            <CampaignIcon
              sx={{
                mr: 1,
                verticalAlign: "middle",
              }}
            />
            {announcement.title}
          </Typography>

          <Chip
            label={
              announcement.archived
                ? "Archived"
                : "Active"
            }
            color={
              announcement.archived
                ? "error"
                : "success"
            }
          />
        </Stack>

        <Typography
          variant="body1"
          sx={{
            mt: 2,
            mb: 2,
          }}
        >
          {announcement.body}
        </Typography>

        <Stack spacing={1}>

          <Typography>
            <PersonIcon
              sx={{
                mr: 1,
                fontSize: 18,
                verticalAlign: "middle",
              }}
            />
            <strong>Posted By:</strong>{" "}
            {announcement.posted_by}
          </Typography>

          <Typography>
            <GroupsIcon
              sx={{
                mr: 1,
                fontSize: 18,
                verticalAlign: "middle",
              }}
            />
            <strong>Target:</strong>{" "}
            {announcement.target_type}
          </Typography>

          <Typography>
            <CalendarMonthIcon
              sx={{
                mr: 1,
                fontSize: 18,
                verticalAlign: "middle",
              }}
            />
            <strong>Expiry:</strong>{" "}
            {announcement.expiry_date ?? "No Expiry"}
          </Typography>

          <Typography>
            <strong>Acknowledgement:</strong>{" "}
            {announcement.requires_acknowledgement
              ? "Required"
              : "Not Required"}
          </Typography>

        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent: "flex-end",
          p: 2,
        }}
      >
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(announcement)}
        >
          Edit
        </Button>

        {!announcement.archived && (
          <Button
            color="warning"
            variant="contained"
            startIcon={<ArchiveIcon />}
            onClick={() =>
              onArchive(
                announcement.announcement_id
              )
            }
          >
            Archive
          </Button>
        )}

        <Button
          color="error"
          variant="contained"
          startIcon={<DeleteIcon />}
          onClick={() =>
            onDelete(
              announcement.announcement_id
            )
          }
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}