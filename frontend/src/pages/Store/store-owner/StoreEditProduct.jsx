import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import QuillEditor from "./QuillEditor";
import styles from "../css/CreateProduct.module.css"; // same CSS

const StoreEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    inStock: true,
  });

  const [description, setDescription] = useState("");
  const [currentLogo, setCurrentLogo] = useState(null);
  const [newLogo, setNewLogo] = useState(null);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const quillRef = useRef(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ------------------------------
  // Load existing product details
  // ------------------------------
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await API.get(`/store-owner/store-products`);
        const product = res?.data?.products?.find((p) => p._id === id);

        if (!product) {
          showMessage("Product not found");
          return;
        }

        setFormData({
          name: product.name,
          price: product.price,
          discountPrice: product.discountPrice || "",
          inStock: product.inStock,
        });

        setDescription(product.description);
        setCurrentLogo(product.logo);
      } catch (err) {
        showMessage("❌ Error loading product");
      }
    };

    loadProduct();
  }, [id]);

  // ------------------------------
  // Handle Input Fields
  // ------------------------------
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLogoChange = (e) => {
    setNewLogo(e.target.files[0]);
  };

  // ------------------------------
  // Submit Edited Product
  // ------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append(
      "discountPrice",
      formData.discountPrice ? Number(formData.discountPrice) : 0
    );
    data.append("inStock", formData.inStock);
    data.append("description", description);

    if (newLogo) {
      data.append("logo", newLogo);
    }

    try {
      await API.put(`/store-owner/store-products/edit/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      showMessage("✅ Product updated!");
      setTimeout(() => navigate("/store-owner/dashboard"), 800);
    } catch (err) {
      showMessage(err.response?.data?.message || "❌ Error updating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createProductContainer}>
      <h2>Edit Product</h2>

      {message && <p className={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.productForm}>
        
        {/* Details Section */}
        <div className={styles.formSection}>
          <div className={styles.headingInstock}>
            <h3>Product Details</h3>

            <label className={styles.instockLabel}>
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
              />
              In Stock
            </label>
          </div>

          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
          />

          <div className={styles.priceFields}>
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
            />

            <input
              type="number"
              name="discountPrice"
              placeholder="Discount Price (optional)"
              value={formData.discountPrice}
              onChange={handleChange}
              min="1"
            />
          </div>
        </div>

        {/* Description Section */}
        <div className={styles.formSection}>
          <h3>Product Description</h3>

          <QuillEditor
            ref={quillRef}
            value={description}
            onChange={setDescription}
            placeholder="Write a detailed product description..."
          />
        </div>

        {/* Logo Section */}
        <div className={styles.formSection}>
          <h3>Product Image</h3>

          {currentLogo && (
            <div>
              <p>Current Logo:</p>
              <img
                src={currentLogo}
                alt="Current Logo"
                style={{ width: "120px", height: "120px", marginBottom: "10px", borderRadius: "5px", objectFit: "cover" }}
              />
            </div>
          )}

          <label>
            Change Logo:
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
        </div>

        {/* Submit */}
        <div className={styles.formSection}>
          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? "Updating..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreEditProduct;
