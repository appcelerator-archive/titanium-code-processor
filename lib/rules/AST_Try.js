/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A try statement.
 *
 * @module rules/AST_Try
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.14
 */

/**
 * @name module:rules/AST_Try.rule
 * @event
 * @property {String} ruleName The string 'AST_Try'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {{@link module:Base.BaseType} | undefined} exception The exception, if one was thrown, else undefined.
 *		Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base'),
	AST = require('../AST');

AST.registerRuleProcessor('AST_Try', function processRule() {

	this._preProcess();

	var	tryBlock = this.body,
		catchBlock = this.bcatch,
		catchArg,
		finallyBlock = this.bfinally,
		b,
		c,
		f,
		result,
		exception,
		caughtException,
		error,
		i, len;

	RuleProcessor.fireRuleEvent(this, {}, false);

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Try');

	catchArg = catchBlock && catchBlock.argname.name;
	if (catchBlock && (catchArg === 'eval' || catchArg === 'arguments')) {
		Base.throwNativeException('SyntaxError', '"' + catchArg + '" is not a valid identifier name in strict mode');
	}

	try {
		Runtime.enterTryCatch();
		b = RuleProcessor.processBlock(tryBlock);
	} catch (e) {
		if (e.isCodeProcessorException) {
			b = ['throw', Runtime._exception, undefined];
			caughtException = Runtime._exception;
			Runtime._exception = undefined;
		} else {
			throw e;
		}
	}
	Runtime.exitTryCatch();

	function evalCatch(param) {
		var currentContext = Runtime.getCurrentContext(),
			oldEnv = currentContext.lexicalEnvironment,
			catchEnv = Base.newDeclarativeEnvironment(oldEnv);
		catchBlock.argname._visited = true;
		catchEnv.envRec.createMutableBinding(catchArg);
		catchEnv.envRec.setMutableBinding(catchArg, param, false);
		currentContext.lexicalEnvironment = catchEnv;
		try {
			result = RuleProcessor.processBlock(catchBlock.body);
		} finally {
			currentContext.lexicalEnvironment = oldEnv;
		}
		exception = param;
		return result;
	}

	if (catchBlock && finallyBlock) {
		catchBlock._visited = true;
		finallyBlock._visited = true;
		if (b[0] === 'throw') {
			caughtException = undefined;
			try {
				c = evalCatch(b[1]);
			} catch(e) {
				caughtException = Runtime._exception;
			}
		} else {
			c = b;
			for(i = 0, len = catchBlock.body.length; i < len; i++) {
				catchBlock.argname._skipped = true;
				AST.walk(catchBlock.body[i], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
		}
		f = RuleProcessor.processBlock(finallyBlock.body);
		if (f[0] === 'normal') {
			result = c;
		} else {
			result = f;
		}
		if (caughtException) {
			Runtime._exception = caughtException;
			error = new Error('VM exception flow controller');
			error.isCodeProcessorException = true;
			throw error;
		}
	} else if (catchBlock) {
		catchBlock._visited = true;
		if (b[0] === 'throw') {
			result = evalCatch(b[1]);
		} else {
			catchBlock.argname._skipped = true;
			result = b;
			for(i = 0, len = catchBlock.body.length; i < len; i++) {
				AST.walk(catchBlock.body[i], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
		}
	} else if (finallyBlock) {
		finallyBlock._visited = true;
		f = RuleProcessor.processBlock(finallyBlock.body);
		if (f[0] === 'normal') {
			if (caughtException) {
				Runtime._exception = caughtException;
				error = new Error('VM exception flow controller');
				error.isCodeProcessorException = true;
				throw error;
			} else {
				result = b;
			}
		} else {
			result = f;
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		exception: exception,
		result: result
	}, true);

	this._postProcess();

	return result;
});