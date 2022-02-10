module.exports = async (request, response, next) => {
  if (request.user.userType === 'employee') return next();
  
  response.status(401).send("Unauthorized");
};
