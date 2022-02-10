module.exports = async (request, response, next) => {
  if (request.user.userType === 'individual') return next();

  response.status(401).send("Unauthorized");
};
