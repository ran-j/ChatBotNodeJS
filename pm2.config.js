module.exports = {
    apps : [
        {
          name: "botJs",
          script: "./bin/www",
          watch: false,
          env: {
              "PORT": 80,
              "NODE_ENV": "production"
          }
        }
    ]
  }