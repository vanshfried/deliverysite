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
  const { userLoggedIn, user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // reset state when slug changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setProduct(null);
    setSimilarProducts([]);
    setLoading(true);
  }, [slug]);

  // fetch product
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

  // fetch similar products
  useEffect(() => {
    if (!product) return;
    const fetchSimilar = async () => {
      try {
        let similar = [];
        const tagIds = product.tags?.map((tag) => tag._id).join(",");
        const [scRes, tagRes] = await Promise.all([
          product.subCategory?.slug
            ? API.get(`/products/subcategory/slug/${product.subCategory.slug}`)
            : { data: { products: [] } },
          product.tags?.length > 0
            ? API.get(`/products/tags/${tagIds}`)
            : { data: { products: [] } },
        ]);

        const subcatProducts = scRes.data.products.filter(
          (p) => p._id !== product._id
        );
        const tagProducts = tagRes.data.products.filter(
          (p) => p._id !== product._id
        );

        const tagSet = new Set(product.tags?.map((t) => t._id));
        const scoreMatch = (p) => {
          const tagCount = p.tags?.filter((t) => tagSet.has(t._id)).length || 0;
          const subcatMatch =
            p.subCategory?._id === product.subCategory?._id ? 1 : 0;
          return tagCount * 10 + subcatMatch * 5;
        };

        const merged = [...subcatProducts, ...tagProducts]
          .map((p) => ({ ...p, score: scoreMatch(p) }))
          .sort((a, b) => b.score - a.score)
          .filter((p, i, arr) => arr.findIndex((x) => x._id === p._id) === i)
          .slice(0, 10);

        setSimilarProducts(merged);
      } catch (err) {
        console.error("Similar Fetch Error:", err);
      }
    };
    fetchSimilar();
  }, [product]);

  // fetch reviews
  useEffect(() => {
    if (!product?._id) return;
    const fetchReviews = async () => {
      try {
        const res = await API.get(`/products/${product._id}/reviews`);
        setReviews(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    fetchReviews();
  }, [product]);

  // ---- Add to Cart ----
  const handleAddToCart = async () => {
    if (!userLoggedIn) return setShowLoginPopup(true);
    if (
      !product.inStock ||
      cart.items.some((i) => i.product._id === product._id)
    )
      return;
    setAddingToCart(true);
    try {
      await addToCart(product._id, 1);
      navigate("/cart");
    } finally {
      setAddingToCart(false);
    }
  };

  // ---- Buy Now ----
  const handleBuyNow = () => {
    if (!userLoggedIn) return setShowLoginPopup(true);
    navigate("/checkout", { state: { buyNowProduct: product } });
  };

  // star touch/click
  const handleStarClick = (val) => setRating(val);

  // submit review (new or edit)
  const handleSubmitReview = async () => {
    if (!userLoggedIn) return setShowLoginPopup(true);
    if (!rating || !comment.trim()) return;

    setSubmitting(true);
    try {
      await API.post(
        `/products/${product._id}/reviews`,
        { rating: Number(rating), comment: comment.trim() },
        { withCredentials: true }
      );

      const res = await API.get(`/products/${product._id}/reviews`);
      setReviews(res.data);
      setRating(0);
      setComment("");
      setEditingReviewId(null);
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // edit review
  const handleEditReview = (r) => {
    setEditingReviewId(r._id);
    setRating(r.rating);
    setComment(r.comment);
  };

  // delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await API.delete(`/products/${product._id}/reviews/${reviewId}`, {
        withCredentials: true,
      });
      setReviews(reviews.filter((r) => r._id !== reviewId));
      setEditingReviewId(null);
      setRating(0);
      setComment("");
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  // ---- Login Popup ----
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

  if (loading)
    return <div className={styles.pdContainerLoading}>Loading...</div>;
  if (error) return <div className={styles.pdContainerError}>{error}</div>;
  if (!product)
    return <div className={styles.pdContainerError}>No product found</div>;

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

  // ---- UI ----
  return (
    <div className={styles.pdContainer}>
      {showLoginPopup && <LoginPrompt />}

      <div className={styles.pdGrid}>
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

        {currentImage && (
          <div className={styles.pdMainImage}>
            <img
              src={`${API.URL}/${currentImage}`}
              alt={name}
              className={styles.fadeIn}
            />
          </div>
        )}

        <div className={styles.pdInfo}>
          <h1>{name}</h1>

          <div className={styles.pdSubcategoryRow}>
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

            <span
              className={`${styles.pdStock} ${
                !inStock ? styles.outOfStock : ""
              }`}
            >
              {inStock ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* ⭐ Product Rating and Review Count */}
          <div className={styles.pdRating}>
            ⭐{" "}
            {product.averageRating ? product.averageRating.toFixed(1) : "0.0"} (
            {product.numReviews || 0})
          </div>

          {tags?.length > 0 && (
            <div className={styles.pdTags}>
              {tags.map((tag) => (
                <span key={tag._id} className={styles.pdTag}>
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

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

          <div className={styles.pdActions}>
            <button
              className={styles.pdAddToCart}
              onClick={handleAddToCart}
              disabled={!inStock || isInCart || addingToCart}
            >
              {isInCart
                ? "Added to Cart"
                : addingToCart
                ? "Adding..."
                : "Add to Cart"}
            </button>

            <button
              className={styles.pdBuyNow}
              onClick={handleBuyNow}
              disabled={!inStock}
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {description && (
        <div
          className={styles.pdDescription}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

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

      {videos?.length > 0 && (
        <div className={styles.pdVideos}>
          <h3>Videos</h3>
          {videos.map((video) => (
            <video
              key={video}
              src={`${API.URL}/${video}`}
              controls
              width="100%"
            />
          ))}
        </div>
      )}

      {/* Reviews Section */}
      <div className={styles.pdReviews}>
        <h3>Customer Reviews ({reviews.length})</h3>

        {userLoggedIn &&
        reviews.some((r) => r.user?._id === user?._id) &&
        !editingReviewId ? (
          reviews
            .filter((r) => r.user?._id === user?._id)
            .map((r) => (
              <div key={r._id} className={styles.userReviewBox}>
                <div className={styles.starDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= r.rating ? styles.starFilled : styles.starEmpty
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p>{r.comment}</p>
                <div className={styles.reviewActions}>
                  <button onClick={() => handleEditReview(r)}>Edit</button>
                  <button onClick={() => handleDeleteReview(r._id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
        ) : (
          <div className={styles.reviewForm}>
            <div className={styles.starInput}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onTouchStart={() => handleStarClick(star)}
                  className={
                    star <= rating ? styles.starFilled : styles.starEmpty
                  }
                >
                  ★
                </span>
              ))}
            </div>
            <textarea
              placeholder="Write your review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button onClick={handleSubmitReview} disabled={submitting}>
              {editingReviewId ? "Update Review" : "Submit Review"}
            </button>
          </div>
        )}

        <div className={styles.reviewList}>
          {reviews
            .filter((r) => !user || r.user?._id !== user?._id)
            .map((r) => (
              <div key={r._id} className={styles.singleReview}>
                <div className={styles.starDisplay}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= r.rating ? styles.starFilled : styles.starEmpty
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p>{r.comment}</p>
                <small>by {r.user?.name || "Anonymous"}</small>
              </div>
            ))}
        </div>
      </div>

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
                  <p className={styles.similarRating}>
                    ⭐ {p.averageRating ? p.averageRating.toFixed(1) : "0.0"} (
                    {p.numReviews || 0})
                  </p>
                  <p className={styles.similarPrice}>
                    {p.discountPrice > 0 ? (
                      <>
                        <span className={styles.similarOriginalPrice}>
                          ₹{p.price}
                        </span>
                        <span className={styles.similarDiscountPrice}>
                          ₹{p.discountPrice}
                        </span>
                      </>
                    ) : (
                      <span className={styles.similarDiscountPrice}>
                        ₹{p.price}
                      </span>
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
