import { Box, Fab, Stack, Tooltip, Divider, IconButton } from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveOutlinedIcon from "@mui/icons-material/RemoveOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";

// Same specifications as ViewControls for consistency.
const pillFabSx = {
  height: 40,
  minHeight: 40,
  width: 120,
  minWidth: 120,
  borderRadius: 999,
  boxShadow: "none",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  color: "text.primary",
  px: 1.0,
  typography: "body2",
  fontWeight: 500,
  letterSpacing: 0,
  "&:hover": { bgcolor: "background.paper" },
};

const iconBtnSx = {
  width: 32,
  height: 32,
  borderRadius: 999, 
  color: "text.primary",
  "&:hover": { bgcolor: "action.hover" },
};

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
      {/* Render as a non-button container so IconButtons are valid */}
      <Fab
        component="div"
        role="group"
        aria-label="Canvas controls"
        size="small"
        variant="extended"
        sx={pillFabSx}
      >
        <Stack direction="row" alignItems="center" sx={{ height: "100%" }}>
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
      </Fab>
    </Box>
  );
}