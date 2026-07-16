import { useNavigate } from 'react-router-dom';
import type {ModuleInfo} from './modules.data';
import './ModuleDirectoryPage.css';

interface Props {
  module: ModuleInfo;
}

export default function ModulePlaceholderPage({ module }: Props) {
  const navigate = useNavigate();

  return (
    <div className="directory-page">
      <div className="wrap">
        <div className="back-row">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Directory
          </button>
          <span className="crumb">
            / <span className="active-crumb">{module.slug}</span>
          </span>
        </div>

        <div className="browser-chrome">
          <div className="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="url">
            app.uzvi.internal<span className="path">{module.prefix}</span>
          </div>
        </div>

        <div className="module-panel">
          <div className="m-id">{module.id} · module</div>
          <h2>{module.name}</h2>
          <p className="m-purpose">{module.purpose}</p>

          <div className="scaffold">
            <div className="label">backend/app/modules/{module.slug}/</div>
            <div className="file">├── models.py (placeholder)</div>
            <div className="file">├── schemas.py (placeholder)</div>
            <div className="file">├── service.py (placeholder)</div>
            <div className="file">├── router.py (placeholder)</div>
            <div className="file">└── tests/</div>
            <div className="note">
              This module's router isn't mounted yet — schema and API contract are the next
              deliverable. Navigation from the directory works; the view itself is scaffolding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}