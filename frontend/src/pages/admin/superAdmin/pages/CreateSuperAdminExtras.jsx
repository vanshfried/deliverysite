import React, { useState, useEffect } from "react";
import API from "../../../../api/api";
import "../css/CreateSuperAdminExtras.css";

const CreateSuperAdminExtras = () => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [newTag, setNewTag] = useState("");
  const [selectedCategoryForTag, setSelectedCategoryForTag] = useState("");
  const [message, setMessage] = useState("");
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingTag, setLoadingTag] = useState(false);

  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState(null);

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      const [catRes, tagRes] = await Promise.all([
        API.get("/admin/products/extras/categories"),
        API.get("/admin/products/extras/tags"),
      ]);
      setCategories((catRes.data.categories || []).sort((a, b) => a.name.localeCompare(b.name)));
      setTags(tagRes.data.tags || []);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to fetch categories or tags.");
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ---------------- Category ----------------
  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return showMessage("Category name is required!");
    try {
      setLoadingCategory(true);
      const res = await API.post("/admin/products/manage/categories", { name: newCategory });
      setCategories([...categories, res.data.category].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
      showMessage("✅ Category created!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to create category");
    } finally {
      setLoadingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await API.delete(`/admin/products/manage/categories/${id}`);
      // Remove category
      setCategories(categories.filter((cat) => cat._id !== id));
      // Remove all tags under this category
      setTags(tags.filter((tag) => tag.category?._id !== id));
      setPendingDeleteCategory(null);
      showMessage("✅ Category and its tags deleted!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to delete category");
    }
  };

  // ---------------- Tag ----------------
  const handleCreateTag = async () => {
    if (!newTag.trim()) return showMessage("Tag name is required!");
    if (!selectedCategoryForTag) return showMessage("Please select a category for the tag!");
    try {
      setLoadingTag(true);
      const res = await API.post("/admin/products/manage/tags", {
        name: newTag,
        category: selectedCategoryForTag
      });
      setTags([...tags, res.data.tag]);
      setNewTag(""); // only clear the tag name
      // ✅ Do not reset selectedCategoryForTag so user can add multiple tags in same category
      showMessage("✅ Tag created!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to create tag");
    } finally {
      setLoadingTag(false);
    }
  };

  const handleDeleteTag = async (id) => {
    try {
      await API.delete(`/admin/products/manage/tags/${id}`);
      setTags(tags.filter((tag) => tag._id !== id));
      setPendingDeleteTag(null);
      showMessage("✅ Tag deleted!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to delete tag");
    }
  };

  // Group tags by category
  const groupedTags = categories.map((cat) => ({
    ...cat,
    tags: tags.filter((tag) => tag.category?._id === cat._id)
  }));

  return (
    <div className="create-superadmin-extras">
      <h2>Super Admin: Manage Categories & Tags</h2>
      {message && <p className="message">{message}</p>}

      {/* Categories */}
      <div className="form-section">
        <h3>Categories</h3>
        <div className="input-row">
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button onClick={handleCreateCategory} disabled={loadingCategory}>
            {loadingCategory ? "Adding..." : "Add"}
          </button>
        </div>
        <ul className="extras-list">
          {categories.map((cat) => (
            <li key={cat._id}>
              <span className="item-name">{cat.name}</span>
              <div className="actions">
                {pendingDeleteCategory === cat._id ? (
                  <>
                    <button className="confirm-btn" onClick={() => handleDeleteCategory(cat._id)}>Confirm</button>
                    <button className="cancel-btn" onClick={() => setPendingDeleteCategory(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="delete-btn" onClick={() => setPendingDeleteCategory(cat._id)}>🗑</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags grouped by category */}
      <div className="form-section">
        <h3>Tags</h3>
        <div className="input-row">
          <input
            type="text"
            placeholder="New tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <select
            value={selectedCategoryForTag}
            onChange={(e) => setSelectedCategoryForTag(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <button onClick={handleCreateTag} disabled={loadingTag}>
            {loadingTag ? "Adding..." : "Add"}
          </button>
        </div>

        {groupedTags.map((cat) => (
          <div key={cat._id} className="category-tags-group">
            <h4>{cat.name}</h4>
            <ul className="extras-list">
              {cat.tags.length > 0 ? (
                cat.tags.map((tag) => (
                  <li key={tag._id}>
                    <span className="item-name">{tag.name}</span>
                    <div className="actions">
                      {pendingDeleteTag === tag._id ? (
                        <>
                          <button className="confirm-btn" onClick={() => handleDeleteTag(tag._id)}>Confirm</button>
                          <button className="cancel-btn" onClick={() => setPendingDeleteTag(null)}>Cancel</button>
                        </>
                      ) : (
                        <button className="delete-btn" onClick={() => setPendingDeleteTag(tag._id)}>🗑</button>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="no-tags">No tags in this category</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateSuperAdminExtras;
