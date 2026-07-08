import { useEffect, useState } from "react";
import type {
  Announcement,
  AnnouncementCreate,
  AnnouncementUpdate,
} from "../types";

import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  Grid,
  Box,
} from "@mui/material";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import UpdateIcon from "@mui/icons-material/Update";

interface Props {
  selected?: Announcement | null;
  onSubmit: (
    data: AnnouncementCreate | AnnouncementUpdate
  ) => void;
}

export default function AnnouncementForm({
  selected,
  onSubmit,
}: Props) {
  const [postedBy, setPostedBy] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState("company");
  const [targetValue, setTargetValue] = useState("");
  const [ack, setAck] = useState(false);
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    if (selected) {
      setPostedBy(selected.posted_by);
      setTitle(selected.title);
      setBody(selected.body);
      setTargetType(selected.target_type);
      setTargetValue(selected.target_value ?? "");
      setAck(selected.requires_acknowledgement);
      setExpiry(selected.expiry_date ?? "");
    } else {
      setPostedBy("");
      setTitle("");
      setBody("");
      setTargetType("company");
      setTargetValue("");
      setAck(false);
      setExpiry("");
    }
  }, [selected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selected) {
      onSubmit({
        title,
        body,
        target_type: targetType,
        target_value: targetValue,
        requires_acknowledgement: ack,
        expiry_date: expiry || null,
      });
    } else {
      onSubmit({
        posted_by: postedBy,
        title,
        body,
        target_type: targetType,
        target_value: targetValue,
        requires_acknowledgement: ack,
        expiry_date: expiry || null,
      });
    }

    setPostedBy("");
    setTitle("");
    setBody("");
    setTargetType("company");
    setTargetValue("");
    setAck(false);
    setExpiry("");
  };

  // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
    <Paper
      elevation={5}
      sx={{
        p: 4,
        borderRadius: 3,
        mb: 4,
      }}
    >
      <Typography
  variant="h4"
  color="primary"
  gutterBottom
  sx={{ fontWeight: "bold" }}
>
        {selected
          ? "Update Announcement"
          : "Create Announcement"}
      </Typography>

      <Typography
        color="text.secondary"
        sx={{ mb: 3 }}
      >
        Fill in the details below to publish an announcement.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <Grid container spacing={3}>

          {!selected && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Posted By"
                fullWidth
                value={postedBy}
                onChange={(e) =>
                  setPostedBy(e.target.value)
                }
              />
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Title"
              fullWidth
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              label="Announcement Body"
              multiline
              rows={5}
              fullWidth
              value={body}
              onChange={(e) =>
                setBody(e.target.value)
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              label="Target Type"
              fullWidth
              value={targetType}
              onChange={(e) =>
                setTargetType(e.target.value)
              }
            >
              <MenuItem value="company">
                Company
              </MenuItem>

              <MenuItem value="team">
                Team
              </MenuItem>

              <MenuItem value="role">
                Role
              </MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              label="Target Value"
              fullWidth
              value={targetValue}
              onChange={(e) =>
                setTargetValue(e.target.value)
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
    label="Expiry Date"
    type="date"
    fullWidth
    value={expiry}
    onChange={(e) => setExpiry(e.target.value)}
    slotProps={{
        inputLabel: {
            shrink: true,
        },
    }}

            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={ack}
                  onChange={(e) =>
                    setAck(e.target.checked)
                  }
                />
              }
              label="Requires Acknowledgement"
            />
          </Grid>

          <Grid size={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={
                selected ? (
                  <UpdateIcon />
                ) : (
                  <AddCircleIcon />
                )
              }
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 2,
              }}
            >
              {selected
                ? "Update Announcement"
                : "Create Announcement"}
            </Button>
          </Grid>

        </Grid>
      </Box>
    </Paper>
  );
}