<p align="center"><a href="#" target="_blank" rel="noopener noreferrer"><img width="500" src="https://i.ytimg.com/vi/656l4IfhM10/maxresdefault.jpg" alt="ChatBot logo"></a></p>

<p align="center">

</p>

<h2 align="center">ChatBotJS</h2>

A contextual Chatbot with entities extractor build with TensorflowJS and NodeJS

Install dependencies and run.

```sh

$ npm cd ChatBotNodeJS
$ npm install
$ npm start

```

Install dependencies and run with sample train.

```sh

$ npm cd ChatBotNodeJS
$ npm install
$ npm run seed
$ npm start

```

# Build with docker.

```sh

$ npm cd ChatBotNodeJS
$ docker network create backend-bot
$ docker network create frontend-bot
$ docker-compose up --build

```

# Use respository.

```sh

$ docker pull docker.pkg.github.com/ran-j/chatbotnodejs/chatbotnodejs:latest
$ docker run --publish 3000:3000 --detach --name chatbotnodejs chatbotnodejs:latest

```

# Configuration

Change mongoURI in `./bin/Config.js`

# Routes

* To interact with bot: [http://localhost:3007/](http://localhost:3007/)
* To train bot intents: [http://localhost:3007/admin/intents](http://localhost:3007/admin/intents)
* To train bot synonyms: [http://localhost:3007/admin/synonyms](http://localhost:3007/admin/synonyms)

You can register your intents and the build agent.

| Register      | Train      | Anwser      |
|------------|-------------|-------------|
| <img src="./images/trainlist.PNG" width="500"> | <img src="./images/build.PNG" width="500"> | <img src="./images/chat.PNG" width="500"> |


# Todo List

- [ ] Auth
- [ ] User CRUD
- [ ] Fallback dashboard
- [ ] Token for requests
- [ ] Metricis (Count request numbers ...)
- [x] Entity Extractor
- [X] Docker
- [X] Update Tensorflow JS
- [X] Log conversation and fallbacks
- [X] Data table for intents list
- [X] Optimizations on train and answer
