import express from "express";
import dotenv from "dotenv";
import { connectDb } from "./database/db.js";
import Razorpay from "razorpay";
import cors from "cors";
//testing
import { resetEarnings } from "./middlewares/resetEarnings.js";
import bodyParser from "body-parser";




import multer from "multer";

dotenv.config();


export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_Secret,
});

const app = express();

// using middlewares
app.use(express.json());
app.use(cors());


app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use("/uploads", express.static("uploads"));



// importing routes
import userRoutes from "./routes/user.js";
import courseRoutes from "./routes/course.js";
import adminRoutes from "./routes/admin.js";

// using routes
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", adminRoutes);


app.post("/create-order", async (req, res) => {
  try {
      const options = {
          amount: req.body.amount * 100, // Convert amount to paisa (₹1 = 100 paisa)
          currency: "INR",
          receipt: "order_rcptid_" + Math.random().toString(36).substring(7),
          payment_capture: 1, // Auto-capture payment
      };

      const order = await instance.orders.create(options);
      res.json(order);
  } catch (error) {
      res.status(500).send("Error creating order: " + error.message);
  }
});

connectDb();

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
  resetEarnings();
});
