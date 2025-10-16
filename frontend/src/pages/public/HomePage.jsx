import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import "./css/HomePage.css";

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products"); // Fetch all products
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p className="hp-loading">Loading products...</p>;
  if (!products.length) return <p className="hp-loading">No products found.</p>;

  return (
    <div className="hp-container">
      <h1>Our Products</h1>
      <div className="hp-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="hp-card"
            onClick={() => navigate(`/product/${product.slug}`)} // ✅ Use slug
          >
            <div className="hp-image">
              <img src={`${API.URL}/${product.logo}`} alt={product.name} />
            </div>

            <div className="hp-info">
              <h2>{product.name}</h2>
              <p className="hp-price">
                {product.discountPrice > 0 ? (
                  <>
                    <span className="hp-original-price">₹{product.price}</span>
                    <span className="hp-discount-price">₹{product.discountPrice}</span>
                  </>
                ) : (
                  <span className="hp-discount-price">₹{product.price}</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
