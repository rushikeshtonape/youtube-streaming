import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (LocalFilePath) => {
  try {
    if (!LocalFilePath) return null;
    // upload the file on cloudinary
    const responce = await cloudinary.uploader.upload(LocalFilePath, {
      resource_type: "auto",
    });

    // console.log("file is uploaded on cloudinary", responce.url);
    fs.unlinkSync(LocalFilePath);
    return responce;
  } catch (error) {
    fs.unlinkSync(LocalFilePath);
    return null;
  }
};

export { uploadOnCloudinary };
