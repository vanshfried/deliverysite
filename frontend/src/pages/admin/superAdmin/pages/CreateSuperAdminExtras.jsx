import React, { useState, useEffect } from "react";
import API from "../../../../api/api";
import "../css/CreateSuperAdminExtras.css";

const CreateSuperAdminExtras = () => {
  // ---------------- STATES ----------------
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newTag, setNewTag] = useState("");

  const [selectedParentForSubCategory, setSelectedParentForSubCategory] = useState("");
  const [selectedCategoryForTag, setSelectedCategoryForTag] = useState("");

  const [message, setMessage] = useState("");

  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingSubCategory, setLoadingSubCategory] = useState(false);
  const [loadingTag, setLoadingTag] = useState(false);

  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null);
  const [pendingDeleteSubCategory, setPendingDeleteSubCategory] = useState(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState(null);

  // ---------------- FETCH ALL ----------------
  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      const [catRes, subCatRes, tagRes] = await Promise.all([
        API.get("/admin/products/extras/categories"),
        API.get("/admin/products/extras/subcategories"),
        API.get("/admin/products/extras/tags"),
      ]);

      setCategories((catRes.data.categories || []).sort((a, b) => a.name.localeCompare(b.name)));
      setSubCategories((subCatRes.data.subcategories || []).sort((a, b) => a.name.localeCompare(b.name)));
      setTags(tagRes.data.tags || []);
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to fetch categories, subcategories, or tags.");
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // ---------------- CATEGORY HANDLERS ----------------
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
      setCategories(categories.filter((cat) => cat._id !== id));
      setSubCategories(subCategories.filter((sc) => sc.parentCategory?._id !== id));
      setTags(tags.filter((t) => t.category?._id !== id));
      setPendingDeleteCategory(null);
      showMessage("✅ Category, its subcategories, and tags deleted!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to delete category");
    }
  };

  // ---------------- SUBCATEGORY HANDLERS ----------------
  const handleCreateSubCategory = async () => {
    if (!newSubCategory.trim()) return showMessage("Subcategory name is required!");
    if (!selectedParentForSubCategory) return showMessage("Select a parent category!");
    try {
      setLoadingSubCategory(true);
      const res = await API.post("/admin/products/manage/subcategories", {
        name: newSubCategory,
        parentCategory: selectedParentForSubCategory,
      });
      setSubCategories([...subCategories, res.data.subcategory].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSubCategory("");
      showMessage("✅ Subcategory created!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to create subcategory");
    } finally {
      setLoadingSubCategory(false);
    }
  };

  const handleDeleteSubCategory = async (id) => {
    try {
      await API.delete(`/admin/products/manage/subcategories/${id}`);
      setSubCategories(subCategories.filter((sc) => sc._id !== id));
      setPendingDeleteSubCategory(null);
      showMessage("✅ Subcategory deleted!");
    } catch (err) {
      console.error(err.response?.data || err);
      showMessage(err.response?.data?.error || "❌ Failed to delete subcategory");
    }
  };

  // ---------------- TAG HANDLERS ----------------
  const handleCreateTag = async () => {
    if (!newTag.trim()) return showMessage("Tag name is required!");
    if (!selectedCategoryForTag) return showMessage("Select a category for the tag!");
    try {
      setLoadingTag(true);
      const res = await API.post("/admin/products/manage/tags", {
        name: newTag,
        category: selectedCategoryForTag,
      });
      setTags([...tags, res.data.tag]);
      setNewTag(""); // keep category selected for multiple tags
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

  // ---------------- GROUP DATA ----------------
  const groupedSubCategories = categories.map((cat) => ({
    ...cat,
    subCategories: subCategories.filter((sc) => sc.parentCategory?._id === cat._id),
  }));

  const groupedTags = categories.map((cat) => ({
    ...cat,
    tags: tags.filter((t) => t.category?._id === cat._id),
  }));

  return (
    <div className="create-superadmin-extras">
      <h2>Super Admin: Manage Categories, Subcategories & Tags</h2>
      {message && <p className="message">{message}</p>}

      {/* Categories */}
      <div className="form-section">
        <h3>Categories</h3>
        <div className="input-row">
          <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category name" />
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

      {/* SubCategories */}
      <div className="form-section">
        <h3>SubCategories</h3>
        <div className="input-row">
          <input value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} placeholder="New subcategory name" />
          <select value={selectedParentForSubCategory} onChange={(e) => setSelectedParentForSubCategory(e.target.value)}>
            <option value="">Select Category</option>
            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
          </select>
          <button onClick={handleCreateSubCategory} disabled={loadingSubCategory}>
            {loadingSubCategory ? "Adding..." : "Add"}
          </button>
        </div>
        <ul className="extras-list">
          {subCategories.map((sc) => (
            <li key={sc._id}>
              <span className="item-name">{sc.name} ({sc.parentCategory?.name})</span>
              <div className="actions">
                {pendingDeleteSubCategory === sc._id ? (
                  <>
                    <button className="confirm-btn" onClick={() => handleDeleteSubCategory(sc._id)}>Confirm</button>
                    <button className="cancel-btn" onClick={() => setPendingDeleteSubCategory(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="delete-btn" onClick={() => setPendingDeleteSubCategory(sc._id)}>🗑</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      <div className="form-section">
        <h3>Tags</h3>
        <div className="input-row">
          <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="New tag name" />
          <select value={selectedCategoryForTag} onChange={(e) => setSelectedCategoryForTag(e.target.value)}>
            <option value="">Select category</option>
            {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
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
              ) : <li className="no-tags">No tags in this category</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateSuperAdminExtras;
