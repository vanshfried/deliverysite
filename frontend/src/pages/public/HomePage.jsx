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
        const res = await API.get("/products");
        setProducts(res.data.products);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <p className="loading-text">Loading products...</p>;
  if (!products.length)
    return <p className="loading-text">No products found.</p>;

  return (
    <div className="homepage-container">
      <h1>Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="product-card"
            onClick={() => navigate(`/product/${product._id}`)}
          >
            <div className="product-image">
              <img src={`${API.URL}/${product.logo}`} alt={product.name} />
            </div>
            <div className="product-info">
              <div>
                <h2>{product.name}</h2>
                {product.category && (
                  <p className="category">{product.category.name}</p>
                )}
              </div>
              <p className="price">
                {product.discountPrice > 0 ? (
                  <>
                    <span className="original-price">₹{product.price}</span>
                    <span className="discount-price">
                      ₹{product.discountPrice}
                    </span>
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

export default HomePage;
