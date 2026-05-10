import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import VendorSidebar from "../components/VendorSidebar";
import "./styles/VendorListProducts.css";

const API = "http://localhost:5000";

const EMPTY_COMPATIBILITY_ROW = { year: "", make: "", model: "" };

const EMPTY_LISTING = {
  product_id: "",
  product_request_id: "",
  title: "",
  description: "",
  condition: "new",
  price: "",
  quantity_available: "",
  location: "",
  oem_part_number: "",
  compatibility: [{ ...EMPTY_COMPATIBILITY_ROW }],
  image: null
};

const EMPTY_REQUEST = {
  name: "",
  description: "",
  oem_part_number: "",
  compatibility: [{ year: "", make: "", model: "" }]
};

const VendorListProducts = () => {
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(EMPTY_LISTING);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);

  const [products, setProducts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [productSearch, setProductSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");

  const token = localStorage.getItem("token");
  const [vendor, setVendor] = useState({ full_name: "Loading...", email: "", logo_url:"" });

  useEffect(() => {
    const loadData = async () => {
      try {
        const profileRes = await fetch(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setVendor({
    ...profileData,
    logo_url: profileData.logo_url
      ? `${API}/${profileData.logo_url.replace(/^\/+/, "")}`
      : ""
  });
        }

        await Promise.all([fetchListings(), fetchProducts(""), fetchMyRequests()]);
      } catch (err) {
        console.error("Load data error:", err);
      }
    };

    loadData();
  }, [token]);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API}/api/vendor/listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (q = "") => {
    try {
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(q)}&limit=200`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch(`${API}/api/product-requests/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMyRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchProducts(productSearch);
    }, 250);
    return () => clearTimeout(t);
  }, [productSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();

    return products.filter((p) => {
      if (!q) return true;

      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.oem_part_number || "").toLowerCase().includes(q) ||
        (p.compatibility || []).some(
          (c) =>
            (c.make || "").toLowerCase().includes(q) ||
            (c.model || "").toLowerCase().includes(q) ||
            String(c.year || "").includes(q)
        )
      );
    });
  }, [products, productSearch]);

  const pendingOrApprovedRequests = useMemo(() => {
    return myRequests.filter((r) => r.status === "pending" || r.status === "approved");
  }, [myRequests]);

  const resetListingForm = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_LISTING,
      compatibility: [{ ...EMPTY_COMPATIBILITY_ROW }]
    });
    setProductSearch("");
  };

  const setCompatibilityRow = (index, field, value) => {
    setFormData((prev) => {
      const next = [...prev.compatibility];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, compatibility: next };
    });
  };

  const addCompatibilityRow = () => {
    setFormData((prev) => ({
      ...prev,
      compatibility: [...prev.compatibility, { ...EMPTY_COMPATIBILITY_ROW }]
    }));
  };

  const removeCompatibilityRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      compatibility:
        prev.compatibility.length === 1
          ? [{ ...EMPTY_COMPATIBILITY_ROW }]
          : prev.compatibility.filter((_, i) => i !== index)
    }));
  };

  const addRequestCompatibilityRow = () => {
    setRequestForm((prev) => ({
      ...prev,
      compatibility: [...prev.compatibility, { year: "", make: "", model: "" }]
    }));
  };

  const removeRequestCompatibilityRow = (index) => {
    setRequestForm((prev) => ({
      ...prev,
      compatibility:
        prev.compatibility.length === 1
          ? [{ year: "", make: "", model: "" }]
          : prev.compatibility.filter((_, i) => i !== index)
    }));
  };

  const updateRequestCompatibility = (index, field, value) => {
    setRequestForm((prev) => {
      const next = [...prev.compatibility];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, compatibility: next };
    });
  };

  const applyCompatibilityFromProduct = (productId) => {
    const selected = products.find((p) => p._id === productId);
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      oem_part_number: prev.oem_part_number || selected.oem_part_number || "",
      compatibility:
        selected.compatibility?.length > 0
          ? selected.compatibility.map((c) => ({
            year: c.year || "",
            make: c.make || "",
            model: c.model || ""
          }))
          : [{ ...EMPTY_COMPATIBILITY_ROW }]
    }));
  };

  const applyFromRequest = (requestId) => {
    const selected = myRequests.find((r) => r._id === requestId);
    if (!selected) return;

    setFormData((prev) => ({
      ...prev,
      oem_part_number: prev.oem_part_number || selected.oem_part_number || "",
      compatibility:
        selected.compatibility?.length > 0
          ? selected.compatibility.map((c) => ({
            year: c.year || "",
            make: c.make || "",
            model: c.model || ""
          }))
          : [{ ...EMPTY_COMPATIBILITY_ROW }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API}/api/vendor/listings/${editingId}`
      : `${API}/api/vendor/listings`;

    const normalizedCompatibility = formData.compatibility
      .map((item) => ({
        year: Number(item.year),
        make: item.make.trim(),
        model: item.model.trim()
      }))
      .filter((item) => item.year && item.make && item.model);

    const formDataToSend = new FormData();
    formDataToSend.append("product_id", formData.product_id);
    formDataToSend.append("product_request_id", formData.product_request_id);
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("condition", formData.condition);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("quantity_available", formData.quantity_available);
    formDataToSend.append("location", formData.location);
    formDataToSend.append("oem_part_number", formData.oem_part_number);
    formDataToSend.append("compatibility", JSON.stringify(normalizedCompatibility));

    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to save listing");
        return;
      }

      setShowModal(false);
      resetListingForm();
      fetchListings();
      fetchMyRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to save listing");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing) => {
    setFormData({
      product_id: listing.product_id?._id || "",
      product_request_id: listing.product_request_id?._id || "",
      title: listing.title || "",
      description: listing.description || "",
      condition: listing.condition || "new",
      price: listing.price || "",
      quantity_available: listing.quantity_available || "",
      location: listing.location || "",
      oem_part_number: listing.oem_part_number || "",
      compatibility:
        listing.compatibility?.length > 0
          ? listing.compatibility.map((c) => ({
            year: c.year || "",
            make: c.make || "",
            model: c.model || ""
          }))
          : [{ ...EMPTY_COMPATIBILITY_ROW }],
      image: null
    });

    setEditingId(listing._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this listing?")) return;

    try {
      await fetch(`${API}/api/vendor/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setRequestMessage("");

    try {
      const payload = {
        ...requestForm,
        compatibility: requestForm.compatibility
          .map((item) => ({
            year: Number(item.year),
            make: item.make.trim(),
            model: item.model.trim()
          }))
          .filter((item) => item.year && item.make && item.model)
      };

      const res = await fetch(`${API}/api/product-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        setRequestMessage(data.message || "Failed to submit request");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        product_id: "",
        product_request_id: data._id,
        oem_part_number: data.oem_part_number || prev.oem_part_number,
        compatibility:
          data.compatibility?.length > 0
            ? data.compatibility.map((c) => ({
              year: c.year || "",
              make: c.make || "",
              model: c.model || ""
            }))
            : prev.compatibility
      }));

      setRequestMessage("Request submitted. This listing will stay pending until admin approves.");
      setRequestForm(EMPTY_REQUEST);
      await fetchMyRequests();

      setTimeout(() => {
        setShowRequestModal(false);
        setRequestMessage("");
      }, 1200);
    } catch (err) {
      console.error(err);
      setRequestMessage("Failed to submit request");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      const res = await fetch(`${API}/api/vendor/listings/${id}/activate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to activate listing");
        return;
      }

      fetchListings();
      fetchMyRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to activate listing");
    }
  };

  const handleDeactivate = async (id) => {
    try {
      const res = await fetch(`${API}/api/vendor/listings/${id}/deactivate`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to deactivate listing");
        return;
      }

      fetchListings();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate listing");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="vendor-list-products">
      <Header />
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-3" style={{ width: "21%" }}>
            <VendorSidebar
              vendor={vendor}
              activeItem="list-products"
              onLogout={handleLogout}
            />
          </div>

          <div className="col-lg-9 pt-5" style={{ paddingRight: "3.5rem" }}>
            <div className="page-header">
              <h4>My Listings ({listings.length})</h4>
              <button
                className="btn px-4"
                style={{ backgroundColor: "#0f766e", color: "white", border: "none" }}
                onClick={() => {
                  resetListingForm();
                  setShowModal(true);
                }}
              >
                + Add New Listing
              </button>
            </div>

            <div className="listings-table">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing._id}>
                      <td>
                        <img
                          src={
                            listing.image_url
                              ? `${API}/${listing.image_url}`
                              : "/placeholder.jpg"
                          }
                          alt="listing"
                          className="listing-thumb"
                        />
                      </td>
                      <td>{listing.title}</td>
                      <td>
                        {listing.product_id?.name ||
                          listing.product_request_id?.name ||
                          "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${listing.status === "active"
                              ? "bg-success"
                              : listing.status === "inactive"
                                ? "bg-secondary"
                                : "bg-warning text-dark"
                            }`}
                        >
                          {listing.status === "pending_product_approval"
                            ? "Pending Product Approval"
                            : listing.status === "inactive" &&
                              listing.product_request_id?.status === "approved"
                              ? "Ready to Activate"
                              : listing.status}
                        </span>
                      </td>
                      <td>Rs. {listing.price}</td>
                      <td>{listing.quantity_available}</td>
                      <td>
                        <span
                          className={`badge ${listing.condition === "new" ? "bg-success" : "bg-warning"
                            }`}
                        >
                          {listing.condition}
                        </span>
                      </td>
                      <td>{listing.location}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(listing)}
                          >
                            Edit
                          </button>

                          {listing.status === "inactive" &&
                            (!listing.product_request_id ||
                              listing.product_request_id.status === "approved") && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleActivate(listing._id)}
                              >
                                Activate
                              </button>
                            )}

                          {listing.status === "active" && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => handleDeactivate(listing._id)}
                            >
                              Deactivate
                            </button>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(listing._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {listings.length === 0 && (
                    <tr>
                      <td colSpan="9" className="text-center text-muted py-4">
                        No listings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>{editingId ? "Edit Listing" : "Add New Listing"}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="product-search" className="form-label">
                  Search Master Product
                </label>
                <input
                  id="product-search"
                  type="text"
                  className="form-control"
                  placeholder="Search by name, OEM, make, model..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>

              <div className="mb-2 d-flex justify-content-between align-items-center">
                <label htmlFor="product-select" className="form-label mb-0">
                  Existing Master Product
                </label>
                {!editingId && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    onClick={() => setShowRequestModal(true)}
                  >
                    Can’t find it? Request new product
                  </button>
                )}
              </div>

              <div className="mb-3">
                <select
                  id="product-select"
                  className="form-select"
                  value={formData.product_id}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      product_id: value,
                      product_request_id: ""
                    }));
                    if (value) applyCompatibilityFromProduct(value);
                  }}
                >
                  <option value="">Select Product</option>
                  {filteredProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                      {p.oem_part_number ? ` (${p.oem_part_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {!editingId && pendingOrApprovedRequests.length > 0 && (
                <div className="mb-3">
                  <label className="form-label">Or Use Your Product Request</label>
                  <select
                    className="form-select"
                    value={formData.product_request_id}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        product_request_id: value,
                        product_id: ""
                      }));
                      if (value) applyFromRequest(value);
                    }}
                  >
                    <option value="">Select Request</option>
                    {pendingOrApprovedRequests.map((req) => (
                      <option key={req._id} value={req._id}>
                        {req.name} - {req.status}
                        {req.oem_part_number ? ` (${req.oem_part_number})` : ""}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Pending requests create a saved listing that waits for admin approval.
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label htmlFor="title-input" className="form-label">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  id="title-input"
                  name="title"
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="desc-input" className="form-label">
                  Description
                </label>
                <textarea
                  id="desc-input"
                  name="description"
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">OEM Part Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 04465-0K060"
                  value={formData.oem_part_number}
                  onChange={(e) =>
                    setFormData({ ...formData, oem_part_number: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">
                    Compatibility (Year / Make / Model)
                  </label>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={addCompatibilityRow}
                  >
                    + Add Compatibility
                  </button>
                </div>

                {formData.compatibility.map((item, index) => (
                  <div className="row g-2 mb-2" key={index}>
                    <div className="col-md-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Year"
                        value={item.year}
                        onChange={(e) =>
                          setCompatibilityRow(index, "year", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Make"
                        value={item.make}
                        onChange={(e) =>
                          setCompatibilityRow(index, "make", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Model"
                        value={item.model}
                        onChange={(e) =>
                          setCompatibilityRow(index, "model", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={() => removeCompatibilityRow(index)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

                <div className="form-text">
                  Add the exact vehicle fitment for this specific listing.
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="condition-select" className="form-label">
                    Condition <span className="text-danger">*</span>
                  </label>
                  <select
                    id="condition-select"
                    name="condition"
                    className="form-select"
                    value={formData.condition}
                    onChange={(e) =>
                      setFormData({ ...formData, condition: e.target.value })
                    }
                    required
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label htmlFor="price-input" className="form-label">
                    Price (Rs.) <span className="text-danger">*</span>
                  </label>
                  <input
                    id="price-input"
                    name="price"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="qty-input" className="form-label">
                    Quantity <span className="text-danger">*</span>
                  </label>
                  <input
                    id="qty-input"
                    name="quantity_available"
                    type="number"
                    min="0"
                    className="form-control"
                    value={formData.quantity_available}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity_available: e.target.value
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="mb-3 mt-3">
                <label htmlFor="location-input" className="form-label">
                  Location
                </label>
                <input
                  id="location-input"
                  name="location"
                  type="text"
                  className="form-control"
                  placeholder="Negombo"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label htmlFor="image-input" className="form-label">
                  Image (Optional)
                </label>
                <input
                  id="image-input"
                  name="image"
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.files[0] })
                  }
                />
              </div>

              <div className="alert alert-light border small">
                If you use a pending product request, the listing will be saved but remain
                unavailable until the admin approves the product type.
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn px-4"
                  style={{
                    backgroundColor: "#0f766e",
                    color: "white",
                    border: "none"
                  }}
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingId
                      ? "Update Listing"
                      : "Create Listing"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h5>Request New Master Product</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowRequestModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRequest}>
              {requestMessage && (
                <div className="alert alert-info py-2">{requestMessage}</div>
              )}

              <div className="mb-3">
                <label className="form-label">
                  Product Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={requestForm.name}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">OEM Part Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={requestForm.oem_part_number}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      oem_part_number: e.target.value
                    })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={requestForm.description}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, description: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Compatibility</label>
                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={addRequestCompatibilityRow}
                  >
                    + Add Compatibility
                  </button>
                </div>

                {requestForm.compatibility.map((item, index) => (
                  <div className="row g-2 mb-2" key={index}>
                    <div className="col-md-3">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Year"
                        value={item.year}
                        onChange={(e) =>
                          updateRequestCompatibility(index, "year", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Make"
                        value={item.make}
                        onChange={(e) =>
                          updateRequestCompatibility(index, "make", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Model"
                        value={item.model}
                        onChange={(e) =>
                          updateRequestCompatibility(index, "model", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-1">
                      <button
                        type="button"
                        className="btn btn-outline-danger w-100"
                        onClick={() => removeRequestCompatibilityRow(index)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn px-4"
                  style={{
                    backgroundColor: "#0f766e",
                    color: "white",
                    border: "none"
                  }}
                  disabled={requestLoading}
                >
                  {requestLoading ? "Submitting..." : "Submit Request"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorListProducts;