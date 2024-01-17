import mongoose, { Schema } from "mongoose";

const subcriptionSchema = mongoose.Schema(
  {
    subcriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timespamps: true }
);

export const Subcription = mongoose.model("Subcription", subcriptionSchema);
