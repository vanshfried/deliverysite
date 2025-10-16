import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import API from "../../api/api";
import "./css/SubCategoryPage.css";

const SubCategoryPage = () => {
  const { slug } = useParams(); // ✅ use slug instead of id
  const { state } = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get(`/products/subcategory/slug/${slug}`); // backend endpoint by slug
        setProducts(res.data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [slug]);

  if (loading) return <p className="scp-loading-text">Loading products...</p>;
  if (!products.length) return <p className="scp-loading-text">No products found.</p>;

  return (
    <div className="scp-container">
      {/* Breadcrumb */}
      <nav className="scp-breadcrumb">
        <Link to="/">Home</Link> &gt; <span>{state?.name || "Subcategory"}</span>
      </nav>

      <h1 className="scp-title">{state?.name || "Subcategory Products"}</h1>

      <div className="scp-products-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="scp-product-card"
            onClick={() =>
              navigate(`/product/${product.slug}`, {
                state: { name: product.name },
              })
            }
          >
            <div className="scp-product-image">
              <img src={`${API.URL}/${product.logo}`} alt={product.name} />
            </div>
            <div className="scp-product-info">
              <h2>{product.name}</h2>
              <p className="scp-price">
                {product.discountPrice > 0 ? (
                  <>
                    <span className="scp-original-price">₹{product.price}</span>
                    <span className="scp-discount-price">₹{product.discountPrice}</span>
                  </>
                ) : (
                  <span>₹{product.price}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubCategoryPage;
