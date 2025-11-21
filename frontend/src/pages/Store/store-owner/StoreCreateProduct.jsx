import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import API from "../api/api";
import QuillEditor from "./QuillEditor";
import styles from "../css/CreateProduct.module.css";

const StoreCreateProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    category: "",
    subCategory: "",
    inStock: true,
    tags: [],
  });

  const [categories, setCategories] = useState([]);
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);

  const [allTags, setAllTags] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);

  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [images, setImages] = useState([]);

  const [specs, setSpecs] = useState([{ key: "", value: "" }]);

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const quillRef = useRef(null);

  // ------------------------------------------------------------
  // Load categories, subcategories, tags (from admin extras route)
  // ------------------------------------------------------------
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [catRes, subRes, tagRes] = await Promise.all([
          API.get("/admin/products/extras/categories"),
          API.get("/admin/products/extras/subcategories"),
          API.get("/admin/products/extras/tags"),
        ]);

        setCategories(catRes.data.categories || []);
        setAllSubCategories(subRes.data.subcategories || []);

        const tagsFormatted = (tagRes.data.tags || []).map((t) => ({
          value: t._id,
          label: t.name,
          categoryId: t.category?._id || null,
        }));

        setAllTags(tagsFormatted);
        setFilteredTags(tagsFormatted);
      } catch (err) {
        console.error(err);
        showMessage("❌ Failed to load categories or tags");
      }
    };

    fetchExtras();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ------------------------------------------------------------
  // FORM HANDLERS
  // ------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;

    const filteredSubCats = allSubCategories.filter(
      (sc) => sc.parentCategory?._id === selectedCat
    );

    const filteredTagsByCategory = allTags.filter(
      (t) => t.categoryId === selectedCat
    );

    // Reset subcategory & tags if they do not belong
    setSubCategories(filteredSubCats);
    setFilteredTags(filteredTagsByCategory);

    setFormData((prev) => ({
      ...prev,
      category: selectedCat,
      subCategory: "",
      tags: [],
    }));

    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
  };

  const handleSubCategoryChange = (e) => {
    setFormData((prev) => ({ ...prev, subCategory: e.target.value }));

    if (errors.subCategory)
      setErrors((prev) => ({ ...prev, subCategory: "" }));
  };

  const handleTagsChange = (selectedOptions) => {
    setFormData((prev) => ({ ...prev, tags: selectedOptions || [] }));
  };

  const handleLogoChange = (e) => {
    setLogo(e.target.files[0]);

    if (errors.logo) setErrors((prev) => ({ ...prev, logo: "" }));
  };

  const handleImagesChange = (e) => {
    setImages(Array.from(e.target.files).slice(0, 4));
  };

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const updated = [...prev];
      updated[index][field] = value;

      if (index === prev.length - 1 && updated[index].key) {
        updated.push({ key: "", value: "" });
      }

      return updated;
    });
  };

  const removeSpec = (index) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------------------------------------------------
  // SUBMIT HANDLER (Store Owner Product Creation)
  // ------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price) newErrors.price = "Price is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subCategory)
      newErrors.subCategory = "Subcategory is required";
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
    data.append("subCategory", formData.subCategory);
    data.append("description", description);

    data.append("logo", logo);
    images.forEach((img) => data.append("images", img));

    formData.tags.forEach((tag) => data.append("tags", tag.value));

    const filteredSpecs = Object.fromEntries(
      specs.filter((s) => s.key).map((s) => [s.key, s.value])
    );

    if (Object.keys(filteredSpecs).length)
      data.append("specs", JSON.stringify(filteredSpecs));

    try {
      await API.post("/store-owner/store-products/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      showMessage("✅ Product created!");

      setTimeout(() => navigate("/store-owner/products"), 800);
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.message || "❌ Error creating product");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // JSX RETURN
  // ------------------------------------------------------------
  return (
    <div className={styles.createProductContainer}>
      <h2>Create Product</h2>

      {message && <p className={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.productForm}>
        
        {/* Product Info */}
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
              {errors.price && (
                <p className={styles.errorText}>{errors.price}</p>
              )}
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

          {/* Category */}
          <div className={styles.categorySection}>
            <label>Category</label>

            <select
              value={formData.category}
              onChange={handleCategoryChange}
              className={errors.category ? styles.errorInput : ""}
            >
              <option value="">-- Select category --</option>

              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {errors.category && (
              <p className={styles.errorText}>{errors.category}</p>
            )}
          </div>

          {/* Subcategory */}
          <div className={styles.categorySection}>
            <label>Subcategory</label>

            <select
              value={formData.subCategory}
              onChange={handleSubCategoryChange}
              className={errors.subCategory ? styles.errorInput : ""}
            >
              <option value="">-- Select subcategory --</option>

              {subCategories.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.name}
                </option>
              ))}
            </select>

            {errors.subCategory && (
              <p className={styles.errorText}>{errors.subCategory}</p>
            )}
          </div>

          {/* Tags */}
          <div className={styles.tagsSection}>
            <label>Tags</label>

            <Select
              isMulti
              options={filteredTags}
              value={formData.tags}
              onChange={handleTagsChange}
              placeholder="Select tags..."
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

        {/* Images */}
        <div className={styles.formSection}>
          <h3>Images</h3>

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

          <label>
            Additional Images (max 4):
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
            />
          </label>
        </div>

        {/* Specifications */}
        <div className={styles.formSection}>
          <h3>Specifications</h3>

          <table className={styles.specsTable}>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {specs.map((spec, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={spec.key}
                      onChange={(e) =>
                        handleSpecChange(i, "key", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      value={spec.value}
                      onChange={(e) =>
                        handleSpecChange(i, "value", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    {i < specs.length - 1 && (
                      <button
                        type="button"
                        className={styles.smallBtn}
                        onClick={() => removeSpec(i)}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Submit */}
        <div className={styles.formSection}>
          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? "Creating product..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreCreateProduct;
