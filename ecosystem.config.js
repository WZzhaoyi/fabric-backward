module.exports = {
  apps: [
    {
      name: "ftestpuppet",
      script: "ftestpuppet.js",
      watch: ["ftestpuppet.js","libs"],
      ignore_watch : ["node_modules", "pngs"],
    }
  ]
};