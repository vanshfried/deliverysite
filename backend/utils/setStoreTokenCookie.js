//  backend\utils\setStoreTokenCookie.js
import jwt from "jsonwebtoken";

export function setTokenCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("storeOwnerToken", token, {
    httpOnly: true,
    secure: true, // set false in localhost if needed
    sameSite: "none", // important for Vite + cookie cross-site
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
