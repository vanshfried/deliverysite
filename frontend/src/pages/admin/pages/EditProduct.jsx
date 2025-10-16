import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import QuillEditor from "./QuillEditor";
import Select from "react-select";
import "../css/CreateProduct.css";

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
    inStock: true,
    tags: [],
  });

  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]); // all tags from backend
  const [filteredTags, setFilteredTags] = useState([]); // tags filtered by category
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [images, setImages] = useState([]);
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);

  // ---------------- Load product + extras ----------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes, productRes] = await Promise.all([
          API.get("/admin/products/extras/categories"),
          API.get("/admin/products/extras/tags"),
          API.get(`/admin/products/${id}`),
        ]);

        setCategories(catRes.data.categories || []);

        // format tags for react-select
        const tagsData = (tagRes.data.tags || []).map((t) => ({
          value: t._id,
          label: t.name,
          categoryId: t.category?._id || null,
        }));
        setAllTags(tagsData);

        const p = productRes.data.product;

        // pre-select tags that match product
        const selectedTags = p.tags?.map((t) => ({
          value: t._id,
          label: t.name,
          categoryId: t.category?._id || null,
        })) || [];

        setFormData({
          name: p.name || "",
          price: p.price || "",
          discountPrice: p.discountPrice || "",
          category: p.category?._id || "",
          inStock: p.inStock ?? true,
          tags: selectedTags,
        });

        // filter tags by category initially
        const initialFiltered = tagsData.filter((t) => t.categoryId === p.category?._id);
        setFilteredTags(initialFiltered);

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

    // filter allTags by selected category
    const newFilteredTags = allTags.filter((tag) => tag.categoryId === selectedCat);
    setFilteredTags(newFilteredTags);

    // remove any selected tags that are not in this category
    const newSelectedTags = formData.tags.filter((t) => t.categoryId === selectedCat);

    setFormData((prev) => ({
      ...prev,
      category: selectedCat,
      tags: newSelectedTags,
    }));
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
    if (!formData.name || !formData.price) return showMessage("Name and Price are required!");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append("discountPrice", formData.discountPrice ? Number(formData.discountPrice) : 0);
    if (formData.category) data.append("category", formData.category);
    data.append("inStock", formData.inStock ? "true" : "false");
    data.append("description", description);

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
    <div className="create-product-container">
      <h2>Edit Product</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="product-form">
        {/* Product Details */}
        <div className="form-section">
          <div className="heading-instock">
            <h3>Product Details</h3>
            <label className="instock-label">
              <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} /> In Stock
            </label>
          </div>

          <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required />

          <div className="price-fields">
            <input type="number" name="price" placeholder="Price" value={formData.price} onChange={handleChange} required />
            <input type="number" name="discountPrice" placeholder="Discount Price (optional)" value={formData.discountPrice} onChange={handleChange} />
          </div>

          {/* Category */}
          <div className="category-section">
            <label>Category</label>
            <select value={formData.category} onChange={handleCategoryChange}>
              <option value="">-- Select a category --</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div className="tags-section">
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
        <div className="form-section">
          <h3>Product Description</h3>
          <QuillEditor ref={quillRef} value={description} onChange={setDescription} placeholder="Write a detailed product description..." />
        </div>

        {/* Images */}
        <div className="form-section">
          <h3>Images</h3>
          <label>Change Logo (optional): <input type="file" accept="image/*" onChange={handleLogoChange} /></label>
          <label>Replace Additional Images (max 4): <input type="file" accept="image/*" multiple onChange={handleImagesChange} /></label>
        </div>

        {/* Specs */}
        <div className="form-section">
          <h3>Specifications</h3>
          <table className="specs-table">
            <thead><tr><th>Key</th><th>Value</th><th>Action</th></tr></thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={i}>
                  <td><input value={spec.key} onChange={(e) => handleSpecChange(i, "key", e.target.value)} /></td>
                  <td><input value={spec.value} onChange={(e) => handleSpecChange(i, "value", e.target.value)} /></td>
                  <td><button type="button" className="small-btn" onClick={() => removeSpec(i)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="small-btn add-spec-btn" onClick={addSpec}>Add Specification</button>
        </div>

        {/* Submit */}
        <div className="form-section">
          <button type="submit" className="submit-btn">Update Product</button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
