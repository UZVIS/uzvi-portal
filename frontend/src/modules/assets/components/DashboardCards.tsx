import {
    Package,
    CheckCircle2,
    UserCheck,
    ArchiveX
} from "lucide-react";

const cards = [
    {
        title: "Total Assets",
        value: 230,
        subtitle: "All assets in system",
        bg: "#FFF3E8",
        color: "#EF6C22",
        icon: Package,
    },
    {
        title: "Available",
        value: 150,
        subtitle: "Ready to assign",
        bg: "#EDF9F1",
        color: "#2EAF62",
        icon: CheckCircle2,
    },
    {
        title: "Assigned",
        value: 70,
        subtitle: "Currently assigned",
        bg: "#FFF7E8",
        color: "#F4A300",
        icon: UserCheck,
    },
    {
        title: "Retired",
        value: 10,
        subtitle: "Not in use",
        bg: "#F5F5F5",
        color: "#666666",
        icon: ArchiveX,
    }
];

export default function DashboardCards() {

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
                                color: card.color
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