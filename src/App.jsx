import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Container } from "@mui/material";

import Navbar from "./components/Navbar.jsx";
import FloatingLogo from "./components/FloatingLogo.jsx";

import Home from "./pages/Home.jsx";
import Tool1 from "./pages/Tool1.jsx";
import Tool2 from "./pages/Tool2.jsx";
import Team from "./pages/Team.jsx";

function CenteredPage({ children }) {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 3, sm: 4 } }}>{children}</Box>
    </Container>
  );
}

function FullBleedPage({ children }) {
  return (
    <Box
      sx={{
        height: "100%",          
        width: "100%",
        overflow: "hidden",
        position: "relative",    // important for absolute canvases
      }}
    >
      {children}
    </Box>
  );
}

export default function App() {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <Navbar brand="Melanoma Lymphatic Pathways" />

      <Box component="main" sx={{ flex: 1, minHeight: 0, width: "100%" }}>
        <Routes>
          <Route path="/" element={ <CenteredPage> <Home /> </CenteredPage>}/>
          <Route path="/tool1" element={ <FullBleedPage> <Tool1 /> </FullBleedPage> } />
          <Route path="/tool2" element={<FullBleedPage> <Tool2 /> </FullBleedPage>} />
          <Route path="/team"  element={ <CenteredPage> <Team /> </CenteredPage> } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <FloatingLogo src={"src/assets/logo.png"}/>
           
      </Box>
    </Box>
  );
}
