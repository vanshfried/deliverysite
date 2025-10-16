import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../../api/api";
import "../css/AdminProductsPage.css";

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const navigate = useNavigate();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/admin/products");
        setProducts(res.data.products);
      } catch (err) {
        console.error("Failed to load products", err);
        alert("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Search + sort using useMemo for performance
  const filteredProducts = useMemo(() => {
    let temp = [...products];

    // Search by name or sub-category
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      temp = temp.filter((p) => {
        const subCat = p.subCategory?.name?.toLowerCase() || "";
        return p.name.toLowerCase().includes(q) || subCat.includes(q);
      });
    }

    // Sorting
    if (sortField) {
      temp.sort((a, b) => {
        let aVal, bVal;
        switch (sortField) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "subCategory":
            aVal = a.subCategory?.name?.toLowerCase() || "";
            bVal = b.subCategory?.name?.toLowerCase() || "";
            break;
          case "price":
            aVal = a.price;
            bVal = b.price;
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return temp;
  }, [products, searchQuery, sortField, sortOrder]);

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Select handlers
  const handleSelect = (id) =>
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  // Delete handlers
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await API.delete(`/admin/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      setSelectedProducts((prev) => prev.filter((pid) => pid !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete product.");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedProducts.length) return alert("Select products to delete.");
    if (!window.confirm(`Delete ${selectedProducts.length} products?`)) return;
    try {
      await Promise.all(selectedProducts.map((id) => API.delete(`/admin/products/${id}`)));
      setProducts(products.filter((p) => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
    } catch (err) {
      console.error(err);
      alert("Bulk delete failed.");
    }
  };

  if (loading) return <p className="loading-text">Loading products...</p>;
  if (!products.length) return <p className="loading-text">No products found.</p>;

  return (
    <div className="admin-products-container">
      <div className="products-header">
        <h1>Products</h1>
        <input
          type="text"
          placeholder="Search by name or sub-category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="header-buttons-full">
          <button className="create-btn-full" onClick={() => navigate("/admin/create-product")}>
            + Add Product
          </button>
          <button
            className="bulk-delete-btn-full"
            onClick={handleBulkDelete}
            disabled={!selectedProducts.length}
          >
            🗑 Delete Selected ({selectedProducts.length})
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
                  checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Logo</th>
              <th className="sortable" onClick={() => handleSort("name")}>
                Name {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="sortable" onClick={() => handleSort("subCategory")}>
                Sub-Category {sortField === "subCategory" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th className="sortable" onClick={() => handleSort("price")}>
                Price (₹) {sortField === "price" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p._id)}
                    onChange={() => handleSelect(p._id)}
                  />
                </td>
                <td>
                  <img src={`${API.URL}/${p.logo}`} alt={p.name} className="product-logo" />
                </td>
                <td>{p.name}</td>
                <td>{p.subCategory?.name || "Uncategorized"}</td>
                <td>₹{p.price.toFixed(2)}</td>
                <td>
                  <span className={`stock-status ${p.inStock ? "in-stock" : "out-stock"}`}>
                    {p.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="action-buttons">
                  <button onClick={() => navigate(`/admin/edit-product/${p._id}`)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(p._id)} className="delete-btn">
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
