import { Box, Typography, Stack, Button, Divider, Grid } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import PercentIcon from "@mui/icons-material/Percent";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";

const previousPapers = [
  {
    title: "Paper title 1",
    venue: "Journal / Conference, 2022",
    url: "https://doi.org/xx.xxxx/xxxxx"
  },
  {
    title: "Paper title 2",
    venue: "Journal / Conference, 2020",
    url: "https://pubmed.ncbi.nlm.nih.gov/xxxxxxxx/"
  },
];

export default function Home() {
  return (
    <Box sx={{ px: { xs: 2, md: 5 }, pb: 6 }}>
      {/* Title */}
      <Stack 
      spacing={1.25} 
      sx={{ maxWidth: 940, mx: "auto", textAlign: "center", mt: { xs: 4, sm: 5, md: 6 } }}
      >
        <Typography variant="h1" gutterBottom>
          Melanoma Lymphatic Pathways
        </Typography>
        <Typography color="text.secondary">
          SUB TITLE Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </Typography>
      </Stack>

      {/* 3 column row */}
      <Box sx={{ mt: 6 }}>
        <Grid
          container
          spacing={{ xs: 3, md: 6 }}
          sx={{ maxWidth: 1400, mx: "auto" }}
          alignItems="start"
        >
          {/* Left: description */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1.25} sx={{ textAlign: "left" }}>
              <Typography color="text.secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </Typography>
              <Typography color="text.secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </Typography>
              <Typography color="text.secondary">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur.
              </Typography>
            </Stack>
          </Grid>

          {/* Middle: skin selection */}
          <Grid size={{ xs: 12, md: 4 }}>
            <ToolBlock
              icon={<PercentIcon />}
              imageSrc={`${import.meta.env.BASE_URL}images/tool1preview.png`}
              imageAlt="Skin Selection Tool preview"
              title="Skin Selection Tool"
              body="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero."
              ctaLabel="Open Skin Selection Tool"
              to="/tool1"
            />
          </Grid>

          {/* Right: Heatmaps */}
          <Grid size={{ xs: 12, md: 4 }}>
            <ToolBlock
              icon={<BubbleChartIcon />}
              imageSrc={`${import.meta.env.BASE_URL}images/tool2preview.png`}
              imageAlt="Heatmaps Tool preview"
              title="Heatmaps Tool"
              body="Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta."
              ctaLabel="Open Heatmaps Tool"
              to="/tool2"
            />
          </Grid>
        </Grid>
      </Box>

      {/* Previous Research */}
      <Box sx={{ mt: 6 }}>
        <Stack spacing={1} sx={{ maxWidth: 1400, mx: "auto", textAlign: "center" }}>
          <Typography variant="h2">Previous Research</Typography>
          <Typography color="text.secondary">
            Links to prior work and papers that underpin this project.
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Stack spacing={2.25} divider={<Divider flexItem />}>
            {previousPapers.map((p) => (
              <Box
                key={p.url}
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2.5,
                  flexDirection: { xs: "column", sm: "row" },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {p.venue}
                  </Typography>
                </Box>

                <Button
                  component="a"
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  sx={{
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    alignSelf: { xs: "stretch", sm: "auto" },
                  }}
                >
                  Open paper
                </Button>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}

function ToolBlock({ icon, imageSrc, imageAlt, title, body, ctaLabel, to }) {
  return (
    <Stack spacing={1.5} sx={{ textAlign: "center", alignItems: "center" }}>
      <Box
        component="img"
        src={imageSrc}
        alt={imageAlt}
        sx={{
          width: "100%",
          maxWidth: 520,
          aspectRatio: "3 / 4",
          objectFit: "cover",
          borderRadius: 3,
          display: "block",
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "center" }}>
        {icon}
        <Typography sx={{ fontWeight: 800 }}>{title}</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
        {body}
      </Typography>

      <Button
        component={RouterLink}
        to={to}
        variant="outlined"
        sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
      >
        {ctaLabel}
      </Button>
    </Stack>
  );
}
