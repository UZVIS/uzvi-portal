import { useEffect, useState } from "react";
import {
  Package,
  Archive,
  UserCheck,
  Wrench,
  ArchiveX,
} from "lucide-react";

import { getInventorySummary } from "../services/assetService";
import type { InventorySummary } from "../types/asset";

export default function DashboardCards() {
  const [summary, setSummary] = useState<InventorySummary>({
    total_assets: 0,
    in_stock_assets: 0,
    assigned_assets: 0,
    under_repair_assets: 0,
    retired_assets: 0,
  });

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await getInventorySummary();
      setSummary(data);
    } catch (error) {
      console.error("Failed to load inventory summary", error);
    }
  }

  const cards = [
    {
      title: "Total Assets",
      value: summary.total_assets,
      subtitle: "All assets in system",
      bg: "#FFF3E8",
      color: "#EF6C22",
      icon: Package,
    },
    {
      title: "In Stock",
      value: summary.in_stock_assets,
      subtitle: "Ready to assign",
      bg: "#EDF9F1",
      color: "#2EAF62",
      icon: Archive,
    },
    {
      title: "Assigned",
      value: summary.assigned_assets,
      subtitle: "Currently assigned",
      bg: "#FFF7E8",
      color: "#F4A300",
      icon: UserCheck,
    },
    {
      title: "Under Repair",
      value: summary.under_repair_assets,
      subtitle: "Under maintenance",
      bg: "#EAF4FF",
      color: "#1976D2",
      icon: Wrench,
    },
    {
      title: "Retired",
      value: summary.retired_assets,
      subtitle: "Not in use",
      bg: "#F5F5F5",
      color: "#666666",
      icon: ArchiveX,
    },
  ];

  return (
    <div className="cards-grid">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            className="dashboard-card"
            key={card.title}
          >
            <div
              className="card-icon"
              style={{
                background: card.bg,
                color: card.color,
              }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>

            <div className="card-content">
              <h5>{card.title}</h5>
              <h2>{card.value}</h2>
              <p>{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}