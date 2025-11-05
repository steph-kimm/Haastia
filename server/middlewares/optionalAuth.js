import jwt from "jsonwebtoken";

export const optionalAuth = (req, _res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // token payload should look like: { _id, name, role, iat, exp }
      req.user = decoded; // now req.user._id is available in controllers
    }
  } catch (err) {
    // If token is bad/expired, we just proceed as a guest
    // (You can log if you want: console.warn('optionalAuth token invalid', err.message))
  }
  next();
};
