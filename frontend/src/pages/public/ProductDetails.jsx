import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import styles from "./css/ProductDetails.module.css"; // <-- CSS module

const ProductDetails = () => {
  const { slug } = useParams();
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
        const res = await API.get(`/products/slug/${slug}`);
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

  if (loading) return <div className={styles.pdContainerLoading}>Loading...</div>;
  if (error) return <div className={styles.pdContainerError}>{error}</div>;
  if (!product) return <div className={styles.pdContainerError}>No product found</div>;

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
    <div className={styles.pdContainer}>
      <div className={styles.pdGrid}>
        {/* Thumbnails */}
        {allImages.length > 0 && (
          <div className={styles.pdThumbnails}>
            {allImages.map((img, i) => (
              <img
                key={i}
                src={`${API.URL}/${img}`}
                alt={`${name}-${i}`}
                className={currentImage === img ? styles.active : ""}
                onClick={() => setCurrentImage(img)}
              />
            ))}
          </div>
        )}

        {/* Main Image */}
        {currentImage && (
          <div className={styles.pdMainImage}>
            <img src={`${API.URL}/${currentImage}`} alt={name} className={styles.fadeIn} />
          </div>
        )}

        {/* Product Info */}
        <div className={styles.pdInfo}>
          <h1>
            {name}{" "}
            <span className={`${styles.pdStock} ${!inStock ? styles.outOfStock : ""}`}>
              ({inStock ? "In Stock" : "Out of Stock"})
            </span>
          </h1>

          {/* Subcategory pill */}
          {subCategory?.slug && (
            <div
              className={styles.pdSubcategoryPill}
              title={`View all products in ${subCategory.name}`}
              onClick={() =>
                navigate(`/subcategory/${subCategory.slug}`, { state: { name: subCategory.name } })
              }
            >
              {subCategory.name}
            </div>
          )}

          {/* Tags */}
          {tags?.length > 0 && (
            <div className={styles.pdTags}>
              {tags.map((tag) => (
                <span key={tag._id} className={styles.pdTag}>
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className={styles.pdPrice}>
            {discountPrice > 0 ? (
              <>
                <span className={styles.pdOriginalPrice}>₹{price}</span>
                <span className={styles.pdDiscountPrice}>₹{discountPrice}</span>
              </>
            ) : (
              <span className={styles.pdDiscountPrice}>₹{price}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className={styles.pdActions}>
            <button
              className={styles.pdAddToCart}
              onClick={handleAddToCart}
              disabled={!inStock || isInCart || addingToCart}
            >
              {isInCart ? "Added to Cart" : addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button className={styles.pdBuyNow}>Buy Now</button>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className={styles.pdDescription} dangerouslySetInnerHTML={{ __html: description }} />
      )}

      {/* Specifications */}
      {specs && Object.keys(specs).length > 0 && (
        <div className={styles.pdSpecs}>
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
        <div className={styles.pdVideos}>
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
