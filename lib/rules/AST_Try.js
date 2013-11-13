/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A try statement.
 *
 * @module rules/AST_Try
 * @see ECMA-262 Spec Chapter 12.14
 */

/**
 * The try rule event
 *
 * @event module:rules/AST_Try.rule
 * @property {string} ruleName The string 'AST_Try'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {(module:Base.BaseType | undefined)} exception The exception, if one was thrown, else undefined.
 *		Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base'),
	AST = require('../AST');

AST.registerRuleProcessor('AST_Try', function processRule() {

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

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Try');

	catchArg = catchBlock && catchBlock.argname.name;
	if (catchBlock && (catchArg === 'eval' || catchArg === 'arguments')) {
		Base.throwNativeException('SyntaxError', '"' + catchArg + '" is not a valid identifier name in strict mode');
	}

	try {
		Base.enterTryCatch();
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
	Base.exitTryCatch();

	function evalCatch(param) {
		var currentContext = Base.getCurrentContext(),
			oldEnv = currentContext.lexicalEnvironment,
			catchEnv = Base.newDeclarativeEnvironment(oldEnv);
		Base.setVisited(catchBlock.argname);
		if (Base.type(param) === 'Unknown') {
			catchBlock.argname._unknown = true;
		}
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
		Base.setVisited(catchBlock);
		Base.setVisited(finallyBlock);
		if (b[0] === 'throw') {
			caughtException = undefined;
			try {
				c = evalCatch(b[1]);
			} catch(e) {
				caughtException = Runtime._exception;
			}
		} else {
			c = b;
			Base.processInSkippedMode(function () {
				catchBlock.argname.processRule();
				for (i = 0, len = catchBlock.body.length; i < len; i++) {
					catchBlock.body[i].processRule();
				}
			});
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
		Base.setVisited(catchBlock);
		if (b[0] === 'throw') {
			result = evalCatch(b[1]);
		} else {
			result = b;
			Base.processInSkippedMode(function () {
				Base.setVisited(catchBlock.argname);
				for (i = 0, len = catchBlock.body.length; i < len; i++) {
					catchBlock.body[i].processRule();
				}
			});
		}
	} else if (finallyBlock) {
		Base.setVisited(finallyBlock);
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

	RuleProcessor.postProcess(this);

	return result;
});