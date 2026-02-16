import {useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  FormControlLabel,
  SwipeableDrawer,
  useMediaQuery,
  Fab,
} from "@mui/material";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import { useTheme } from "@mui/material/styles";

import ViewControls from "../components/ViewControls";
import CanvasControls from "../components/CanvasControls";
import SkinSelectionViewer from "../components/SkinSelectionViewer";

const SIDEBAR_W = "clamp(360px, 28vw, 680px)";
const safeTop = "calc(env(safe-area-inset-top, 0px) + 12px)";


export default function Tool1() {
  // Table rows populated by canvas element selection
  const [rows, setRows] = useState([]);

  // Overlay toggles
  const [showPatientCounts, setShowPatientCounts] = useState(true);
  const [showNodecodes, setShowNodecodes] = useState(true);
  const [showDrainage, setShowDrainage] = useState(true);

  // View preset buttons
  const [viewPreset, setViewPreset] = useState("All");

  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Canvas control API 
  const apiRef = useRef(null);

  const handleReset = () => {
    setViewPreset("All"); // make the View FAB show All
    setRows([]);          //  clear the table immediately
    apiRef.current?.resetAll?.(); // Clear selection and camera inside Three.js
  };

  const controlsText =
    "Controls: left mouse button to rotate, right mouse button to pan. Mouse wheel to zoom. Double click to focus. Control pannel located on top left.";


  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <Box
      sx={{
        position: "relative",
        height: { xs: "calc(100dvh - 56px)", sm: "calc(100dvh - 64px)" },
        width: "100%",
        display: { xs: "block", md: "grid" },
        gridTemplateColumns: { md: `${SIDEBAR_W} 1fr` },
        overflow: "hidden",
      }}
    >
      {/* Left column */}
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
            rows={rows}
            showPatientCounts={showPatientCounts}
            setShowPatientCounts={setShowPatientCounts}
            showNodecodes={showNodecodes}
            setShowNodecodes={setShowNodecodes}
            showDrainage={showDrainage}
            setShowDrainage={setShowDrainage}
            controlsText={controlsText}
          />
        </Box>
      )}

      {/* Right column */}
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
        {/* threejs engine integration*/}
        <SkinSelectionViewer
          onRowsChange={setRows}
          showNodecodes={showNodecodes}
          showDrainage={showDrainage}
          showPatientCounts={showPatientCounts}
          viewPreset={viewPreset}
          onApiReady={(api) => (apiRef.current = api)}
        />

        <CanvasControls
          onZoomIn={() => apiRef.current?.zoomIn()}
          onZoomOut={() => apiRef.current?.zoomOut()}
          onReset={handleReset}
        />
        <ViewControls value={viewPreset} onChange={setViewPreset} />

        {/* Mobile view which opens sidebar button with swipeabledrawer */}
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
                    rows={rows}
                    showPatientCounts={showPatientCounts}
                    setShowPatientCounts={setShowPatientCounts}
                    showNodecodes={showNodecodes}
                    setShowNodecodes={setShowNodecodes}
                    showDrainage={showDrainage}
                    setShowDrainage={setShowDrainage}
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
  rows,
  showPatientCounts,
  setShowPatientCounts,
  showNodecodes,
  setShowNodecodes,
  showDrainage,
  setShowDrainage,
  controlsText,
}) {
  return (
    <>
      {/* Tool title and description */}
      <Paper variant="outlined" sx={{ m: 2, p: 2, borderRadius: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.75 }}>
          Skin Selection Tool
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a surface element on the model to populate node-field statistics and visual overlays.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {controlsText}
        </Typography>
      </Paper>

      {/* Tables area */}
      <Paper
        variant="outlined"
        sx={{
          mx: 2,
          mb: 2,
          p: 2,
          borderRadius: 3,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
        }}
      >
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          Lymphatic Drainage Statistics
        </Typography>


        <TableContainer sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Node Field</TableCell>
                <TableCell sx={{ fontWeight: 800 }}># Cases</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Mean Drainage %</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>95% CI</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ color: "text.secondary" }}>
                    Click an element to populate this table.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => (
                  <TableRow key={`${r.code}-${idx}`} hover>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.count}</TableCell>
                    <TableCell>{r.percentage}</TableCell>
                    <TableCell>{r.CI}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Paper variant="outlined" sx={{ m: 2, p: 2, borderRadius: 3 }}>
        <Typography>
          Display
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showPatientCounts}
                onChange={(e) => setShowPatientCounts(e.target.checked)}
              />
            }
            label="#Cases"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showNodecodes}
                onChange={(e) => setShowNodecodes(e.target.checked)}
              />
            }
            label="Codes"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDrainage}
                onChange={(e) => setShowDrainage(e.target.checked)}
              />
            }
            label="Drainage %"
          />
        </Stack>
      </Paper>
    </>
  );
}
