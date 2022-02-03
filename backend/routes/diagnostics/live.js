const liveRoute = async (req, res) => {
  res.json({live: true});
};

module.exports.liveRoute = liveRoute;