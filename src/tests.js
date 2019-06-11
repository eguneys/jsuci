const testutils = require('testiz');
const { log, ok, deep_is, is, not, throws } = testutils;

const { parseCommand } = require('./uci');

function tests() {
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
    

}

tests();
