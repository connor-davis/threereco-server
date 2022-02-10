module.exports = async (request, response, next) => {
  if (request.user.userType === 'company') return next();
  
  response.status(401).send("Unauthorized");
};
