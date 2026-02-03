import { useState } from "react";
import { Box, Fab, Menu, MenuItem } from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

const PRESETS = ["Anterior", "Posterior", "Left lateral", "Right lateral", "All"];

function labelForPreset(p) {
  if (p === "Left lateral") return "Left";
  if (p === "Right lateral") return "Right";
  return p;
}

export default function ViewControls({
  value = "All",
  onChange,
  sx,
  anchor = "bottom-left",
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const safeBottom = "calc(env(safe-area-inset-bottom, 0px) + 12px)";
  const safeLeft = "calc(env(safe-area-inset-left, 0px) + 12px)";
  const safeRight = "calc(env(safe-area-inset-right, 0px) + 12px)";

  const positionSx =
    anchor === "bottom-left"
      ? { left: safeLeft, bottom: safeBottom }
      : { right: safeRight, bottom: safeBottom };

  return (
    <Box
      sx={{
        position: "absolute",
        zIndex: 30,
        pointerEvents: "auto",
        ...positionSx,
        ...sx,
      }}
    >
      <Fab
        size="small"
        variant="extended"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          textTransform: "none",
          borderRadius: 999,
          boxShadow: "none",
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          color: "text.primary",
          "&:hover": { bgcolor: "background.paper" },
        }}
      >
        <TuneOutlinedIcon sx={{ mr: 1 }} />
        View: {labelForPreset(value)}
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              mt: 1,
              minWidth: 180,
            },
          },
        }}
      >

        {PRESETS.map((p) => (
          <MenuItem
            key={p}
            selected={value === p}
            onClick={() => {
              onChange?.(p);
              setAnchorEl(null);
            }}
          >
            {labelForPreset(p)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
}
