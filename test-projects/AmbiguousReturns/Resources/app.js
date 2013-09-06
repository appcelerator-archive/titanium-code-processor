function foo() {
	if (Date.now()) {
		return 1;
	}
	return 2;
}
require(foo());