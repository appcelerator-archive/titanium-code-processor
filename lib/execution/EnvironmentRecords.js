

var InvalidStateError = require("./Exceptions.js").InvalidStateError,
	InvalidArgumentsError = require("./Exceptions.js").InvalidArgumentsError,
	TypeError = require("./Exceptions.js").TypeError,
	createValue = require("./Util").createValue;

// ******** DeclarativeEnvironmentRecord Class ********

/**
 * Implementation of the DeclarativeEnvironmentRecord class, as described in Section 10.2 of the ECMAScript-262 standard
 *
 * @constructor
 */
var DeclarativeEnvironmentRecord = exports.DeclarativeEnvironmentRecord = function() {
	this._bindings = {};
};

/**
 * Determine if an environment record has a binding for an identifier.
 *
 * @function
 * @param {String} N The String value of the text of the identifier.
 * @return {Boolean} <code>true</code> if the binding exists, <code>false</code> otherwise.
 */
DeclarativeEnvironmentRecord.prototype.hasBinding = function(N) {
	return N in this._bindings;
};

/**
 * Create a new mutable binding in an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {Boolean} [D] Indicates whether or not the binding may be subsequently deleted.
 */
DeclarativeEnvironmentRecord.prototype.createMutableBinding = function(N, D) {

	var bindings = this._bindings;
	if (N in bindings) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + N + "' already exists");
	}

	bindings[N] = {
		value: createValue("Undefined", undefined),
		isDeletable: !!D,
		isMutable: true
	}
};

/**
 * Set the value of an already existing mutable binding in an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {JSValue} V is the value for the binding and may be a value of any ECMAScript language type.
 * @param {Boolean} S Indicates a strict mode reference. If <code>true</code> and the binding cannot be set throw a
 * 		TypeError exception. S is used to identify strict mode references.
 */
DeclarativeEnvironmentRecord.prototype.setMutableBinding = function(N, V, S) {

	var bindings = this._bindings;
	if (!N in bindings) {
		throw new InvalidStateError("Could not set immutable binding: binding '" + N + "' does not exist");
	}

	if (!bindings[N].isMutable) {
		if (S) {
			throw new TypeError("Could not set binding: binding '" + N + "' is not mutable");
		} else {
			return;
		}
	}

	bindings[N].value = V;
};

/**
 * Returns the value of an already existing binding from an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {Boolean} S Indicates a strict mode reference. If <code>true</code> and the binding does not exist or is
 * 		uninitialised throw a ReferenceError exception.
 */
DeclarativeEnvironmentRecord.prototype.getBindingValue = function(N, S) {

	var bindings = this._bindings;
	if (!N in bindings) {
		throw new InvalidStateError("Could not get value: binding '" + N + "' does not exist");
	}

	if (S && bindings[N].isInitialized === false) {
		throw new ReferenceError("Could not get value: binding '" + N + "' has not been initialized");
	}

	return bindings[N].value;
};

/**
 * Delete a binding from an environment record.
 *
 * @param {String} N The text of the bound name.
 * @return {Boolean} If a binding for N exists, remove the binding and return <code>true</code>. If the binding exists
 * 		but cannot be removed return <code>false</code>. If the binding does not exist return <code>true.
 */
DeclarativeEnvironmentRecord.prototype.deleteBinding = function(N) {

	var bindings = this._bindings;
	if (!N in bindings) {
		return true;
	}

	if (!bindings[N].isDeletable) {
		return false;
	}

	delete bindings[N];
	return true;
};

/**
 * Returns the value to use as the this value on calls to function objects that are obtained as binding values from this
 * environment record.
 * 
 * @function
 * @returns {JSValue} The value of <code>this</code>
 */
DeclarativeEnvironmentRecord.prototype.implicitThisValue = function() {
	return undefined; // Always return undefined for declarative environments
};

/**
 * Create a new immutable binding in an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 */
DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function(N) {

	var bindings = this._bindings;
	if (N in bindings) {
		throw new InvalidStateError("Could not create immutable binding: binding '" + N + "' already exists");
	}

	bindings[N] = {
		value: createValue("Undefined", undefined),
		isDeletable: false,
		isMutable: false,
		isInitialized: false
	}
};

/**
 * Set the bound value of the current immutable binding of the identifier
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {JSValue} V The value to bind.
 */
DeclarativeEnvironmentRecord.prototype.InitializeImmutableBinding = function(N, V) {

	var bindings = this._bindings;
	if (!N in bindings) {
		throw new InvalidStateError("Could not initialize immutable value: binding '" + N + "' does not exist");
	}

	if (bindings[N].isInitialized !== false) {
		throw new InvalidStateError("Could not initialize immutable value: binding '" + N + "' has either been initialized already or is not an immutable value");
	}

	bindings[N].value = V;
	bindings[N].isInitialized = true;
};



// ******** ObjectEnvironmentRecord Class ********

/**
 * Implementation of the ObjectEnvironmentRecord class, as described in Section 10.2 of the ECMAScript-262 standard
 *
 * @constructor
 * @param {} bindingObject The object that this context is bound to (kind of, but not really, the <code>this</code> pointer).
 */
var ObjectEnvironmentRecord = exports.ObjectEnvironmentRecord = function(bindingObject) {
	this._bindingObject = bindingObject;
};

/**
 * Determine if an environment record has a binding for an identifier.
 *
 * @function
 * @param {String} N The String value of the text of the identifier.
 * @return {Boolean} <code>true</code> if the binding exists, <code>false</code> otherwise.
 */
ObjectEnvironmentRecord.prototype.hasBinding = function(N) {
	this._bindings = {};
};

/**
 * Create a new mutable binding in an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {Boolean} [D] Indicates whether or not the binding may be subsequently deleted.
 */
ObjectEnvironmentRecord.prototype.createMutableBinding = function(N, D) {
	
};

/**
 * Set the value of an already existing mutable binding in an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {any} V is the value for the binding and may be a value of any ECMAScript language type.
 * @param {Boolean} S Indicates a strict mode reference. If <code>true</code> and the binding cannot be set throw a
 * 		TypeError exception. S is used to identify strict mode references.
 */
ObjectEnvironmentRecord.prototype.setMutableBinding = function(N, V, S) {
	
};

/**
 * Returns the value of an already existing binding from an environment record.
 *
 * @function
 * @param {String} N The text of the bound name.
 * @param {Boolean} S Indicates a strict mode reference. If <code>true</code> and the binding does not exist or is
 * 		uninitialised throw a ReferenceError exception.
 */
ObjectEnvironmentRecord.prototype.getBindingValue = function(N, S) {
	
};

/**
 * Delete a binding from an environment record.
 *
 * @param {String} N The text of the bound name.
 * @return {Boolean} If a binding for N exists, remove the binding and return <code>true</code>. If the binding exists
 * 		but cannot be removed return <code>false</code>. If the binding does not exist return <code>true.
 */
ObjectEnvironmentRecord.prototype.deleteBinding = function(N) {
	
};

/**
 * Returns the value to use as the this value on calls to function objects that are obtained as binding values from this
 * environment record.
 * 
 * @function
 * @returns {any} The value of <code>this</code>
 */
ObjectEnvironmentRecord.prototype.implicitThisValue = function() {
	
};