import mongoose from "mongoose";



export const connectDb = async () => {
  console.log("database call");
  try {
    
    await mongoose.connect("mongodb+srv://akashrathod782304:SuccessMarathi@successmarathi.us4cy.mongodb.net/successMarathi?retryWrites=true&w=majority&appName=successMarathi");
    console.log("Database Connected");
  } catch (error) {
    console.log("database call");
    console.log(error);
  }
};
