import React, { useState, useEffect } from "react";
import API from "../../../../api/api";
import "../css/CreateSuperAdminExtras.css"; // isolated styles

const CreateSuperAdminExtras = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const [message, setMessage] = useState("");

  // Fetch existing categories and tags
  const fetchExtras = async () => {
    try {
      const catRes = await API.get("/admin/products/extras/categories");
      const tagRes = await API.get("/admin/products/extras/tags");
      setCategories(catRes.data.categories || []);
      setTags(tagRes.data.tags || []);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch categories or tags.");
    }
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return setMessage("Category name is required!");
    try {
      const res = await API.post("/admin/products/manage/categories", { name: newCategory });
      setCategories([...categories, res.data.category]);
      setNewCategory("");
      setMessage("✅ Category created!");
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(err.response?.data?.error || "❌ Failed to create category");
    }
  };

  const handleCreateTag = async () => {
    if (!newTag.trim()) return setMessage("Tag name is required!");
    try {
      const res = await API.post("/admin/products/manage/tags", { name: newTag });
      setTags([...tags, res.data.tag]);
      setNewTag("");
      setMessage("✅ Tag created!");
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage(err.response?.data?.error || "❌ Failed to create tag");
    }
  };

  return (
    <div className="create-superadmin-extras">
      <h2>Super Admin: Manage Categories & Tags</h2>
      {message && <p className="message">{message}</p>}

      {/* Category Section */}
      <div className="form-section">
        <h3>Categories</h3>
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button onClick={handleCreateCategory}>Add Category</button>

        <ul className="extras-list">
          {categories.map((cat) => (
            <li key={cat._id}>{cat.name}</li>
          ))}
        </ul>
      </div>

      {/* Tag Section */}
      <div className="form-section">
        <h3>Tags</h3>
        <input
          type="text"
          placeholder="New tag name"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button onClick={handleCreateTag}>Add Tag</button>

        <ul className="extras-list">
          {tags.map((tag) => (
            <li key={tag._id}>{tag.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CreateSuperAdminExtras;
