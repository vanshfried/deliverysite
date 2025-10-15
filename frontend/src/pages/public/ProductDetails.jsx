import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import "./css/ProductDetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useContext(CartContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/products/${id}`);
        const p = res.data.product;

        setProduct(p);
        setCurrentImage(p.logo || (p.images && p.images[0]) || ""); // fallback
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Error fetching product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="no-product">No product found</div>;

  const {
    name,
    description,
    logo,
    images,
    price,
    discountPrice,
    inStock,
    tags,
    videos,
    specs,
    category,
  } = product;

  const allImages = [logo, ...(images || [])].filter(Boolean); // remove null/undefined
  const isInCart = cart.items.some((item) => item.product._id === product._id);

  const handleAddToCart = async () => {
    if (!inStock || isInCart) return;
    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      navigate("/cart");
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="product-details-container">
      <div className="product-grid">
        {/* Thumbnails */}
        {allImages.length > 0 && (
          <div className="thumbnail-column">
            {allImages.map((img, i) => (
              <img
                key={i}
                src={`${API.URL}/${img}`}
                alt={`${name}-${i}`}
                className={currentImage === img ? "active" : ""}
                onClick={() => setCurrentImage(img)}
              />
            ))}
          </div>
        )}

        {/* Main Image */}
        {currentImage && (
          <div className="main-image">
            <img src={`${API.URL}/${currentImage}`} alt={name} className="fade-in" />
          </div>
        )}

        {/* Product Info */}
        <div className="product-info">
          <h1>
            {name}{" "}
            {inStock ? (
              <span className="stock">(In Stock)</span>
            ) : (
              <span className="stock out-of-stock">(Out of Stock)</span>
            )}
          </h1>

          {/* Category */}
          {category?.name && <div className="category">Category: {category.name}</div>}

          {/* Tags */}
          {tags?.length > 0 && (
            <div className="tags">
              {tags.map((tag, i) => (
                <span key={i} className="tag">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="price">
            {discountPrice > 0 ? (
              <>
                <span className="original-price">₹{price}</span>
                <span className="discount-price">₹{discountPrice}</span>
              </>
            ) : (
              <span className="discount-price">₹{price}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="add-to-cart"
              onClick={handleAddToCart}
              disabled={!inStock || isInCart || addingToCart}
            >
              {isInCart ? "Added to Cart" : addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button className="buy-now">Buy Now</button>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="product-description" dangerouslySetInnerHTML={{ __html: description }} />
      )}

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div className="product-specs">
          <h3>Specifications</h3>
          <table>
            <tbody>
              {Object.entries(specs).map(([key, value], i) => (
                <tr key={i}>
                  <td>{key}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Videos */}
      {videos?.length > 0 && (
        <div className="product-videos">
          <h3>Videos</h3>
          {videos.map((video, i) => (
            <video key={i} src={`${API.URL}/${video}`} controls width="100%" />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
