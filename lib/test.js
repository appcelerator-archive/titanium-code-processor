var Types = require("./types/Types.js");

var obj = new Types.TypeObject();
console.log("Can put foo " + obj.canPut("foo"));
console.dir(obj);
obj.put("foo", 10, false);
console.dir(obj);
obj.defineOwnProperty("foo", {
	writeable:false,
	value: 20
}, true);
console.dir(obj);
obj.defineOwnProperty("foo", {
	writeable:true,
	value: 30
}, true);
console.dir(obj);