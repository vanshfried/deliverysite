import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  label: { type: String, default: "" }, // Home, Work etc.
  houseNo: { type: String, required: true },
  laneOrSector: { type: String, required: true },
  landmark: { type: String, default: "" },
  pincode: { type: String, required: true },
  coords: {
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
  },
});

const UserSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String, unique: true, required: true },

  otp: { type: String, default: null },
  otpExpires: { type: Number, default: null },

  addresses: { type: [AddressSchema], default: [] },

}, { timestamps: true });

export default mongoose.model("User", UserSchema);
