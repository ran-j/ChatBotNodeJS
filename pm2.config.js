module.exports = {
    apps : [
        {
          name: "botJs",
          script: "./bin/www",
          watch: false,
          env: {
              "PORT": 3000,
              "NODE_ENV": "production"
          }
        }
    ]
  }