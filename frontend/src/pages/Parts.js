import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/header";
import LoadingModal from "../components/LoadingModal";
import "./Parts.css";
import { useCart } from "../context/CartContext";

const API = "http://localhost:5000";
const IMAGE_API = "http://localhost:5001/predict";

const PartCard = ({ item, onViewDetails }) => {
    const [imgError, setImgError] = useState(false);
    const { addToCart } = useCart();

    const imgSrc =
        item.image_url && !imgError
            ? `${API}/${item.image_url.replace(/^\//, "")}`
            : null;

    const conditionLabel =
        item.condition === "new" ? "Genuine / New" : "Used / Reconditioned";

    const product = item.product_id || {};
    const vendorName = item.vendor?.business_name || "Unknown Vendor"

    return (
        <div className="col-12 col-sm-6 col-lg-4 col-xl-3">
            <div className="card parts-card h-100 shadow-sm border-0">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={item.title}
                        className="parts-card-img-top"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="parts-card-img-placeholder">
                        <span className="material-symbols-outlined parts-card-img-icon">
                            image
                        </span>
                    </div>
                )}

                <div className="card-body d-flex flex-column">
                    <h6 className="card-title mb-1 parts-card-title text-dark">
                        {item.title || product.name}
                    </h6>

                    <p className="small text-muted mb-1">
                        Vendor: {vendorName}
                    </p>

                    {product.name && (
                        <p className="small text-muted mb-1">{product.name}</p>
                    )}

                    <p className="small text-muted mb-2">{conditionLabel}</p>

                    <div className="mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="parts-price fw-bold text-success">
                                Rs {item.price?.toLocaleString()}
                            </span>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-sm btn-outline-success flex-grow-1"
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                }}
                            >
                                Add to Cart
                            </button>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                type="button"
                                onClick={() => onViewDetails(item._id)}
                            >
                                View
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Parts = () => {
    const navigate = useNavigate();

    const [parts, setParts] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [hasSearched, setHasSearched] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    // Image search modal state
    const [identifying, setIdentifying] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null);
    const [statusMessage, setStatusMessage] = useState("");

    // Filter state
    const [filters, setFilters] = useState({
        minPrice: "",
        maxPrice: "",
        conditions: [],
        locations: []
    });

    const buildParams = (targetPage = 1, overrideTerm) => {
        const params = { page: targetPage };
        const term = overrideTerm !== undefined ? overrideTerm : searchQuery;

        if (term.trim()) params.q = term.trim();
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.conditions.length)
            params.condition = filters.conditions.join(",");
        if (filters.locations.length)
            params.location = filters.locations.join(",");
        return params;
    };

    const loadParts = async (targetPage = 1, overrideTerm) => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/api/public/listings`, {
                params: buildParams(targetPage, overrideTerm)
            });
            setParts(res.data.items || []);
            setPage(res.data.page || targetPage);
            setTotalPages(res.data.totalPages || 1);
            setTotalResults(res.data.total || 0);
        } catch (err) {
            console.error("Error loading parts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadParts(1, "");
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        setHasSearched(true);
        setSearchLoading(true);
        await loadParts(1, q);
        setSearchLoading(false);
    };

    const handleClearSearch = async () => {
        setSearchQuery("");
        setHasSearched(false);
        await loadParts(1, "");
    };

    const handleChipSearch = async (chip) => {
        setSearchQuery(chip);
        setHasSearched(true);
        await loadParts(1, chip);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIdentifying(true);
        setUploadStatus("loading");
        setStatusMessage("");

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result.split(",")[1];
            try {
                const res = await fetch(IMAGE_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64 })
                });
                const data = await res.json();

                if (data.success) {
                    setUploadStatus("success");
                    setStatusMessage(`✅ Found: ${data.part_name}`);

                    setTimeout(async () => {
                        setSearchQuery(data.part_name);
                        setHasSearched(true);
                        await loadParts(1, data.part_name);
                        setIdentifying(false);
                    }, 1500);
                } else {
                    setUploadStatus("error");
                    setStatusMessage(data.message || "Could not identify part.");
                    setTimeout(() => setIdentifying(false), 3000);
                }
            } catch (err) {
                setUploadStatus("error");
                setStatusMessage("Connection to AI service failed.");
                setTimeout(() => setIdentifying(false), 3000);
            }
        };
        reader.readAsDataURL(file);
    };

    const toggleCondition = (value) => {
        setFilters((prev) => {
            const exists = prev.conditions.includes(value);
            const next = exists
                ? prev.conditions.filter((c) => c !== value)
                : [...prev.conditions, value];
            return { ...prev, conditions: next };
        });
    };

    const toggleLocation = (value) => {
        setFilters((prev) => {
            const exists = prev.locations.includes(value);
            const next = exists
                ? prev.locations.filter((c) => c !== value)
                : [...prev.locations, value];
            return { ...prev, locations: next };
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        loadParts(newPage);
    };

    const handleViewDetails = (id) => navigate(`/listings/${id}`);

    return (
        <div className="parts-page">
            <Header />

            <main className="container-fluid py-4">
                {/* Search Header */}
                <section className="mb-4">
                    <div className="hero-search-wrapper bg-dark text-light p-4 rounded-3 shadow">
                        <form onSubmit={handleSearch}>
                            <div className="input-group flex-wrap">
                                <label className="btn btn-outline-light btn-sm me-2 mb-2 d-flex align-items-center">
                                    <span className="material-symbols-outlined me-1" style={{ fontSize: 18 }}>
                                        image_search
                                    </span>
                                    Upload Image
                                    <input type="file" accept="image/*" className="d-none" onChange={handleImageUpload} />
                                </label>

                                <input
                                    type="text"
                                    className="form-control hero-search-input me-2 mb-2"
                                    placeholder="Search by part name or vehicle model"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />

                                {hasSearched && (
                                    <button type="button" className="btn btn-outline-light me-2 mb-2" onClick={handleClearSearch}>
                                        <span className="material-symbols-outlined" style={{ verticalAlign: "middle" }}>close</span>
                                    </button>
                                )}

                                <button className="btn btn-primary mb-2 px-4" type="submit" disabled={searchLoading}>
                                    {searchLoading ? <span className="spinner-border spinner-border-sm" /> : "Search"}
                                </button>
                            </div>
                        </form>

                        <div className="hero-filters mt-3 d-flex flex-wrap justify-content-center gap-2">
                            {["Engine", "Suspension", "Electrical", "Body Parts"].map((chip) => (
                                <button
                                    key={chip}
                                    className="btn btn-sm btn-outline-light px-3"
                                    onClick={() => handleChipSearch(chip)}
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="row">
                    {/* Filters Sidebar */}
                    <aside className="col-lg-3 mb-4">
                        <div className="card parts-filter-card shadow-sm border-0">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0 fw-bold">Filters</h6>
                                    <button className="btn btn-link btn-sm text-decoration-none p-0" onClick={() => loadParts(1, searchQuery)}>
                                        Apply
                                    </button>
                                </div>
                                <hr />

                                <div className="mb-3">
                                    <label className="small fw-semibold mb-2 d-block">Price Range (LKR)</label>
                                    <div className="d-flex gap-2">
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="Min"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                        />
                                        <input
                                            type="number"
                                            className="form-control form-control-sm"
                                            placeholder="Max"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="small fw-semibold mb-2 d-block">Condition</label>
                                    {["new", "used"].map((c) => (
                                        <div className="form-check" key={c}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`c-${c}`}
                                                checked={filters.conditions.includes(c)}
                                                onChange={() => toggleCondition(c)}
                                            />
                                            <label className="form-check-label small text-capitalize" htmlFor={`c-${c}`}>{c}</label>
                                        </div>
                                    ))}
                                </div>

                                <div className="mb-3">
                                    <label className="small fw-semibold mb-2 d-block">Location</label>
                                    {["Colombo", "Kandy", "Galle", "Kurunegala"].map((loc) => (
                                        <div className="form-check" key={loc}>
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`l-${loc}`}
                                                checked={filters.locations.includes(loc)}
                                                onChange={() => toggleLocation(loc)}
                                            />
                                            <label className="form-check-label small" htmlFor={`l-${loc}`}>{loc}</label>
                                        </div>
                                    ))}
                                </div>

                                <button className="btn btn-success btn-sm w-100 mt-2" onClick={() => loadParts(1)}>
                                    Update Results
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Results Grid */}
                    <section className="col-lg-9">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div className="small text-muted fw-medium">
                                {totalResults} results {searchQuery.trim() && ` for "${searchQuery}"`}
                            </div>
                            <select className="form-select form-select-sm w-auto">
                                <option>Most Relevant</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-success" />
                            </div>
                        ) : parts.length === 0 ? (
                            <div className="text-center py-5 bg-white rounded shadow-sm">
                                <p className="text-muted mb-0">No spare parts found matching your criteria.</p>
                            </div>
                        ) : (
                            <>
                                <div className="row g-3">
                                    {parts.map((p) => (
                                        <PartCard key={p._id} item={p} onViewDetails={handleViewDetails} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                <nav className="mt-5 d-flex justify-content-center">
                                    <ul className="pagination shadow-sm">
                                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => handlePageChange(page - 1)}>«</button>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                                                <button className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                                            <button className="page-link" onClick={() => handlePageChange(page + 1)}>»</button>
                                        </li>
                                    </ul>
                                </nav>
                            </>
                        )}
                    </section>
                </div>
            </main>

            <LoadingModal
                isOpen={identifying}
                status={uploadStatus}
                message={statusMessage}
            />
        </div>
    );
};

export default Parts;