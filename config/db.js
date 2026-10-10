import "dotenv/config";
import mongoose from "mongoose";

const mongoUrl =
  process.env.NODE_ENV === "development"
    ? process.env.mongo_url
    : process.env.MONGO_URI;

const connectDB = () => {
  mongoose
    .connect(mongoUrl)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => console.error(err));
};

export default connectDB;
