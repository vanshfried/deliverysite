import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import "./css/ProductDetails.css";

const ProductDetails = () => {
  const { slug } = useParams(); // ✅ use slug instead of id
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
        const res = await API.get(`/products/slug/${slug}`); // backend should support slug lookup
        const p = res.data.product;
        setProduct(p);
        setCurrentImage(p.logo || (p.images && p.images[0]) || "");
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Error fetching product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="pd-container-loading">Loading...</div>;
  if (error) return <div className="pd-container-error">{error}</div>;
  if (!product) return <div className="pd-container-error">No product found</div>;

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
    subCategory,
  } = product;

  const allImages = [logo, ...(images || [])].filter(Boolean);
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
    <div className="pd-container">
      <div className="pd-grid">
        {/* Thumbnails */}
        {allImages.length > 0 && (
          <div className="pd-thumbnails">
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
          <div className="pd-main-image">
            <img src={`${API.URL}/${currentImage}`} alt={name} className="fade-in" />
          </div>
        )}

        {/* Product Info */}
        <div className="pd-info">
          <h1>
            {name}{" "}
            <span className={`pd-stock ${inStock ? "" : "out-of-stock"}`}>
              ({inStock ? "In Stock" : "Out of Stock"})
            </span>
          </h1>

          {/* Subcategory pill */}
          {subCategory?.slug && (
            <div
              className="pd-subcategory-pill"
              title={`View all products in ${subCategory.name}`}
              onClick={() =>
                navigate(`/subcategory/${subCategory.slug}`, {
                  state: { name: subCategory.name },
                })
              }
            >
              {subCategory.name}
            </div>
          )}

          {/* Tags */}
          {tags?.length > 0 && (
            <div className="pd-tags">
              {tags.map((tag) => (
                <span key={tag._id} className="pd-tag">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="pd-price">
            {discountPrice > 0 ? (
              <>
                <span className="pd-original-price">₹{price}</span>
                <span className="pd-discount-price">₹{discountPrice}</span>
              </>
            ) : (
              <span className="pd-discount-price">₹{price}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pd-actions">
            <button
              className="pd-add-to-cart"
              onClick={handleAddToCart}
              disabled={!inStock || isInCart || addingToCart}
            >
              {isInCart ? "Added to Cart" : addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button className="pd-buy-now">Buy Now</button>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="pd-description" dangerouslySetInnerHTML={{ __html: description }} />
      )}

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div className="pd-specs">
          <h3>Specifications</h3>
          <table>
            <tbody>
              {Object.entries(specs).map(([key, value]) => (
                <tr key={key}>
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
        <div className="pd-videos">
          <h3>Videos</h3>
          {videos.map((video) => (
            <video key={video} src={`${API.URL}/${video}`} controls width="100%" />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
