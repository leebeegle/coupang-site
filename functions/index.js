const functions = require("firebase-functions");

const domainMap = {
  "shop.friendstoktok.co.kr": "shop",
  "aurora.friendstoktok.co.kr": "aurora",
  "meteor.friendstoktok.co.kr": "meteor",
  "galaxy.friendstoktok.co.kr": "galaxy",
  "nebula.friendstoktok.co.kr": "nebula",
  "comet.friendstoktok.co.kr": "comet",
  "orbit.friendstoktok.co.kr": "orbit",
  "saturn.friendstoktok.co.kr": "saturn",
  "jupiter.friendstoktok.co.kr": "jupiter",
  "venus.friendstoktok.co.kr": "venus",
  "mercury.friendstoktok.co.kr": "mercury",
  "eclipse.friendstoktok.co.kr": "eclipse",
  "nova.friendstoktok.co.kr": "nova",
  "cosmos.friendstoktok.co.kr": "cosmos",
  "pluto.friendstoktok.co.kr": "pluto",
  "rocket.friendstoktok.co.kr": "rocket",
  "apollo.friendstoktok.co.kr": "apollo",
  "luna.friendstoktok.co.kr": "luna",
  "astro.friendstoktok.co.kr": "astro",
  "stella.friendstoktok.co.kr": "stella",
  "solaris.friendstoktok.co.kr": "solaris",
};

exports.robots = functions.https.onRequest((req, res) => {
  const host = req.hostname;
  const siteId = domainMap[host] || "shop";
  const sitemapUrl = `https://${host}/sitemap_${siteId}.xml`;
  const robotsTxt = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}`;
  res.set("Content-Type", "text/plain");
  res.send(robotsTxt);
});