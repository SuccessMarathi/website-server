import  User  from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/TryCatch.js";
import { v4 as uuidv4 } from "uuid";

//test
import cloudinary from '../middlewares/cloudinary.js'


//test
// export const uploadUserImage = TryCatch(async (req, res) => {
//   const userId = req.user.id; // Assuming the user ID is stored in the JWT
//   const { file } = req.files; // Assuming the image file comes as `file`

//   if (!file) {
//     return res.status(400).json({ message: "Please upload an image file." });
//   }

//   // Upload image to Cloudinary
//   const result = await cloudinary.uploader.upload(file.path, {
//     folder: "user_images",
//     use_filename: true,
//     unique_filename: false,
//   });

//   // Update user's image field in the database
//   const user = await User.findById(userId);

//   if (!user) {
//     return res.status(404).json({ message: "User not found." });
//   }

//   user.image = result.secure_url;
//   await user.save();

//   res.status(200).json({
//     success: true,
//     message: "Profile image uploaded successfully.",
//     imageUrl: result.secure_url,
//   });
// });


//DO NOT TOUCH
export const register = TryCatch(async (req, res) => {
  const { email, name, password, contact } = req.body;

  // Check if user already exists
  let user = await User.findOne({ email });

  if (user)
    return res.status(400).json({
      message: "User Already exists",
    });

  // Hash the password
  const hashPassword = await bcrypt.hash(password, 10);

  // Generate a unique referral ID
  const referralLink = uuidv4();

  // Create the user
  user = await User.create({
    name,
    email,
    contact,
    password: hashPassword,
    referralLink, // Add the generated referral link
    earnings: 0,  // Initialize earnings to 0
  });

  // Generate activation token
  const activationToken = jwt.sign(
    { user: { id: user._id, email: user.email } },
    process.env.Activation_Secret,
    { expiresIn: "5m" }
  );

  // Send response
  res.status(200).json({
    message: "User created!",
    activationToken,
    referralLink: user.referralLink, // Optional: return referral link in the response
  });
});




export const loginUser = TryCatch(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({
      message: "No User with this email",
    });

  const mathPassword = await bcrypt.compare(password, user.password);

  if (!mathPassword)
    return res.status(400).json({
      message: "wrong Password",
    });

  const token = jwt.sign({ _id: user._id }, process.env.Jwt_Sec, {
    expiresIn: "15d",
  });

  res.json({
    message: `Welcome back ${user.name}`,
    token,
    user,
  });
});

export const myProfile = TryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({ user });
});

export const forgotPassword = TryCatch(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(404).json({
      message: "No User with this email",
    });

  const token = jwt.sign({ email }, process.env.Forgot_Secret);

  const data = { email, token };

  await sendForgotMail("E learning", data);

  user.resetPasswordExpire = Date.now() + 5 * 60 * 1000;

  await user.save();

  res.json({
    message: "Reset Password Link is send to you mail",
  });
});

export const resetPassword = TryCatch(async (req, res) => {
  const decodedData = jwt.verify(req.query.token, process.env.Forgot_Secret);

  const user = await User.findOne({ email: decodedData.email });

  if (!user)
    return res.status(404).json({
      message: "No user with this email",
    });

  if (user.resetPasswordExpire === null)
    return res.status(400).json({
      message: "Token Expired",
    });

  if (user.resetPasswordExpire < Date.now()) {
    return res.status(400).json({
      message: "Token Expired",
    });
  }

  const password = await bcrypt.hash(req.body.password, 10);

  user.password = password;

  user.resetPasswordExpire = null;

  await user.save();

  res.json({ message: "Password Reset" });
});




//Fetch my affiliates
export const getAffiliates = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `req.user` contains authenticated user info

    const affiliates = await User.find({ referrer: userId }).select(
      "name contact purchasedCourses"
    );

    res.status(200).json({
      success: true,
      affiliates,
    });
  } catch (error) {
    console.error("Error fetching affiliates:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch affiliates",
    });
  }
};
