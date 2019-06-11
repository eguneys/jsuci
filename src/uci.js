const readline = require('readline');

const knownCommands = {
  "uci": [],
  "isready": [],
  "setoption": ["context", "name", "value"],
  "ucinewgame": [],
  "position": ["fen", "startpos", "moves"],
  "go": ["infinite", "wtime", "btime", "winc", "binc", "movestogo", "depth", "nodes", "movetime", "searchmoves", "ponder"],
  "start": [],
  "stop": [],
  "ponderhit": [],
  "quit": [],
  "xyzzy": []
};

function parseCommand(line) {
  const tokens = line.split(' ');

  var token = tokens[0],
      params = {},
      value,
      iter,
      whitespace;

  if (!token) {
    return {};
  }

  const command = { token, value: knownCommands[token] };
  if (!command.value) {
    throw new Error("Unknown command: " + line);
  }

  for (var i = 1; i < tokens.length; i++) {
    token = tokens[i];
    if (command.value.indexOf(token) === -1) {
      if (!value) throw new Error("Unexpected token: " + token);
      params[value.addr] += whitespace + token;
      whitespace = " ";
    } else {
      value = { addr: token, value: "" };
      params[value.addr] = value.value;
      whitespace = "";
    }
  }

  return { first: command.token, params };
}

function dispatchCommand(command) {
  switch (command.first) {
  case "quit":
    return false;
  default: 
    return true;
  }
};

function sendResponse(response) {
  console.log(response);
}

function runloop() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', line => {

    try {
      const command = parseCommand(line);

      if (command) {
        if (!dispatchCommand(command)) rl.close();
      }
    } catch(err) {
      sendResponse("error " + err);
    }
  });
}

module.exports = {
  parseCommand,
  dispatchCommand,
  runloop
};
