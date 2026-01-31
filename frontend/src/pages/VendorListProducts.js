import React, { useState, useEffect } from 'react';
import Header from "../components/header";
import VendorSidebar from '../components/VendorSidebar';
import './VendorListProducts.css';

const VendorListProducts = () => {
    const [listings, setListings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    description: '',
    condition: 'new',
    price: '',
    quantity_available: '',
    location: ''
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem('token');
    const [vendor, setVendor] = useState({ full_name: 'Loading...', email: '' });

useEffect(() => {
  const loadData = async () => {
    try {

    // 1. Load Vendor Profile
      const profileRes = await fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setVendor(profileData); // This updates the sidebar!
      }
      // Load listings
      const listingsRes = await fetch('http://localhost:5000/api/vendor/listings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(listingsData);
      }

      // Load products (non-blocking)
      const productsRes = await fetch('http://localhost:5000/api/products');
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err) {
      console.error('Load data error:', err);
    }
  };

  loadData();
}, [token]);  // only token changes


  const fetchListings = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/vendor/listings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setListings(data);
    } catch (err) {
      console.error(err);
    }
  };

    

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:5000/api/vendor/listings/${editingId}`
      : 'http://localhost:5000/api/vendor/listings';

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key]));
    
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend
      });
      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ product_id: '', title: '', description: '', condition: 'new', price: '', quantity_available: '', location: '', image: null });
        fetchListings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (listing) => {
    setFormData({
      product_id: listing.product_id._id,
      title: listing.title,
      description: listing.description || '',
      condition: listing.condition,
      price: listing.price,
      quantity_available: listing.quantity_available,
      location: listing.location || ''
    });
    setEditingId(listing._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this listing?')) return; 
    try {
      await fetch(`http://localhost:5000/api/vendor/listings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div className="vendor-list-products">
        <Header />
      <div className="container-fluid pt-4">
        <div className="row">
          <div className="col-lg-3">
            <VendorSidebar 
              vendor={vendor} 
              activeItem="list-products" 
              onLogout={handleLogout} 
            />
          </div>
          <div className="col-lg-9 p-4">
            <div className="page-header">
              <h4>My Listings ({listings.length})</h4>
           <button 
                className="btn px-4" 
                style={{ backgroundColor: '#0f766e', color: 'white', border: 'none' }} 
                onClick={() => setShowModal(true)}
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
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(listing => (
                    <tr key={listing._id}>
                      <td>
                        <img src={listing.image_url ? `http://localhost:5000/${listing.image_url}` : '/placeholder.jpg'} 
                             alt="listing" className="listing-thumb" />
                      </td>
                      <td>{listing.title}</td>
                      <td>{listing.product_id?.name}</td>
                      <td>Rs. {listing.price}</td>
                      <td>{listing.quantity_available}</td>
                      <td><span className={`badge ${listing.condition === 'new' ? 'bg-success' : 'bg-warning'}`}>{listing.condition}</span></td>
                      <td>
                        <span className={`badge ${listing.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {listing.status}
                        </span>
                      </td>
                      <td>{listing.location}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(listing)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(listing._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    {/* Add/Edit Modal */}
    {showModal && (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
            <h5>{editingId ? 'Edit Listing' : 'Add New Listing'}</h5>
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
            <label htmlFor="product-select" className="form-label">
                Product <span className="text-danger">*</span>
            </label>
            <select 
                id="product-select"
                name="product_id"
                className="form-select" 
                value={formData.product_id} 
                onChange={(e) => setFormData({...formData, product_id: e.target.value})}
                required
            >
                <option value="">Select Product</option>
                {products.map(p => (
                <option key={p._id} value={p._id}>
                    {p.name} {p.oem_part_number && `(${p.oem_part_number})`}
                </option>
                ))}
            </select>
            </div>

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
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required 
            />
            </div>

            <div className="mb-3">
            <label htmlFor="desc-input" className="form-label">Description</label>
            <textarea 
                id="desc-input"
                name="description"
                className="form-control" 
                rows="3"
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
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
                onChange={(e) => setFormData({...formData, condition: e.target.value})}
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
                onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                onChange={(e) => setFormData({...formData, quantity_available: e.target.value})}
                required 
                />
            </div>
            </div>

            <div className="mb-3">
            <label htmlFor="location-input" className="form-label">Location</label>
            <input 
                id="location-input"
                name="location"
                type="text"
                className="form-control" 
                placeholder="Negombo"
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            </div>

            <div className="mb-3">
            <label htmlFor="image-input" className="form-label">Image (Optional)</label>
            <input 
                id="image-input"
                name="image"
                type="file" 
                accept="image/*"
                className="form-control" 
                onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
            />
            </div>

            <div className="d-flex gap-2">
            <button 
                type="submit" 
                className="btn px-4"
                style={{ 
                    backgroundColor: '#0f766e', 
                    color: 'white', 
                    border: 'none' 
                }}
                disabled={loading}
                >
                {loading ? 'Saving...' : (editingId ? 'Update Listing' : 'Create Listing')}
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

    </div>
  );
};

export default VendorListProducts;
