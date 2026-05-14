const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }


      const userRole = req.user.role?.trim().toLowerCase();
      const roles = allowedRoles.map(r => r.toLowerCase());

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;