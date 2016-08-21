module.exports.absolutePath = function (input) {
  var win;
  if(typeof window === "object" && input.indexOf('http') !== 0) {
    win = window;
    return win.location.origin + input;
  } else {
    return input;
  }
};
