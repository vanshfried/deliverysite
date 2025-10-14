import express from "express";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";
import { requireUser } from "../../middleware/requireUser.js";

const router = express.Router();

// ------------------------------
// GET user's cart (always exists)
// ------------------------------
router.get("/", requireUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
      cart = await cart.populate("items.product");
    }
    res.status(200).json({ cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// POST add item to cart
// ------------------------------
router.post("/add", requireUser, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

    const existingItem = cart.items.find(i => {
      const pid = i.product._id ? i.product._id.toString() : i.product.toString();
      return pid === productId;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceAtAddTime: product.discountPrice > 0 ? product.discountPrice : product.price,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// PUT update item quantity
// ------------------------------
router.put("/update", requireUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(i => {
      const pid = i.product._id ? i.product._id.toString() : i.product.toString();
      return pid === productId;
    });
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    item.quantity = quantity;
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Quantity updated", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// DELETE remove item from cart
// ------------------------------
router.delete("/remove", requireUser, async (req, res) => {
  try {
    const { productId } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(i => {
      const pid = i.product._id ? i.product._id.toString() : i.product.toString();
      return pid !== productId;
    });

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ------------------------------
// DELETE clear entire cart
// ------------------------------
router.delete("/clear", requireUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
