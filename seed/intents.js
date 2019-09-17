var intents = [
  {
    "tag": "fallback",
    "patterns": [],
    "title": "FallBack response",
    "responses": ['Sorry I did not understand', 'Sorry, I still can not understand everything.']
  },
  {
    "tag": "greeting",
    "patterns": ["Hi", "How are you?", "Is anyone there?", "Hello", "Good day"],
    "title": "Salutations",
    "responses": ["Hello, thanks for visiting", "Good to see you again", "Hi there, how can I help?"],
    "context_set": ""
  },
  {
    "tag": "goodbye",
    "patterns": ["Bye", "See you later", "Goodbye"],
    "title": "Farewells",
    "responses": ["See you later, thanks for visiting", "Have a nice day", "Bye! Come back again soon."]
  },
  {
    "tag": "thanks",
    "patterns": ["Thanks", "Thank you", "That's helpful"],
    "title": "Thanks user",
    "responses": ["Happy to help!", "Any time!", "My pleasure"]
  },
  {
    "tag": "hours",
    "patterns": ["What hours are you open?", "What are your hours?", "When are you open?"],
    "title": "Hours open",
    "responses": ["We're open every day 9am-9pm", "Our hours are 9am-9pm every day"]
  },
  {
    "tag": "mopeds",
    "patterns": ["Which mopeds do you have?", "What kinds of mopeds are there?", "What do you rent?"],
    "title": "Mopeds do we have",
    "responses": ["We rent Yamaha, Piaggio and Vespa mopeds", "We have Piaggio, Vespa and Yamaha mopeds"]
  },
  {
    "tag": "payments",
    "patterns": ["Do you take credit cards?", "Do you accept Mastercard?", "Are you cash only?"],
    "title": "Payments methods",
    "responses": ["We accept VISA, Mastercard and AMEX", "We accept most major credit cards"]
  },
  {
    "tag": "opentoday",
    "patterns": ["Are you open today?", "When do you open today?", "What are your hours today?"],
    "title": "Days open",
    "responses": ["We're open every day from 9am-9pm", "Our hours are 9am-9pm every day"]
  },
  {
    "tag": "rental",
    "patterns": ["Can we rent a moped?", "I'd like to rent a moped", "How does this work?"],
    "title": "Rent a moped",
    "responses": ["Are you looking to rent today or later this week?"],
    "context_set": "rentalday"
  },
  {
    "tag": "today",
    "patterns": ["today"],
    "responses": ["For rentals today please call 1-800-MYMOPED", "Same-day rentals please call 1-800-MYMOPED"],
    "title": "Rentals Todays",
    "context_filter": "rentalday"
  },
  {
    "tag": "myname",
    "patterns": ["whats your name ?", "who are you"],
    "responses": ["my name is {botname}, and my version is {botversion}", "You cam call me {botname}"],
    "title": "Bot name",
  }
];

module.exports = intents;