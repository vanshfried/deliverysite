import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import API from "../../../api/api";
import QuillEditor from "./QuillEditor";
import "../css/CreateProduct.css";

const CreateProduct = () => {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    category: "",
    inStock: true,
    tags: [], // now will store selected tag objects
  });

  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [images, setImages] = useState([]);
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);
  const [message, setMessage] = useState("");

  const quillRef = useRef(null);

  // Fetch categories and tags
  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const catRes = await API.get("/admin/products/extras/categories");
        const tagRes = await API.get("/admin/products/extras/tags");
        setCategories(catRes.data.categories || []);
        // convert to react-select format
        const tagOptions = (tagRes.data.tags || []).map((t) => ({ value: t._id, label: t.name }));
        setTags(tagOptions);
      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load categories or tags.");
      }
    };
    fetchExtras();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleCategoryChange = (e) => setFormData({ ...formData, category: e.target.value });

  const handleTagsChange = (selectedOptions) => {
    setFormData({ ...formData, tags: selectedOptions || [] });
  };

  const handleLogoChange = (e) => setLogo(e.target.files[0]);
  const handleImagesChange = (e) => setImages(Array.from(e.target.files).slice(0, 4));

  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...specs];
    updatedSpecs[index][field] = value;
    setSpecs(updatedSpecs);
  };
  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logo) return setMessage("❌ Logo is required!");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append("discountPrice", formData.discountPrice ? Number(formData.discountPrice) : 0);
    if (formData.category) data.append("category", formData.category);
    data.append("inStock", formData.inStock);
    data.append("description", description);
    data.append("logo", logo);
    images.forEach((img) => data.append("images", img));

    // Send only selected tag IDs
    formData.tags.forEach((tag) => data.append("tags", tag.value));

    if (specs.length) {
      const filteredSpecs = Object.fromEntries(
        specs.filter((s) => s.key).map((s) => [s.key, s.value])
      );
      data.append("specs", JSON.stringify(filteredSpecs));
    }

    try {
      await API.post("/admin/products/create", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Product created successfully!");
      setFormData({ name: "", price: "", discountPrice: "", category: "", inStock: true, tags: [] });
      setDescription("");
      setLogo(null);
      setImages([]);
      setSpecs([{ key: "", value: "" }]);
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(err.response?.data?.message || "❌ Error creating product");
    }
  };

  return (
    <div className="create-product-container">
      <h2>Create Product</h2>
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
              options={tags}
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
          <label>
            Logo (required):
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
          <label>
            Additional Images (max 4):
            <input type="file" accept="image/*" multiple onChange={handleImagesChange} />
          </label>
        </div>

        {/* Specs */}
        <div className="form-section">
          <h3>Specifications</h3>
          <table className="specs-table">
            <thead>
              <tr><th>Key</th><th>Value</th><th>Action</th></tr>
            </thead>
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
          <button type="submit" className="submit-btn">Create Product</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
