const hospitalMiddleware = (req, res, next) => {
  try {
    if (req.user.role !== 'hospital') {
      return res.status(403).json({
        success: false,
        message: 'Hospital access only',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = hospitalMiddleware;