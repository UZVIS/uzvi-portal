import type { DashboardSummary as Summary } from "../types";

import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
} from "@mui/material";

import CampaignIcon from "@mui/icons-material/Campaign";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

interface Props {
  summary: Summary | null;
}

export default function DashboardSummary({
  summary,
}: Props) {
  if (!summary) return null;

  const cards = [
    {
      title: "Total Announcements",
      value: summary.total,
      color: "#1976d2",
      icon: <CampaignIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Active",
      value: summary.active,
      color: "#2e7d32",
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Archived",
      value: summary.archived,
      color: "#ef6c00",
      icon: <ArchiveIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Need Acknowledgement",
      value: summary.requires_acknowledgement,
      color: "#8e24aa",
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 40 }} />,
    },
  ];

  // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {cards.map((card) => (
        <Grid
          key={card.title}
          size={{ xs: 12, sm: 6, md: 3 }}
        >
          <Card
            elevation={5}
            sx={{
              borderRadius: 3,
              transition: "0.3s",
              "&:hover": {
                transform: "translateY(-5px)",
                boxShadow: 10,
              },
            }}
          >
            <CardContent>
             <Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
                <Box>
                  <Typography
  variant="subtitle1"
  color="text.secondary"
  sx={{
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }}
>
  {card.title}
</Typography>

                  <Typography
                    variant="h3"

                    sx={{
                      color: card.color,
                    }}
                  >
                    {card.value}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    color: card.color,
                  }}
                >
                  {card.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}