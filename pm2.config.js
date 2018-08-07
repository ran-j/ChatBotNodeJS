module.exports = {
    apps : [
        {
          name: "botJs",
          script: "./bin/www",
          watch: true,
          env: {
              "PORT": 3000,
              "NODE_ENV": "production"
          }
        }
    ]
  }