import {
    Search,
    Filter,
    Plus
} from "lucide-react";

import "../styles/dashboard.css";

interface SearchBarProps {

    onAddAsset: () => void;

    search: string;
    onSearchChange: (value: string) => void;

    status: string;
    onStatusChange: (value: string) => void;

    type: string;
    onTypeChange: (value: string) => void;

}

export default function SearchBar({

    onAddAsset,

    search,
    onSearchChange,

    status,
    onStatusChange,

    type,
    onTypeChange,

}: SearchBarProps) {

    return (

        <div className="toolbar">

            {/* Search */}

            <div className="search-box">

                <Search
                    size={18}
                    className="search-icon"
                />

                <input
                    className="search-input"
                    type="text"
                    placeholder="Search assets by ID, Tag or Type..."
                    value={search}
                    onChange={(e) =>
                        onSearchChange(e.target.value)
                    }
                />

            </div>

            {/* Status */}

            <select
                className="filter-select"
                value={status}
                onChange={(e) =>
                    onStatusChange(e.target.value)
                }
            >

                <option value="">All Status</option>

                <option value="In Stock">In Stock</option>

                <option value="Assigned">Assigned</option>

                <option value="Under Repair">Under Repair</option>

                <option value="Retired">Retired</option>

            </select>

            {/* Type */}

            <select
                className="filter-select"
                value={type}
                onChange={(e) =>
                    onTypeChange(e.target.value)
                }
            >

                <option value="">All Types</option>

                <option value="Laptop">Laptop</option>

                <option value="Desktop">Desktop</option>

                <option value="Monitor">Monitor</option>

                <option value="Mouse">Mouse</option>

                <option value="Keyboard">Keyboard</option>

            </select>

            {/* Filter Button */}

            {/* <button className="filter-btn">

                <Filter size={17} />

                Filters

            </button> */}

            {/* Add Asset */}

            <button
                className="add-btn"
                onClick={onAddAsset}
            >

                <Plus size={18} />

                Add Asset

            </button>

        </div>

    );

}