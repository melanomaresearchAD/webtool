import { Paper, IconButton, Stack, Tooltip, Divider, Box } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

export default function CanvasControls({ onZoomIn, onZoomOut, onReset, sx }) {
  const safeTop = "calc(env(safe-area-inset-top, 0px) + 12px)";
  const safeRight = "calc(env(safe-area-inset-right, 0px) + 12px)";

  return (
    <Box
      sx={{
        position: "absolute",
        top: safeTop,
        right: safeRight,
        zIndex: 30,
        pointerEvents: "auto",
        ...sx,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "background.paper",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <Stack direction="row" spacing={0} alignItems="center" sx={{ px: 0.5, py: 0.25 }}>
          <Tooltip title="Zoom in" placement="bottom" arrow>
            <IconButton size="small" onClick={onZoomIn} aria-label="Zoom in" sx={iconBtnSx}>
              <AddOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Zoom out" placement="bottom" arrow>
            <IconButton size="small" onClick={onZoomOut} aria-label="Zoom out" sx={iconBtnSx}>
              <RemoveOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5, opacity: 0.5 }} />

          <Tooltip title="Reset view" placement="bottom" arrow>
            <IconButton size="small" onClick={onReset} aria-label="Reset view" sx={iconBtnSx}>
              <ReplayOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
}

const iconBtnSx = {
  borderRadius: 2,
  color: "text.primary",
  "&:hover": { bgcolor: "action.hover" },
};
