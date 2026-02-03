import { Box } from "@mui/material";

export default function FloatingLogo({
  src,
  alt = "Logo",
  width = 300,
  height = 70,
  bottom = {xs:8, sm:10, md:12},
  right = {xs:12, sm:16, md:24},
  zIndex = 1300,
}) {
  if (!src) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom,
        right,
        zIndex,
        pointerEvents: "none", // does not block clicks underneath
        userSelect: "none",
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width : {xs:160, sm:200, md:240, lg:300},
          height,
          display: "block",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}
