import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import API from "../../../api/api";
import QuillEditor from "./QuillEditor";
import styles from "../css/CreateProduct.module.css";

const CreateProduct = () => {
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

  const quillRef = useRef(null);

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
        setAllTags(
          (tagRes.data.tags || []).map((t) => ({
            value: t._id,
            label: t.name,
            categoryId: t.category?._id || null,
          }))
        );
        setFilteredTags(tagRes.data.tags || []);
      } catch (err) {
        console.error(err);
        showMessage("❌ Failed to load categories, subcategories or tags.");
      }
    };
    fetchExtras();
  }, []);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    const filteredSubCats = allSubCategories.filter((sc) => sc.parentCategory?._id === selectedCat);
    setSubCategories(filteredSubCats);

    const newSubCat = filteredSubCats.some((sc) => sc._id === formData.subCategory) ? formData.subCategory : "";
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

  const handleTagsChange = (selectedOptions) => {
    setFormData((prev) => ({ ...prev, tags: selectedOptions || [] }));
  };

  const handleLogoChange = (e) => setLogo(e.target.files[0]);
  const handleImagesChange = (e) => setImages(Array.from(e.target.files).slice(0, 4));

  const handleSpecChange = (index, field, value) => {
    setSpecs((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      if (index === prev.length - 1 && updated[index].key) updated.push({ key: "", value: "" });
      return updated;
    });
  };

  const removeSpec = (index) => setSpecs((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logo || !formData.name || !formData.price || !formData.subCategory)
      return showMessage("❌ Logo, Name, Price, and Subcategory are required!");

    const data = new FormData();
    data.append("name", formData.name);
    data.append("price", Number(formData.price));
    data.append("discountPrice", formData.discountPrice ? Number(formData.discountPrice) : 0);
    data.append("inStock", formData.inStock);
    data.append("subCategory", formData.subCategory);
    data.append("description", description);
    data.append("logo", logo);
    images.forEach((img) => data.append("images", img));
    formData.tags.forEach((tag) => data.append("tags", tag.value));

    const filteredSpecs = Object.fromEntries(specs.filter((s) => s.key).map((s) => [s.key, s.value]));
    if (Object.keys(filteredSpecs).length) data.append("specs", JSON.stringify(filteredSpecs));

    try {
      await API.post("/admin/products/create", data, { headers: { "Content-Type": "multipart/form-data" } });
      showMessage("✅ Product created successfully!");
      resetForm();
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.message || "❌ Error creating product");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", discountPrice: "", category: "", subCategory: "", inStock: true, tags: [] });
    setDescription("");
    setLogo(null);
    setImages([]);
    setSpecs([{ key: "", value: "" }]);
    setFilteredTags(allTags);
    setSubCategories([]);
  };

  return (
    <div className={styles.createProductContainer}>
      <h2>Create Product</h2>
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

          <div className={styles.categorySection}>
            <label>Category</label>
            <select value={formData.category} onChange={handleCategoryChange}>
              <option value="">-- Select a category --</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
          </div>

          <div className={styles.categorySection}>
            <label>Subcategory</label>
            <select value={formData.subCategory} onChange={handleSubCategoryChange}>
              <option value="">-- Select a subcategory --</option>
              {subCategories.map((sub) => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
            </select>
          </div>

          <div className={styles.tagsSection}>
            <label>Tags</label>
            <Select isMulti options={filteredTags} value={formData.tags} onChange={handleTagsChange} placeholder="Select tags..." />
          </div>
        </div>

        <div className={styles.formSection}>
          <h3>Product Description</h3>
          <QuillEditor ref={quillRef} value={description} onChange={setDescription} className={styles.qlContainer} placeholder="Write a detailed product description..." />
        </div>

        <div className={styles.formSection}>
          <h3>Images</h3>
          <label>Logo (required): <input type="file" accept="image/*" onChange={handleLogoChange} /></label>
          <label>Additional Images (max 4): <input type="file" accept="image/*" multiple onChange={handleImagesChange} /></label>
        </div>

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
          
        </div>

        <div className={styles.formSection}>
          <button type="submit" className={styles.submitBtn}>Create Product</button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
