// backend\routes\user\cartRoutes.js
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
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );
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
// ------------------------------
// POST add item to cart (ONE STORE ONLY)
// ------------------------------
router.post("/add", requireUser, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findById(productId).populate("store");
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });

    // Create cart if none exists
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
        store: product.store._id, // first store locked
      });
    }

    // 🚨 STORE MISMATCH LOGIC
    if (cart.items.length > 0) {
      if (
        cart.store &&
        cart.store.toString() !== product.store._id.toString()
      ) {
        return res.status(200).json({
          conflict: true,
          message: "Cart contains items from another store.",
          storeName: product.store.name,
        });
      }
    }

    // If cart empty or store not set → lock store
    if (!cart.store) {
      cart.store = product.store._id;
    }

    // Normal item add logic
    const existingItem = cart.items.find((i) => {
      const pid = i.product._id
        ? i.product._id.toString()
        : i.product.toString();
      return pid === productId;
    });

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        priceAtAddTime:
          product.discountPrice > 0 ? product.discountPrice : product.price,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
});

// ------------------------------
// PUT update item quantity
// ------------------------------
router.put("/update", requireUser, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity < 1)
      return res.status(400).json({ message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => {
      const pid = i.product._id
        ? i.product._id.toString()
        : i.product.toString();
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
router.delete("/clear", requireUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    cart.store = null; // reset store
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


export default router;
