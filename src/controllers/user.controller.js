import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefeshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefeshToken();

    user.refreshToken = refreshToken; //add refresh token
    await user.save({ validateBeforeSave: false }); //save user without validate

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

const RegisterUser = asyncHandler(async (req, res) => {
  //get the data from the user
  const { username, email, fullName, password } = req.body;
  if (!username | !email | !fullName | !password) {
    throw new ApiError(400, "PLease Enter all the required fields");
  }

  //Check if the user is already registered or not
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existingUser) {
    throw new ApiError(408, "User already exists");
  }
  //  Check for image and check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files && req.files.coverImage)) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar file is required");
  }

  //   Upload images on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //   Create user Object and entry into the Database
  const user = await User.create({
    email,
    username: username.toLowerCase(),
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  // remove the password and refresh token from responce for security
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(400, "Something went wrong while registering user");
  }

  //Return the successfully created responce
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // req body > data

  const { email, username, password } = req.body;
  // username or email
  if (!email || !username) {
    throw new ApiError(400, "Username or Email is Required");
  }

  // find the user

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(400, "User Not Found");
  }
  // check password

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid User Credintials");
  }

  // access and refresh token

  const { accessToken, refreshToken } = await generateAccessAndRefeshToken(
    user._id
  );

  // send cookies
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User Logged In Success"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCoolie("refreshToken", options)
    .clearCoolie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { RegisterUser, loginUser, logoutUser };
