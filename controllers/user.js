import  User  from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import TryCatch from "../middlewares/TryCatch.js";
import { v4 as uuidv4 } from "uuid";

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
