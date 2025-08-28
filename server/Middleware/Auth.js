// Middleware/Auth.js
import { clerkClient } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
  try {
    // Check if the user is authenticated.
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: You must be logged in." });
    }

    // Get the userId from the req.auth OBJECT.
    const { userId } = req.auth;
    const user = await clerkClient.users.getUser(userId);

    // Check the user's role in their public metadata.
    if (user.publicMetadata.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Forbidden: You are not an administrator." });
    }

    // If all checks pass, proceed.
    next();
  } catch (error) {
    console.error("Authorization Error in protectAdmin:", error);
    return res.status(500).json({ success: false, message: "An error occurred during authorization." });
  }
};
/* export const protectAdmin = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: You must be logged in." });
    }

    const { userId } = req.auth;
    const user = await clerkClient.users.getUser(userId);

    if (user.publicMetadata.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Forbidden: You are not an administrator." });
    }

    next();
  } catch (error) {
    console.error("Authorization Error in protectAdmin:", error);
    return res.status(500).json({ success: false, message: "An error occurred during authorization." });
  }
}; */