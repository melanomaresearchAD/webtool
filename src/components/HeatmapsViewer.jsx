import { useEffect, useRef } from "react";
import { HeatmapsEngine } from "../three/HeatmapsEngine";

export default function HeatmapsViewer({
  selection,        // { region, patientDataMode, displaySites }
  viewPreset,
  onApiReady,
  onMetaReady,
}) {
  const hostRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    const engine = new HeatmapsEngine({ host });
    engineRef.current = engine;

    (async () => {
      await engine.init();
      if (cancelled) return;

      onApiReady?.({
        zoomIn: () => engine.zoomIn(),
        zoomOut: () => engine.zoomOut(),
        resetAll: () => engine.resetAll(),
      });

      onMetaReady?.(engine.getMeta());

      engine.setHeatmapSelection(selection);
      engine.setViewPreset(viewPreset);
    })();

    return () => {
      cancelled = true;
      onApiReady?.(null);
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // init once

  useEffect(() => {
    engineRef.current?.setHeatmapSelection(selection);
  }, [selection?.region, selection?.patientDataMode, selection?.displaySites]);

  useEffect(() => {
    engineRef.current?.setViewPreset(viewPreset);
  }, [viewPreset]);

  return <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />;
}
