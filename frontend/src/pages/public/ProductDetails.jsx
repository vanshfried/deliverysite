import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";
import { CartContext } from "../admin/Context/CartContext";
import { AuthContext } from "../admin/Context/AuthContext";
import styles from "./css/ProductDetails.module.css";

const ProductDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart } = useContext(CartContext);
  const { userLoggedIn } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setProduct(null);
    setSimilarProducts([]);
    setLoading(true);
  }, [slug]);

  // Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await API.get(`/products/slug/${slug}`);
        const p = res.data.product;
        setProduct(p);
        setCurrentImage(p.logo || (p.images && p.images[0]) || "");
      } catch (err) {
        setError(err.response?.data?.message || "Error fetching product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  // Smart Similar Products Logic
  useEffect(() => {
    if (!product) return;

    const fetchSimilar = async () => {
      try {
        let similar = [];
        const tagIds = product.tags?.map((tag) => tag._id).join(",");

        // Fetch both in parallel
        const [scRes, tagRes] = await Promise.all([
          product.subCategory?.slug
            ? API.get(`/products/subcategory/slug/${product.subCategory.slug}`)
            : { data: { products: [] } },
          product.tags?.length > 0
            ? API.get(`/products/tags/${tagIds}`)
            : { data: { products: [] } },
        ]);

        const subcatProducts = scRes.data.products.filter((p) => p._id !== product._id);
        const tagProducts = tagRes.data.products.filter((p) => p._id !== product._id);

        // Count tag matches for sorting
        const tagSet = new Set(product.tags?.map((t) => t._id));

        const scoreMatch = (p) => {
          const tagCount = p.tags?.filter((t) => tagSet.has(t._id)).length || 0;
          const subcatMatch = p.subCategory?._id === product.subCategory?._id ? 1 : 0;
          return tagCount * 10 + subcatMatch * 5;
        };

        // Merge + score + sort + dedupe
        const merged = [...subcatProducts, ...tagProducts]
          .map((p) => ({ ...p, score: scoreMatch(p) }))
          .sort((a, b) => b.score - a.score)
          .filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i)
          .slice(0, 10);

        setSimilarProducts(merged);
      } catch (err) {
        console.error("Similar Fetch Error:", err);
      }
    };

    fetchSimilar();
  }, [product]);

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
    if (!userLoggedIn) return setShowLoginPopup(true);
    if (!inStock || isInCart) return;
    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      navigate("/cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!userLoggedIn) return setShowLoginPopup(true);
    navigate("/checkout");
  };

  const LoginPrompt = () => (
    <div className={styles.loginPopupBackdrop}>
      <div className={styles.loginPopup}>
        <p>You need to log in to perform this action.</p>
        <div className={styles.popupButtons}>
          <button
            onClick={() => {
              navigate("/login");
              setShowLoginPopup(false);
            }}
          >
            Login
          </button>
          <button onClick={() => setShowLoginPopup(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.pdContainer}>
      {showLoginPopup && <LoginPrompt />}

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

          {/* Subcategory */}
          {subCategory?.slug && (
            <div
              className={styles.pdSubcategoryPill}
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

          {/* Buttons */}
          <div className={styles.pdActions}>
            <button
              className={styles.pdAddToCart}
              onClick={handleAddToCart}
              disabled={!inStock || isInCart || addingToCart}
            >
              {isInCart ? "Added to Cart" : addingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button className={styles.pdBuyNow} onClick={handleBuyNow}>
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div
          className={styles.pdDescription}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

      {/* Specs */}
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

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className={styles.similarProducts}>
          <h3>Similar Products</h3>
          <div className={styles.similarGrid}>
            {similarProducts.map((p) => (
              <div
                key={p._id}
                className={styles.similarCard}
                onClick={() => navigate(`/product/${p.slug}`)}
              >
                <div className={styles.similarImage}>
                  <img
                    src={`${API.URL}/${p.logo || (p.images && p.images[0])}`}
                    alt={p.name}
                  />
                </div>
                <div className={styles.similarInfo}>
                  <h4>{p.name}</h4>
                  <p className={styles.similarPrice}>
                    {p.discountPrice > 0 ? (
                      <>
                        <span className={styles.similarOriginalPrice}>₹{p.price}</span>
                        <span className={styles.similarDiscountPrice}>
                          ₹{p.discountPrice}
                        </span>
                      </>
                    ) : (
                      <span className={styles.similarDiscountPrice}>₹{p.price}</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
