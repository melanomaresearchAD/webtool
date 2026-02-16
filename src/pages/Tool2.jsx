import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  Radio,
  SwipeableDrawer,
  useMediaQuery,
  Fab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton, 
  Switch,
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";

import { useTheme } from "@mui/material/styles";

import ViewControls from "../components/ViewControls";
import CanvasControls from "../components/CanvasControls";
import HeatmapsViewer from "../components/HeatmapsViewer";

const SIDEBAR_W = "clamp(360px, 28vw, 680px)";
const safeTop = "calc(env(safe-area-inset-top, 0px) + 12px)";

export default function Tool2() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  // Viewer API
  const apiRef = useRef(null);

  // Mobile drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // View preset
  const [viewPreset, setViewPreset] = useState("All");

  // Meta from engine (regions + discrete point keys)
  const [regions, setRegions] = useState([]);
  const [patientDataKeys, setPatientDataKeys] = useState([]);
  const [defaultRegion, setDefaultRegion] = useState("Right Axilla");

  // Heatmap selection state
  const [region, setRegion] = useState("Right Axilla");
  const [patientDataMode, setPatientDataMode] = useState("norm"); // "norm" | "freq"
  const [displaySites, setDisplaySites] = useState(true);

  const controlsText =
    "Controls: left mouse button to rotate, right mouse button to pan. Mouse wheel to zoom. Double click to focus. Control panel located on top left.";

 // view options
  const hasNorm = patientDataKeys.includes(region);
  const hasFreq = patientDataKeys.includes(`${region} Frequency`);

  // Autocorrect mode if user selects one that does not exist for this region
  useEffect(() => {
    if (patientDataMode === "freq" && !hasFreq && hasNorm) setPatientDataMode("norm");
    if (patientDataMode === "norm" && !hasNorm && hasFreq) setPatientDataMode("freq");
  }, [region, hasNorm, hasFreq, patientDataMode]);

  // If the currently selected region is not in the loaded regions list, fall back
  useEffect(() => {
    if (regions.length === 0) return;
    if (!regions.includes(region)) setRegion(defaultRegion || regions[0]);
  }, [regions, defaultRegion]); // eslint-disabledline react-hooks/exhaustive-deps

  const handleReset = () => {
    setViewPreset("All");
    setRegion(defaultRegion);
    setPatientDataMode("norm");
    setDisplaySites(true);
    apiRef.current?.resetAll?.();
  };

  const selection = {
    region,
    patientDataMode,
    displaySites,
  };

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
      {/* Left column (desktop) */}
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
            regions={regions}
            region={region}
            setRegion={setRegion}
            displaySites={displaySites}
            setDisplaySites={setDisplaySites}
            patientDataMode={patientDataMode}
            setPatientDataMode={setPatientDataMode}
            hasNorm={hasNorm}
            hasFreq={hasFreq}
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
        <HeatmapsViewer
          selection={selection}
          viewPreset={viewPreset}
          onApiReady={(api) => (apiRef.current = api)}
          onMetaReady={(meta) => {
            setRegions(meta.regions);
            setPatientDataKeys(meta.patientDataKeys);
            setDefaultRegion(meta.defaultRegion);
            // default region
            setRegion((prev) => (meta.regions.includes(prev) ? prev : meta.defaultRegion));
          }}
        />

        <CanvasControls
          onZoomIn={() => apiRef.current?.zoomIn?.()}
          onZoomOut={() => apiRef.current?.zoomOut?.()}
          onReset={handleReset}
        />
        <ViewControls value={viewPreset} onChange={setViewPreset} />

        {/* Mobile drawer button */}
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
                Tool Info &amp; Controls
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

                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                  <SidebarContent
                    controlsText={controlsText}
                    regions={regions}
                    region={region}
                    setRegion={setRegion}
                    displaySites={displaySites}
                    setDisplaySites={setDisplaySites}
                    patientDataMode={patientDataMode}
                    setPatientDataMode={setPatientDataMode}
                    hasNorm={hasNorm}
                    hasFreq={hasFreq}
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
  region,
  setRegion,
  displaySites,
  setDisplaySites,
  patientDataMode,
  setPatientDataMode,
  hasNorm,
  hasFreq,
}) {
  const SECTION_ROW_SX = {
    fontWeight: 800,
  };

  const INDENT= "\u2003-\u2003";

  // Default options closed
  const [openSections, setOpenSections] = useState({
    "Head and Neck": false,
    Axilla: false,
    Groin: false,
  });

  const toggle = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const sections = useMemo(
    () => [
      {
        title: "Head and Neck",
        rows: [
          { type: "lr", label: `${INDENT}Occipital`, left: "Left Occipital", right: "Right Occipital" },
          { type: "lr", label: `${INDENT}Preauricular`, left: "Left Preauricular", right: "Right Preauricular" },
          { type: "lr", label: `${INDENT}Postauricular`, left: "Left Postauricular", right: "Right Postauricular" },
          { type: "lr", label: `${INDENT}Cervical Level I`, left: "Left Cervical Level I", right: "Right Cervical Level I" },
          { type: "lr", label: `${INDENT}Cervical Level II`, left: "Left Cervical Level II", right: "Right Cervical Level II" },
          { type: "lr", label: `${INDENT}Cervical Level III`, left: "Left Cervical Level III", right: "Right Cervical Level III" },
          { type: "lr", label: `${INDENT}Cervical Level IV`, left: "Left Cervical Level IV", right: "Right Cervical Level IV" },
          { type: "lr", label: `${INDENT}Cervical Level V`, left: "Left Cervical Level V", right: "Right Cervical Level V" },
          { type: "lr", label: `${INDENT}Submental`, left: "Left Submental", right: "Right Submental" },
          { type: "single", label: `${INDENT}Anterior Node Fields`, valueKey: "Anterior Head" },
          { type: "single", label: `${INDENT}Posterior Node Fields`, valueKey: "Posterior Head" },
        ],
      },

      {
        title: "Torso and Upper Limb",
        rows: [
          { type: "lr", label: `${INDENT}Axilla Combined Levels I, II, III`, left: "Left Axilla", right: "Right Axilla" },
          { type: "lr", label: `${INDENT}Axilla Level I Anterior`, left: "Left Axilla/Sub-Node Fields Laa", right: "Right Axilla/Sub-Node Fields Raa" },
          { type: "lr", label: `${INDENT}Axilla Level I Mid`, left: "Left Axilla/Sub-Node Fields Lam", right: "Right Axilla/Sub-Node Fields Ram" },
          { type: "lr", label: `${INDENT}Axilla Level I Posterior`, left: "Left Axilla/Sub-Node Fields Lap", right: "Right Axilla/Sub-Node Fields Rap" },
          { type: "lr", label: `${INDENT}Axilla Level I Lateral`, left: "Left Axilla/Sub-Node Fields Lal", right: "Right Axilla/Sub-Node Fields Ral" },
          { type: "lr", label: `${INDENT}Triangular Intermuscular Space`, left: "Left Triangular Intermuscular Space", right: "Right Triangular Intermuscular Space" },
          { type: "lr", label: `${INDENT}Supraclavicular Fossa`, left: "Left Supraclavicular Fossa", right: "Right Supraclavicular Fossa" },
          { type: "lr", label: `${INDENT}Epitrochlear`, left: "Left Epitrochlear", right: "Right Epitrochlear" },
        ],
      },

      {
        title: "Lower Limb",
        rows: [
          { type: "lr", label: `${INDENT}Combined`, left: "Left Groin", right: "Right Groin" },
          { type: "lr", label: `${INDENT}External Iliac`, left: "Left Groin/Sub-Node Fields Liei", right: "Right Groin/Sub-Node Fields Riei" },
          { type: "lr", label: `${INDENT}Femoral`, left: "Left Groin/Sub-Node Fields Lif", right: "Right Groin/Sub-Node Fields Rif" },
          { type: "lr", label: `${INDENT}Inguinal`, left: "Left Groin/Sub-Node Fields Lii", right: "Right Groin/Sub-Node Fields Rii" },
          { type: "lr", label: `${INDENT}Popliteal`, left: "Left Popliteal", right: "Right Popliteal" },
        ],
      },
    ],
    []
  );


  const sectionHasSelected = (sec) => {
    return sec.rows.some((r) => {
      if (r.type === "single") return r.valueKey === region;
      return r.left === region || r.right === region;
    });
  };


  return (
    <>
      <Paper variant="outlined" sx={{ m: 2, p: 2, borderRadius: 3 }}>
        <Typography variant="h2" sx={{ mb: 0.75 }}>
          Heatmaps Tool
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a region from the drop down menu to colour the mesh according to the drainage likelihood of that region. Display options are available at the bottom of the control panel.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {controlsText}
        </Typography>
      </Paper>

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
          Heatmap selection
        </Typography>

        {/* Region table with collapsible sections */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Region</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  Left
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>
                  Right
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sections.map((sec) => {
                const open = Boolean(openSections[sec.title]);
                const isSelected = sectionHasSelected(sec);

                return (
                  <Fragment key={sec.title}>
                    {/* Section header row */}
                    <TableRow
                      hover
                      sx={{
                        cursor: "pointer",
                        bgcolor: isSelected ? "rgba(255,255,255,0.10)" : "transparent",
                        "&:hover": {
                          bgcolor: isSelected ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)",
                        },
                        borderLeft: isSelected ? "3px solid" : "3px solid transparent",
                        borderLeftColor: isSelected ? "primary.main" : "transparent",
                      }}
                      onClick={() => toggle(sec.title)}
                    >
                      <TableCell sx={SECTION_ROW_SX}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggle(sec.title);
                            }}
                          >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                          </IconButton>
                          {sec.title}
                        </Box>
                      </TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>

                    {/* Child rows rendered in the same table */}
                    {open
                      ? sec.rows.map((r, idx) => {
                          if (r.type === "single") {
                            return (
                              <HeatmapSingleRow
                                key={`${sec.title}-single-${idx}`}
                                label={r.label}
                                valueKey={r.valueKey}
                                value={region}
                                onChange={setRegion}
                              />
                            );
                          }
                          return (
                            <HeatmapRow
                              key={`${sec.title}-lr-${idx}`}
                              label={r.label}
                              left={r.left}
                              right={r.right}
                              value={region}
                              onChange={setRegion}
                            />
                          );
                        })
                      : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        {/* Number of draining node fields */}
        <Typography sx={{ fontWeight: 800, mb: 1 }}>
          Number of draining node fields
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}># Node Fields</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                1
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                2+
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                3+
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>
                4+
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow hover>
              <TableCell />
              <TableCell align="center" onClick={() => setRegion("1 Draining Node Fields")} sx={{ cursor: "pointer" }}>
                <Radio checked={region === "1 Draining Node Fields"} />
              </TableCell>
              <TableCell align="center" onClick={() => setRegion("2 Or More Draining Node Fields")} sx={{ cursor: "pointer" }}>
                <Radio checked={region === "2 Or More Draining Node Fields"} />
              </TableCell>
              <TableCell align="center" onClick={() => setRegion("3 Or More Draining Node Fields")} sx={{ cursor: "pointer" }}>
                <Radio checked={region === "3 Or More Draining Node Fields"} />
              </TableCell>
              <TableCell align="center" onClick={() => setRegion("4 Or More Draining Node Fields")} sx={{ cursor: "pointer" }}>
                <Radio checked={region === "4 Or More Draining Node Fields"} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        {/* Display sites and patient data mode*/}
        <Table size="small">
          <TableBody>
            <TableRow hover>
              <TableCell>Display melanoma sites</TableCell>
              <TableCell align="center">
                <Switch
                  checked={displaySites}
                  onChange={(e) => setDisplaySites(e.target.checked)}
                />
              </TableCell>
            </TableRow>

            <TableRow hover>
              <TableCell>Frequency</TableCell>
              <TableCell align="center" sx={{ cursor: hasFreq ? "pointer" : "default" }} onClick={() => hasFreq && setPatientDataMode("freq")}>
                <Radio checked={patientDataMode === "freq"} disabled={!hasFreq} />
              </TableCell>
            </TableRow>

            <TableRow hover>
              <TableCell>Normalised (% Drainage likelihood)</TableCell>
              <TableCell align="center" sx={{ cursor: hasNorm ? "pointer" : "default" }} onClick={() => hasNorm && setPatientDataMode("norm")}>
                <Radio checked={patientDataMode === "norm"} disabled={!hasNorm} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Divider sx={{ my: 2 }} />

        {/* Legend */}
        <Box sx={{ mt: 1 }}>
          {/*  % Drainage likelihood 0-100 */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 0.75 }}>
            <Typography variant="body2" color="text.secondary">
              0
            </Typography>

            <Typography
              variant="body2"
              sx={{ flex: 1, textAlign: "center", fontWeight: 700 }}
            >
              % Drainage likelihood
            </Typography>

            <Typography variant="body2" color="text.secondary">
              100
            </Typography>
          </Box>

          {/* Colour bar */}
          <Box
            sx={{
              height: 34,
              borderRadius: 1.25,
              border: "1px solid",
              borderColor: "divider",
              background:
                "linear-gradient(90deg, #0033ff 0%, #00d5ff 25%, #00ff66 50%, #ffe600 75%, #ff2a00 100%)",
            }}
          />
        </Box>

      </Paper>
    </>
  );
}

function HeatmapRow({ label, left, right, value, onChange }) {
  return (
    <TableRow hover sx={{ cursor: "pointer" }}>
      <TableCell onClick={() => onChange(value === left ? right : left)}>{label}</TableCell>
      <TableCell align="center" onClick={() => onChange(left)}>
        <Radio checked={value === left} onChange={() => onChange(left)} />
      </TableCell>
      <TableCell align="center" onClick={() => onChange(right)}>
        <Radio checked={value === right} onChange={() => onChange(right)} />
      </TableCell>
    </TableRow>
  );
}

function HeatmapSingleRow({ label, valueKey, value, onChange }) {
  return (
    <TableRow hover sx={{ cursor: "pointer" }}>
      <TableCell onClick={() => onChange(valueKey)}>{label}</TableCell>
      <TableCell align="center" onClick={() => onChange(valueKey)}>
        <Radio checked={value === valueKey} onChange={() => onChange(valueKey)} />
      </TableCell>
      <TableCell align="center" onClick={() => onChange(valueKey)}>
        <Radio checked={value === valueKey} onChange={() => onChange(valueKey)} />
      </TableCell>
    </TableRow>
  );
}
