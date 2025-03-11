import mongoose from "mongoose";



export const connectDb = async () => {
  console.log("database call");
  try {
    
    await mongoose.connect(process.env.DB);
    console.log("Database Connected");
  } catch (error) {
    console.log("database call");
    console.log(error);
  }
};
