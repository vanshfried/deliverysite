// StoreCreateProduct.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import QuillEditor from "./QuillEditor";
import StoreOwnerLayout from "../components/StoreOwnerLayout"; // <-- use layout
import styles from "../css/CreateProduct.module.css";

const StoreCreateProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    inStock: true,
  });
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const quillRef = useRef(null);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLogoChange = (e) => {
    setLogo(e.target.files[0]);
    if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!logo) newErrors.logo = "Product logo is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showMessage("❌ Fix highlighted fields");
      return;
    }

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
    data.append("logo", logo);

    try {
      await API.post("/store-owner/store-products/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      showMessage("✅ Product created!");
      setTimeout(() => navigate("/store-owner/dashboard"), 800);
    } catch (err) {
      showMessage(err.response?.data?.message || "❌ Error creating product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoreOwnerLayout>
      <div className={styles.createProductContainer}>
        <h2>Create Product</h2>
        {message && <p className={styles.message}>{message}</p>}

        <form onSubmit={handleSubmit} className={styles.productForm}>
          {/* Product Details */}
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
              className={errors.name ? styles.errorInput : ""}
            />
            {errors.name && <p className={styles.errorText}>{errors.name}</p>}

            <div className={styles.priceFields}>
              <div>
                <input
                  type="number"
                  name="price"
                  placeholder="Price"
                  value={formData.price}
                  onChange={handleChange}
                  className={errors.price ? styles.errorInput : ""}
                />
                {errors.price && <p className={styles.errorText}>{errors.price}</p>}
              </div>

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

          {/* Description */}
          <div className={styles.formSection}>
            <h3>Product Description</h3>
            <QuillEditor
              ref={quillRef}
              value={description}
              onChange={setDescription}
              placeholder="Write a detailed product description..."
            />
          </div>

          {/* Logo */}
          <div className={styles.formSection}>
            <h3>Product Image</h3>
            <label>
              Logo (required):
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className={errors.logo ? styles.errorInput : ""}
              />
            </label>
            {errors.logo && <p className={styles.errorText}>{errors.logo}</p>}
          </div>

          <div className={styles.formSection}>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Creating product..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </StoreOwnerLayout>
  );
};

export default StoreCreateProduct;
