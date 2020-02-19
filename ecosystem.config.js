module.exports = {
  apps: [
    {
      name: "bitcoint-bot",
      script: "./src/index.js",
      node_args: "-r esm --experimental-modules"
    }
  ]
};