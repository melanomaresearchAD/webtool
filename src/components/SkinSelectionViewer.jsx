import { useEffect, useRef } from "react";
import { SkinSelectionEngine } from "../three/SkinSelectionEngine";
import "../three/ThreeLabels.css";

export default function SkinSelectionViewer({
  onRowsChange,
  showNodecodes,
  showDrainage,
  showPatientCounts,
  viewPreset,
  onApiReady,
}) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const engine = new SkinSelectionEngine({
      host,
      onRowsChange,
    });
    engineRef.current = engine;

    (async () => {
      await engine.init();
      if (cancelled) return;

      onApiReady?.({
        zoomIn: () => engine.zoomIn(),
        zoomOut: () => engine.zoomOut(),
        resetAll: () => engine.resetAll(), 
      });

      engine.setShowFlags({ showNodecodes, showDrainage, showPatientCounts });
      engine.setViewPreset(viewPreset);
    })();

    return () => {
      cancelled = true;
      onApiReady?.(null);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setShowFlags({ showNodecodes, showDrainage, showPatientCounts });
  }, [showNodecodes, showDrainage, showPatientCounts]);

  useEffect(() => {
    engineRef.current?.setViewPreset(viewPreset);
  }, [viewPreset]);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />;
}
