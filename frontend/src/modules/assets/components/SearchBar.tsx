import {
    Search,
    Filter,
    Plus
} from "lucide-react";

import "../styles/dashboard.css";

export default function SearchBar() {

    return (

        <div className="toolbar">

            {/* Search */}

            <div className="search-box">

                <Search size={18} className="search-icon"/>

                <input
                    className="search-input"
                    type="text"
                    placeholder="Search assets by ID, tag, type or name..."
                />

            </div>

            {/* Status */}

            <select className="filter-select">

                <option>Status</option>
                <option>Available</option>
                <option>Assigned</option>
                <option>Maintenance</option>
                <option>Retired</option>

            </select>

            {/* Type */}

            <select className="filter-select">

                <option>Type</option>
                <option>Laptop</option>
                <option>Desktop</option>
                <option>Monitor</option>
                <option>Mouse</option>
                <option>Keyboard</option>

            </select>

            {/* Filter */}

            <button className="filter-btn">

                <Filter size={17}/>

                Filters

            </button>

            {/* Add */}

            <button className="add-btn">

                <Plus size={18}/>

                Add Asset

            </button>

        </div>

    );

}