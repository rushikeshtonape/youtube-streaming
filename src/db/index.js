import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import colors from "colors";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
        .bgMagenta
    );
  } catch (error) {
    console.log("MONGODB connection FAILED ".bgMagenta, error);
    process.exit(1);
  }
};

export default connectDB;
