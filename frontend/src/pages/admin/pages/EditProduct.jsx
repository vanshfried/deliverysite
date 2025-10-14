import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api/api";
import QuillEditor from "./QuillEditor";
import "../css/CreateProduct.css";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountPrice: "",
    category: "", // optional
    inStock: true,
    tags: [],
  });
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState(null);
  const [images, setImages] = useState([]);
  const [tagsInput, setTagsInput] = useState("");
  const [specs, setSpecs] = useState([{ key: "", value: "" }]);

  const quillRef = useRef(null);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/admin/products/${id}`);
        const p = res.data.product;

        setFormData({
          name: p.name || "",
          price: p.price || "",
          discountPrice: p.discountPrice || "",
          category: p.category?._id || "",
          inStock: p.inStock ?? true,
          tags: p.tags || [],
        });

        setDescription(p.description || "");
        setTagsInput(p.tags?.join(", ") || "");

        if (p.specs) {
          setSpecs(Object.entries(p.specs).map(([key, value]) => ({ key, value })));
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load product details");
        navigate("/admin/products");
      }
    };
    fetchProduct();
  }, [id, navigate]);

  // Form handlers
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleTagsChange = (e) => {
    setTagsInput(e.target.value);
    const parsedTags = e.target.value
      .split(/[,#\s]+/)
      .map((t) => t.trim())
      .filter((t) => t);
    setFormData({ ...formData, tags: parsedTags });
  };

  const handleLogoChange = (e) => setLogo(e.target.files[0]);
  const handleImagesChange = (e) => setImages(Array.from(e.target.files).slice(0, 4));

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const addSpec = () => setSpecs([...specs, { key: "", value: "" }]);
  const removeSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return setMessage("Name and Price are required!");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append("discountPrice", formData.discountPrice ? Number(formData.discountPrice) : 0);
    if (formData.category) data.append("category", formData.category); // optional
    data.append("inStock", formData.inStock);
    data.append("tags", formData.tags.join(","));
    data.append("description", description);

    if (logo) data.append("logo", logo);
    images.forEach((img) => data.append("images", img));

    if (specs.length) {
      const filteredSpecs = Object.fromEntries(
        specs.filter((s) => s.key).map((s) => [s.key, s.value])
      );
      data.append("specs", JSON.stringify(filteredSpecs));
    }

    try {
      await API.put(`/admin/products/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("✅ Product updated successfully!");
      setTimeout(() => navigate("/admin/products"), 1500);
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(err.response?.data?.message || "❌ Error updating product");
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div className="create-product-container">
      <h2>Edit Product</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-section">
          <div className="heading-instock">
            <h3>Product Details</h3>
            <label className="instock-label">
              <input
                type="checkbox"
                name="inStock"
                checked={formData.inStock}
                onChange={handleChange}
              />{" "}
              In Stock
            </label>
          </div>

          <input
            type="text"
            name="name"
            placeholder="Product Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <div className="price-fields">
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="discountPrice"
              placeholder="Discount Price (optional)"
              value={formData.discountPrice}
              onChange={handleChange}
            />
          </div>

          <input
            type="text"
            name="category"
            placeholder="Category ID (optional)"
            value={formData.category}
            onChange={handleChange}
          />

          <div className="tags-section">
            <h4>Tags</h4>
            <input
              type="text"
              value={tagsInput}
              onChange={handleTagsChange}
              placeholder="Enter tags using #tag or comma separated"
            />
            <p className="tags-preview">Parsed Tags: {formData.tags.join(", ")}</p>
          </div>
        </div>

        <div className="form-section">
          <h3>Product Description</h3>
          <QuillEditor
            ref={quillRef}
            value={description}
            onChange={setDescription}
            placeholder="Write a detailed product description..."
          />
        </div>

        <div className="form-section">
          <h3>Images</h3>
          <label>
            Change Logo (optional):
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
          <label>
            Replace Additional Images (max 4):
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagesChange}
            />
          </label>
        </div>

        <div className="form-section">
          <h3>Specifications</h3>
          <table className="specs-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec, i) => (
                <tr key={i}>
                  <td>
                    <input
                      value={spec.key}
                      onChange={(e) => handleSpecChange(i, "key", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={spec.value}
                      onChange={(e) => handleSpecChange(i, "value", e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="small-btn"
                      onClick={() => removeSpec(i)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="small-btn add-spec-btn" onClick={addSpec}>
            Add Specification
          </button>
        </div>

        <div className="form-section">
          <button type="submit" className="submit-btn">
            Update Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
