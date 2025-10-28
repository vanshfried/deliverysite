import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  label: { type: String }, // e.g. "Home", "Office"
  houseNo: { type: String, required: true },
  laneOrSector: { type: String, required: true },
  landmark: { type: String },
  pincode: { type: String, required: true },
  coords: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
});

const UserSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, unique: true, required: true },

  // ✅ OTP fields for login verification
  otp: { type: String, default: null },
  otpExpires: { type: Number, default: null },

  addresses: [AddressSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
