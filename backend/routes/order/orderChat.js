// backend/routes/order/orderChat.js
import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/", async (req, res) => {
  const { message, order, conversation } = req.body;

  // ⚡ Extract only safe, non-sensitive info
  const safeOrderInfo = {
    items:
      order.items?.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })) || [],
    status: order.isDelivered
      ? "Delivered"
      : order.isOutForDelivery
      ? "Out for delivery"
      : order.isPacked
      ? "Packed"
      : "Processing",
    shipping: order.shipping
      ? {
          city: order.shipping.city,
          state: order.shipping.state,
        }
      : undefined,
  };

  const context = `
You are a customer support assistant for an e-commerce platform.
You have access to the user's order data:
${JSON.stringify(order, null, 2)}

Rules:
1. Answer questions politely about the order status, delivery, items, payment, and tracking.
2. Do NOT provide personal information, user IDs, or order IDs.
3. If the question is unrelated to this order (e.g., asking for all users or unrelated topics), politely redirect the user to human support.
4. If unsure about the order, respond politely asking for clarification or to contact human support.
`;


  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: context },
        // pass conversation so AI remembers previous messages
        ...(conversation?.map((msg) => ({
          role: msg.from === "bot" ? "assistant" : "user",
          content: msg.text,
        })) || []),
        { role: "user", content: message },
      ],
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Order Chat AI error:", err);
    res.status(500).json({ reply: "Sorry, something went wrong." });
  }
});

export default router;
