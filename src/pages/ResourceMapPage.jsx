import { useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import ResourceMap from "@/components/ResourceMap";

export default function ResourceMapPage() {
  useEffect(() => { document.title = "CloudShieldPlus | Architecture"; }, []);
  const {
    mapNodes, mapEdges, findings, attackPaths, recommendations,
    handleOpenResourceDrawer, targetMapResourceId, targetMapAttackPathId,
  } = useDashboard();

  return (
    <div className="glass rounded-2xl p-4 min-h-[600px]">
      <ResourceMap
        nodes={mapNodes}
        edges={mapEdges}
        findings={findings}
        attackPaths={attackPaths}
        recommendations={recommendations}
        initialSelectedResourceId={targetMapResourceId}
        initialSelectedAttackPathId={targetMapAttackPathId}
        onSelectResourceDetails={handleOpenResourceDrawer}
      />
    </div>
  );
}
