import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./styles/AdminProductListings.css";
import AdminHeader from "../admin/components/AdminHeader";
import AdminSidebar from "../admin/components/AdminSidebar";

const API = "http://localhost:5000";

const AdminProductListings = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [product, setProduct] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token || localStorage.getItem("role") !== "admin") {
      navigate("/admin/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productRes, listingsRes] = await Promise.all([
        axios.get(`${API}/api/admin/listings/product/${productId}/meta`, { headers }),
        axios.get(
          `${API}/api/admin/listings?product_id=${productId}&search=${encodeURIComponent(search)}`,
          { headers }
        )
      ]);

      setProduct(productRes.data);
      setListings(listingsRes.data);
    } catch (err) {
      console.error("Fetch admin product listings error:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, search]);

  useEffect(() => {
    const delay = setTimeout(fetchData, 300);
    return () => clearTimeout(delay);
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return listings.filter((item) => {
      const vendorName =
        item.vendor_id?.business_name ||
        item.vendor_id?.full_name ||
        item.vendor_id?.email ||
        "";

      return (
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.location?.toLowerCase().includes(q) ||
        item.oem_part_number?.toLowerCase().includes(q) ||
        vendorName.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
      );
    });
  }, [listings, search]);

  const activeCount = filtered.filter((l) => l.status === "active").length;
  const inactiveCount = filtered.filter((l) => l.status === "inactive").length;
  const pendingCount = filtered.filter((l) => l.status === "pending_product_approval").length;

  const statusClass = (status) => {
    if (status === "active") return "apl-badge apl-active";
    if (status === "inactive") return "apl-badge apl-inactive";
    return "apl-badge apl-pending";
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader onLogout={handleLogout} />

      <div className="ad-layout">
        <AdminSidebar activeItem="products" />

        <main className="ad-main">
          <div className="ap-page-header">
            <div>
              <h4 className="ap-page-title">Available Listings</h4>
              <p className="ap-page-sub">
                {product
                  ? `Vendor listings linked to product type: ${product.name}`
                  : "Manage listings linked to this product type."}
              </p>
            </div>

            <button className="ap-add-btn" onClick={() => navigate("/admin/products")}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Product Types
            </button>
          </div>

          <div className="ap-stats-row mb-4">
            <div className="ap-stat">
              <div className="ap-stat-val">{filtered.length}</div>
              <div className="ap-stat-lbl">Total Listings</div>
            </div>

            <div className="ap-stat">
              <div className="ap-stat-val">{activeCount}</div>
              <div className="ap-stat-lbl">Active Listings</div>
            </div>

            <div className="ap-stat">
              <div className="ap-stat-val">{inactiveCount}</div>
              <div className="ap-stat-lbl">Inactive Listings</div>
            </div>

            <div className="ap-stat">
              <div className="ap-stat-val">{pendingCount}</div>
              <div className="ap-stat-lbl">Pending Approval</div>
            </div>
          </div>

          <div className="ad-card">
            <div className="ap-search-row">
              <div className="ap-search-wrap">
                <span className="material-symbols-outlined ap-search-icon">search</span>
                <input
                  type="text"
                  className="ap-search-input"
                  placeholder="Search by title, vendor, OEM, location, or status…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button className="ap-search-clear" onClick={() => setSearch("")}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              <span className="ap-count">
                {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="ap-center">
                <div className="spinner-border text-success" />
                <p className="mt-3 text-muted small">Loading listings…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="ap-center">
                <span className="material-symbols-outlined ap-empty-icon">inventory_2</span>
                <p className="text-muted small mt-2">
                  {search
                    ? `No listings found for "${search}"`
                    : "No vendor listings are linked to this product type yet."}
                </p>
              </div>
            ) : (
              <div className="ap-table-wrap">
                <table className="table table-hover ap-table mb-0">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Listing Title</th>
                      <th>Vendor</th>
                      <th>Condition</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, index) => (
                      <tr key={item._id}>
                        <td className="ap-td-num">{index + 1}</td>
                        <td>
                          <div className="ap-product-name">{item.title}</div>
                          {item.oem_part_number ? (
                            <div className="mt-1">
                              <span className="ap-oem">{item.oem_part_number}</span>
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div className="ap-product-name">
                            {item.vendor_id?.business_name ||
                              item.vendor_id?.full_name ||
                              "Vendor"}
                          </div>
                          <div className="ap-desc-text">
                            {item.vendor_id?.email || "—"}
                          </div>
                        </td>
                        <td style={{ textTransform: "capitalize" }}>{item.condition}</td>
                        <td>LKR {Number(item.price || 0).toLocaleString()}</td>
                        <td>{item.quantity_available}</td>
                        <td>
                          <span className={statusClass(item.status)}>
                            {item.status === "pending_product_approval"
                              ? "Pending Approval"
                              : item.status}
                          </span>
                        </td>
                        <td>{item.location || "—"}</td>
                        <td className="text-muted small">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProductListings;