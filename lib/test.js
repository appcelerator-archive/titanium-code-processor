var Types = require("./types/Types.js");

var obj = new Types.TypeObject();
console.log("Can put foo " + obj.canPut("foo"));
obj.put("foo", 10, false);
console.dir(obj);