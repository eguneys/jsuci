const testutils = require('testiz');
const { log, ok, deep_is, is, not, throws } = testutils;

const Uciengine = require('./uci');

function withDispatchEvent(command, event, f) {
  var called;
  var { parseCommand, dispatchCommand } = Uciengine({
    events: {
      [event]: (...args) => {
        called = true;
        f(...args);
      }
    }
  });

  var res = dispatchCommand(parseCommand(command));

  if (!called) {
    throw new Error("didn't fire " + event);
  }
  
  return res;
}

function tests() {
  
  var { parseCommand, dispatchCommand } = Uciengine({});

  log('parse command');

  var bads = [
    ["badcommand","Unknown command: badcommand"],
    ["uci xyz", "Unexpected token: xyz"],
    ["setoption xyz", "Unexpected token: xyz"],
  ];

  bads.forEach(bad =>
    throws(bad[0] + " should throw " + bad[1], bad[1],
           () => parseCommand(bad[0]))
  );

  var goods = [
    ["", {}],
    ["uci", { first: "uci", params: {} }],
    ["setoption context x y z",
     { first: "setoption", params: { context: "x y z" } }],
    ["setoption context x y name a b value 1 2",
     { first: "setoption", params: { context: "x y", name: "a b", value: "1 2" } }]
  ];

  goods.forEach(good =>
    deep_is("command " + good[0], parseCommand(good[0]), good[1]));


  log('dispatch command');

  throws("empty command", "Unknown command: ", () => dispatchCommand(parseCommand("")));

  is("quit returns false", false, dispatchCommand(parseCommand("quit")));

  var dispatches = [
    { command: "uci", event: "uci", callback: [] },
    { command: "isready", event: "isready", callback: [] },
    { command: "setoption", event: "setoption", callback: [{ name: "", value: "", context: ""}] },
    { command: "setoption name x y z value a b", event: "setoption", callback: [{ name: "x y z", value: "a b", context: ""}] },
    { command: "ucinewgame", event: "ucinewgame", callback: [] },
    { command: "position", event: "position", callback: [{ fen: "", startpos: "", moves: "" }] },
    { command: "position fen 1/2/3 w k", event: "position", callback: [{ fen: "1/2/3 w k", startpos: "", moves: "" }] },
    { command: "go", event: "go", callback: [{}] },
    { command: "go infinite", event: "go", callback: [{ infinite: true }] },
    { command: "go ponder", event: "go", callback: [{ ponder: true }] },
    { command: "go searchmoves abc d", event: "go", callback: [{searchmoves: "abc d"}] },
    { command: "go wtime 3", event: "go", callback: [{ wtime: 3 }]},
    { command: "start", event: "start", callback: [] },
    { command: "stop", event: "stop", callback: [] },
    { command: "ponderhit", event: "ponderhit", callback: [] }
  ];

  dispatches.forEach(dispatch => 
    is(dispatch.command + " is ok", true, withDispatchEvent(dispatch.command, dispatch.event, (...args) => {
      deep_is(dispatch.event + " fired", args, dispatch.callback);
    })));
  
}

tests();
