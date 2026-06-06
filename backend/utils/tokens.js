import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRE || "7d" }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
};

export const sendTokenCookie = (res, token) => {
  const expireDays = Number(config.JWT_COOKIE_EXPIRE) || 7;
  const maxAge = expireDays * 24 * 60 * 60 * 1000;

  res.cookie("token", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  });
};

export const clearTokenCookie = (res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });
};
