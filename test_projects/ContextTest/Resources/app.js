(function foo() {
	var x = 10;
	setTimeout(function () {
		console.log(x);
	});

	function bar() {
		console.log(x);
		x = 20;
		require(x);
	}
	if (Date.now()) {
		bar();
	}
})();
console.log(x);