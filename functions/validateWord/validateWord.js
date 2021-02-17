const fs = require("fs");

exports.handler = function(event, context, callback) {
  const dictionary = JSON.parse(
    fs.readFileSync(require.resolve("./data/small_dictionary.json"), "utf-8")
  );
  const { word } = JSON.parse(event.body);
  const res = dictionary.findIndex(e => e === word);
  callback(null, {
    statusCode: 200,
    body: res === -1 ? "false" : "true"
  });
};
