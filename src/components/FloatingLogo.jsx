import { Box } from "@mui/material";

export default function FloatingLogo({
  src,
  alt = "Logo",
  width = 300,
  height = 70,
  bottom = 5,
  right = 24,
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
          width,
          height,
          display: "block",
          objectFit: "contain",
        }}
      />
    </Box>
  );
}
