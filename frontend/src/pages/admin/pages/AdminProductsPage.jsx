import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import "../css/AdminProductsPage.css";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get("/admin/products");
      setProducts(res.data.products);
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await API.delete(`/admin/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length)
      return alert("Please select at least one product to delete.");
    if (
      !window.confirm(`Delete ${selectedProducts.length} selected product(s)?`)
    )
      return;

    try {
      await Promise.all(
        selectedProducts.map((id) => API.delete(`/admin/products/${id}`))
      );
      setProducts(products.filter((p) => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      alert("Selected products deleted successfully.");
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Failed to delete selected products.");
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/edit-product/${product._id}`);
  };

  if (loading) return <p className="loading-text">Loading products...</p>;
  if (!products.length) return <p className="loading-text">No products found.</p>;

  return (
    <div className="admin-products-container">
      <div className="products-header">
        <h1>Products</h1>
        <div className="header-buttons-full">
          <button
            className="create-btn-full"
            onClick={() => navigate("/admin/create-product")}
          >
            + Add New Product
          </button>

          <button
            className="bulk-delete-btn-full"
            onClick={handleBulkDelete}
            disabled={selectedProducts.length === 0}
          >
            🗑 Delete Selected{" "}
            {selectedProducts.length > 0 && `(${selectedProducts.length})`}
          </button>
        </div>
      </div>

      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={
                    selectedProducts.length === products.length &&
                    products.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>Logo</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price (₹)</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p._id)}
                    onChange={() => handleSelect(p._id)}
                  />
                </td>
                <td>
                  <img
                    src={`${API.URL}/${p.logo}`}
                    alt={p.name}
                    className="product-logo"
                  />
                </td>
                <td>{p.name}</td>
                <td>{p.category?.name || "Uncategorized"}</td>
                <td>₹{p.price.toFixed(2)}</td>
                <td>
                  <span
                    className={`stock-status ${
                      p.inStock ? "in-stock" : "out-stock"
                    }`}
                  >
                    {p.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleEdit(p)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;
