import { useNavigate } from 'react-router-dom';
import { foundation, modules } from './modules.data';
import './ModuleDirectoryPage.css';

export default function ModuleDirectoryPage() {
  const navigate = useNavigate();

  return (
    <div className="directory-page">
      <div className="wrap">
        <header>
          <div>
            <div className="brand-eyebrow">
              UZVI SERVICES <span className="sep">▸</span> EMPLOYEE SELF-MANAGEMENT PORTAL
            </div>
            <h1>Module Directory</h1>
            <p className="sub">
              One shared identity, fifteen independent modules. Pick where you're headed.
            </p>
          </div>
          <div className="stat-block">
            <div className="stat">
              <div className="n">15</div>
              <div className="l">modules</div>
            </div>
            <div className="stat">
              <div className="n">1</div>
              <div className="l">shared identity</div>
            </div>
          </div>
        </header>

        <div
          className="foundation"
          tabIndex={0}
          role="button"
          onClick={() => navigate(foundation.prefix)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(foundation.prefix)}
        >
          <div className="foundation-left">
            <span className="mod-id-lg">{foundation.id}</span>
            <div>
              <h2>{foundation.name}</h2>
              <p>{foundation.purpose}</p>
            </div>
          </div>
          <div className="foundation-right">
            <span className="prefix">{foundation.prefix}</span>
            referenced by 14 modules
          </div>
        </div>

        <div className="section-label">Modules — M1 – M14</div>

        <div className="grid">
          {modules.map((m) => (
            <div
              key={m.id}
              className="card"
              tabIndex={0}
              role="button"
             onClick={() =>
  navigate(m.prefix === "/announcements" ? "/login" : m.prefix)
}
             onKeyDown={(e) =>
  e.key === "Enter" &&
  navigate(m.prefix === "/announcements" ? "/login" : m.prefix)
}
            >
              <div className="card-top">
                <span className="mod-id">{m.id}</span>
                <span className="arrow">↗</span>
              </div>
              <h3>{m.name}</h3>
              <p className="desc">{m.purpose}</p>
              <span className="prefix">{m.prefix}</span>
            </div>
          ))}
        </div>

        <footer>
          <span>uzvi-portal · frontend</span>
          <span>15 modules · 1 app</span>
        </footer>
      </div>
    </div>
  );
}