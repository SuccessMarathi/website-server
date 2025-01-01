import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    default: "user", // Default value is "user"
  },
  purchasedCourses: {
    type: [String], // Array of course IDs or names
    default: [],
  },
  referralLink: {
    type: String,
    unique: true,
    default: null, // Generated when the user purchases a course
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId, // Linking to another user (referrer)
    ref: "User",
    default: null,
  },
  earnings: {
    type: Number,
    default: 0, // Updated when someone uses their referral link
  },
  contact: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Regex to validate 10-digit numbers
      },
      message: (props) => `${props.value} is not a valid 10-digit phone number!`,
    },
  },
});

const User = mongoose.model("User", userSchema);

export default User;
