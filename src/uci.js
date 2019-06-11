const readline = require('readline');

function callUserFunction(f, ...args) {
  if (f) f(...args);
}

const defaults = {
  events: {}
};

module.exports = function Uciengine(opts = defaults) {

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
    function goOption(x, params, goParams) {
      if (params[x]) {
        goParams[x] = parseInt(params[x]);
      }
    }

    switch (command.first) {
    case "uci":
      callUserFunction(opts.events.uci);
      break;
    case "isready":
      callUserFunction(opts.events.isready);
      break;
    case "setoption":
      callUserFunction(opts.events.setoption, {
        name: "", value: "", context: "", ...command.params
      });
      break;
    case "ucinewgame":
      callUserFunction(opts.events.ucinewgame);
      break;
    case "position":
      callUserFunction(opts.events.position, {
        fen: "", startpos: "", moves: "", ...command.params
      });
      break;
    case "go":
      var goParams = {};

      if (command.params.infinite === "") {
        goParams.infinite = true;
      }
      if (command.params.searchmoves) {
        goParams.searchmoves = command.params.searchmoves;
      }
      if (command.params.ponder === "") {
        goParams.ponder = true;
      }

      ['wtime',
       'btime',
       'winc',
       'binc',
       'movestogo',
       'depth',
       'nodes',
       'movetime'].forEach(opt =>
         goOption(opt, command.params, goParams));

      callUserFunction(opts.events.go, goParams);
      break;
    case "stop":
      callUserFunction(opts.events.stop);
      break;
    case "ponderhit":
      callUserFunction(opts.events.ponderhit);
      break;
    case "start":
      callUserFunction(opts.events.start);
      break;
    case "xyzzy":
      sendResponse("Nothing happens.");
      break;
    case "quit":
      return false;
    default: 
      throw new Error("Unknown command: " + command.first);
    }
    return true;
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

  return {
    parseCommand,
    dispatchCommand,
    runloop,
  };
};
