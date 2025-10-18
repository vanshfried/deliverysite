import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import QuillEditor from "./QuillEditor";
import Select from "react-select";
import styles from "../css/CreateProduct.module.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const quillRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

  // ---------------- Load product + extras ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, subRes, tagRes, productRes] = await Promise.all([
          API.get("/admin/products/extras/categories"),
          API.get("/admin/products/extras/subcategories"),
          API.get("/admin/products/extras/tags"),
          API.get(`/admin/products/${id}`),
        ]);

        setCategories(catRes.data.categories || []);
        setAllSubCategories(subRes.data.subcategories || []);
        setAllTags(
          (tagRes.data.tags || []).map((t) => ({
            value: t._id,
            label: t.name,
            categoryId: t.category?._id || null,
          }))
        );

        const p = productRes.data.product;

        const selectedTags = (p.tags || []).map((t) => ({
          value: t._id,
          label: t.name,
          categoryId: t.category?._id || null,
        }));

        setFormData({
          name: p.name || "",
          price: p.price || "",
          discountPrice: p.discountPrice || "",
          category: p.subCategory?.parentCategory?._id || "",
          subCategory: p.subCategory?._id || "",
          inStock: p.inStock ?? true,
          tags: selectedTags,
        });

        const filteredSubCats = (subRes.data.subcategories || []).filter(
          (sc) => sc.parentCategory?._id === p.subCategory?.parentCategory?._id
        );
        setSubCategories(filteredSubCats);

        const filteredTagsInitial = (tagRes.data.tags || [])
          .filter((t) => t.category?._id === p.subCategory?.parentCategory?._id)
          .map((t) => ({
            value: t._id,
            label: t.name,
            categoryId: t.category?._id || null,
          }));
        setFilteredTags(filteredTagsInitial);

        setDescription(p.description || "");
        setSpecs(
          p.specs
            ? Object.entries(p.specs).map(([key, value]) => ({ key, value }))
            : [{ key: "", value: "" }]
        );

        setLoading(false);
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load product data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ---------------- Message helper ----------------
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ---------------- Handlers ----------------
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;

    const filteredSubCats = allSubCategories.filter(
      (sc) => sc.parentCategory?._id === selectedCat
    );
    setSubCategories(filteredSubCats);

    const newSubCat = filteredSubCats.some((sc) => sc._id === formData.subCategory)
      ? formData.subCategory
      : "";

    const newFilteredTags = allTags.filter((t) => t.categoryId === selectedCat);
    const newSelectedTags = formData.tags.filter((t) => t.categoryId === selectedCat);

    setFormData((prev) => ({
      ...prev,
      category: selectedCat,
      subCategory: newSubCat,
      tags: newSelectedTags,
    }));
    setFilteredTags(newFilteredTags);
  };

  const handleSubCategoryChange = (e) => {
    setFormData((prev) => ({ ...prev, subCategory: e.target.value }));
  };

  const handleTagsChange = (selected) => {
    setFormData((prev) => ({ ...prev, tags: selected || [] }));
  };

  const handleLogoChange = (e) => setLogo(e.target.files[0]);
  const handleImagesChange = (e) => setImages(Array.from(e.target.files).slice(0, 4));

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const addSpec = () => setSpecs((prev) => [...prev, { key: "", value: "" }]);
  const removeSpec = (index) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  // ---------------- Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.subCategory)
      return showMessage("Name, Price, and Subcategory are required!");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append("discountPrice", formData.discountPrice ? Number(formData.discountPrice) : 0);
    data.append("inStock", formData.inStock ? "true" : "false");
    data.append("description", description);
    data.append("subCategory", formData.subCategory);

    if (logo) data.append("logo", logo);
    images.forEach((img) => data.append("images", img));
    formData.tags.forEach((tag) => data.append("tags[]", tag.value));

    const filteredSpecs = Object.fromEntries(specs.filter((s) => s.key).map((s) => [s.key, s.value]));
    if (Object.keys(filteredSpecs).length) data.append("specs", JSON.stringify(filteredSpecs));

    try {
      await API.put(`/admin/products/${id}`, data, { headers: { "Content-Type": "multipart/form-data" } });
      showMessage("✅ Product updated successfully!");
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.message || "❌ Error updating product");
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div className={styles.createProductContainer}>
      <h2>Edit Product</h2>
      {message && <p className={styles.message}>{message}</p>}

      <form onSubmit={handleSubmit} className={styles.productForm}>
        {/* Product Details */}
        <div className={styles.formSection}>
          <div className={styles.headingInstock}>
            <h3>Product Details</h3>
            <label className={styles.instockLabel}>
              <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} /> In Stock
            </label>
          </div>

          <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required />

          <div className={styles.priceFields}>
            <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required />
            <input type="number" name="discountPrice" placeholder="Discount Price (optional)" value={formData.discountPrice} onChange={handleChange} />
          </div>

          {/* Category */}
          <div className={styles.categorySection}>
            <label>Category</label>
            <select value={formData.category} onChange={handleCategoryChange}>
              <option value="">-- Select a category --</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>

          {/* SubCategory */}
          <div className={styles.categorySection}>
            <label>Subcategory</label>
            <select value={formData.subCategory} onChange={handleSubCategoryChange}>
              <option value="">-- Select a subcategory --</option>
              {subCategories.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
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
          <QuillEditor ref={quillRef} value={description} onChange={setDescription} placeholder="Write a detailed product description..." />
        </div>

        {/* Images */}
        <div className={styles.formSection}>
          <h3>Images</h3>
          <label>Change Logo (optional): <input type="file" accept="image/*" onChange={handleLogoChange} /></label>
          <label>Replace Additional Images (max 4): <input type="file" accept="image/*" multiple onChange={handleImagesChange} /></label>
        </div>

        {/* Specs */}
        <div className={styles.formSection}>
          <h3>Specifications</h3>
          <table className={styles.specsTable}>
            <thead><tr><th>Key</th><th>Value</th><th>Action</th></tr></thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={i}>
                  <td><input value={spec.key} onChange={(e) => handleSpecChange(i, "key", e.target.value)} /></td>
                  <td><input value={spec.value} onChange={(e) => handleSpecChange(i, "value", e.target.value)} /></td>
                  <td><button type="button" className={styles.smallBtn} onClick={() => removeSpec(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className={`${styles.smallBtn} ${styles.addSpecBtn}`} onClick={addSpec}>Add Specification</button>
        </div>

        {/* Submit */}
        <div className={styles.formSection}>
          <button type="submit" className={styles.submitBtn}>Update Product</button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
