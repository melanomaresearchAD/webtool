import { Box, Typography, Stack, Paper, Grid, Chip, Divider, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import PercentIcon from '@mui/icons-material/Percent';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';

export default function Home() {
  return (
    <Box sx={{ textAlign: "center" }}>
      {/* Title */}
      <Stack spacing={1.25} sx={{ maxWidth: 940, mx: "auto" }}>
        <Typography variant="h1" gutterBottom>
          Melanoma Lymphatic Pathways
        </Typography>

        <Typography color="text.secondary">
          SUB TITLE Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Typography>

      </Stack>

      {/* Description  */}
      <Paper
        variant="outlined"
        sx={{ mt: 4, mx: "auto", maxWidth: 980, p: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={1.25} sx={{ maxWidth: 860, mx: "auto" }}>
          <Typography color="text.secondary">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </Typography>

          <Typography color="text.secondary">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat
            nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
            deserunt mollit anim id est laborum.
          </Typography>

          <Typography color="text.secondary">
            discussing with colleagues can often provide new insights and perspectives that enhance understanding.
          </Typography>
        </Stack>
      </Paper>

      {/* Tool positioning */}
      <Box sx={{ mt: 4.5 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          The Two Tools
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mx: "auto", mb: 2.5 }}>
          Two tools to visualise different aspects of melanoma lymphatic pathways. Click below to
          explore each tool.
        </Typography>

        <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1100, mx: "auto" }}>
          <Grid size={{ xs: 12, md: 6 }}  sx={{ display: "flex", justifyContent: "center" }}>
            <ToolCard
              icon={<PercentIcon />}
              title="Skin Selection Tool"
              body="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam."
              ctaLabel="Open Skin Selection Tool"
              to="/tool1"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: "center" }}>
            <ToolCard
              icon={<BubbleChartIcon />}
              title="Heatmaps Tool"
              body="Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu."
              ctaLabel="Open Heatmaps Tool"
              to="/tool2"
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

function ToolCard({ icon, title, body, ctaLabel, to }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: 520,
        maxWidth: "100%",
        borderRadius: 3,
        p: 2.5,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          mx: "auto",
          mb: 1,
          borderRadius: 2.5,
          display: "grid",
          placeItems: "center",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {icon}
      </Box>

      <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 440, mx: "auto" }}>
        {body}
      </Typography>

      <Button
        component={RouterLink}
        to={to}
        variant="outlined"
        sx={{ mt: 2, borderRadius: 999, textTransform: "none", fontWeight: 700 }}
      >
        {ctaLabel}
      </Button>
    </Paper>
  );
}

