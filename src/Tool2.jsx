import { useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  SwipeableDrawer,
  useMediaQuery,
  Fab,
} from "@mui/material";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import { useTheme } from "@mui/material/styles";

import ViewControls from "../components/ViewControls";
import CanvasControls from "../components/CanvasControls";

const SIDEBAR_W = 520;
const safeTop = "calc(env(safe-area-inset-top, 0px) + 12px)";


export default function Tool1() {


  // View preset buttons
  const [viewPreset, setViewPreset] = useState("All");

  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Canvas control API 
  const apiRef = useRef(null);

  const handleReset = () => {
    setViewPreset("All"); //  make the View FAB show All
    apiRef.current?.resetAll?.(); // Clear selection and camera inside Three.js
  };

  const controlsText =
    "Controls: left mouse button to rotate, right mouse button to pan. Mouse wheel to zoom. Double click to focus.";


  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
        width: "100%",
        display: { xs: "block", md: "grid" },
        gridTemplateColumns: { md: `${SIDEBAR_W}px 1fr` },
        overflow: "hidden",
      }}
    >
      {/* LEFT COLUMN (desktop) */}
      {isMdUp && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderRight: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          <SidebarContent
            controlsText={controlsText}
          />
        </Box>
      )}

      {/* RIGHT COLUMN MODEL */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          isolation: "isolate",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        {/* TODO: need the three js code here */}

        <CanvasControls
          onZoomIn={() => apiRef.current?.zoomIn()}
          onZoomOut={() => apiRef.current?.zoomOut()}
          onReset={handleReset}
        />
        <ViewControls value={viewPreset} onChange={setViewPreset} />

        {/* MOBILE: open sidebar button with swipeabledrawer */}
        {!isMdUp && (
          <>
            <Box sx={{ position: "absolute", top: safeTop, left: 12, zIndex: 30 }}>
              <Fab
                variant="extended"
                size="small"
                onClick={() => setSidebarOpen(true)}
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
                <TableChartOutlinedIcon sx={{ mr: 1 }} />
                Tool Info &amp; Tables
              </Fab>
            </Box>

            <SwipeableDrawer
              anchor="bottom"
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onOpen={() => setSidebarOpen(true)}
              disableSwipeToOpen
              swipeAreaWidth={24}
              hysteresis={0.25}
              minFlingVelocity={450}
              slotProps={{
                paper: {
                  sx: {
                    height: "70vh",
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                    overflow: "hidden",
                  },
                },
              }}
            >

              <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Pull handle */}
                <Box sx={{ p: 1, display: "flex", justifyContent: "center" }}>
                  <Box
                    sx={{
                      width: 44,
                      height: 4,
                      borderRadius: 999,
                      bgcolor: "text.disabled",
                    }}
                  />
                </Box>

                {/* Sidebar content */}
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                  <SidebarContent
                    controlsText={controlsText}
                  />
                </Box>
              </Box>
            </SwipeableDrawer>

          </>
        )}
      </Box>
    </Box>
  );
}


function SidebarContent({
  controlsText,
}) {
  return (
    <>
      {/* Tool title and description */}
      <Paper variant="outlined" sx={{ m: 2, p: 2, borderRadius: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.75 }}>
          Tool 2 - Heatmaps 
        </Typography>
        <Typography variant="body2" color="text.secondary">
            Heatmpas description
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {controlsText}
        </Typography>
      </Paper>


    </>
  );
}
