import mongoose from "mongoose";

export const disconnect = async () => {
  try {
    await mongoose.disconnect();
    console.log("🚀 ~ file: disconnect.ts:14 ~ disconnect ~ mongoose: disconnected");
  } catch (error) {
    console.error("🚀 ~ file: disconnect.ts:16 ~ disconnect ~ error:", error);
  }
};