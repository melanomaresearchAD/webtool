import { useState } from "react";
import { Box, Fab, Menu, MenuItem } from "@mui/material";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";

const PRESETS = ["Anterior", "Posterior", "Left lateral", "Right lateral", "All"];

function labelForPreset(p) {
  if (p === "Left lateral") return "Left";
  if (p === "Right lateral") return "Right";
  return p;
}

const pillFabSx = {
  height: 40,
  minHeight: 40,
  width: 150,
  minWidth: 150,
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
  textTransform: "none",
  "&:hover": { bgcolor: "background.paper" },
};

export default function ViewControls({
  value = "All",
  onChange,
  sx,
  anchor = "top-right",
  offsetX = 140,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const safeTop = "calc(env(safe-area-inset-top, 0px) + 12px)";
  const safeRight = "calc(env(safe-area-inset-right, 0px) + 12px)";

  const positionSx =
    anchor === "top-right"
      ? { top: safeTop, right: `calc(${safeRight} + ${offsetX}px)` }
      : { top: safeTop, right: safeRight }; // fallback

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
        disableRipple
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={pillFabSx}
      >
        <TuneOutlinedIcon sx={{ mr: 0.75, fontSize: 20 }} />
        View: {labelForPreset(value)}
      </Fab>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { borderRadius: 2, mt: 1, minWidth: 180 } },
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
