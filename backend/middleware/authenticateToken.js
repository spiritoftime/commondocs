const db = require("../db/models");
const { User } = db;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../controllers/auth.js");
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return refreshTokenMiddleware(req, res, next);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        // Access token has expired, attempt to refresh it
        refreshTokenMiddleware(req, res, next);
      } else {
        return res
          .status(403)
          .json({ error: "Invalid access token, Please login" }); // Invalid token
      }
    }
    refreshTokenMiddleware(req, res, next);
  });
}
async function refreshTokenMiddleware(req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ error: "Please relogin or register" }); // no such cookie
  const user = await User.findOne({
    where: { refreshToken: refreshToken },
  });

  // next, check if the refreshToken is in the db
  if (!user) {
    return res
      .status(403)
      .json({ error: "invalid refresh tokens. please relogin or register" });
  }
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        user.refreshToken = null;
        await user.save();
        res.clearCookie("refreshToken");

        return res
          .status(403)
          .json({ error: "invalid refresh token. please relogin or register" });
      }

      const accessToken = generateToken(
        { name: user.username, isRefreshed: true },
        "access",
        "15min"
      );

      res.setHeader("Authorization", "Bearer " + accessToken);
      res.setHeader("Access-Control-Expose-Headers", "Authorization");

      next();
    }
  );
}

module.exports = authenticateToken;
