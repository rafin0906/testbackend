import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyHost = asyncHandler(async (req, _, next) => {
    try {
        //  Get token from cookie or Authorization header
        const token =
            req.cookies?.hostToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Host token missing");
        }

        //  Verify JWT
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


        // Fetch host user
        const host = await User.findById(decoded?.id).select("_id name isHost roomId avatar");

        if (!host || !host.isHost) {
            throw new ApiError(403, "Not a valid host");
        }

        // Attach host info to request object
        req.host = host;        // full host object
        req.hostId = host._id;  // convenience
        req.roomId = decoded.roomId || host.roomId;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid or expired host token");
    }
});
