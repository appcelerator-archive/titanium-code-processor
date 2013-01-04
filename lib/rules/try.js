/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A try statement.
 *
 * @module rules/try
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.14
 */

/**
 * @name module:rules/try.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {{@link module:Base.BaseType} | undefined} exception The exception, if one was thrown, else undefined.
 *		Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base'),
	AST = require('../AST');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 *
 * AST: [node-info, try <array[ast]>, catch <tuple[argument <string>, array[ast]]>, finally <array[ast]>]
 *
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);

	var	tryBlock = ast[1],
		catchBlock = ast[2],
		finallyBlock = ast[3],
		b,
		c,
		f,
		result,
		exception,
		caughtException,
		error,
		i, len;

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('try');

	if (catchBlock && (catchBlock[0] === 'eval' || catchBlock[0] === 'arguments')) {
		Base.throwNativeException('SyntaxError', '"' + catchBlock[0] + '" is not a valid identifier name in strict mode');
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
		var identifier = catchBlock[0],
			currentContext = Runtime.getCurrentContext(),
			oldEnv = currentContext.lexicalEnvironment,
			catchEnv = Base.newDeclarativeEnvironment(oldEnv);
		catchEnv.envRec.createMutableBinding(identifier);
		catchEnv.envRec.setMutableBinding(identifier, param, false);
		currentContext.lexicalEnvironment = catchEnv;
		try {
			result = RuleProcessor.processBlock(catchBlock[1]);
		} finally {
			currentContext.lexicalEnvironment = oldEnv;
		}
		exception = param;
		return result;
	}

	if (catchBlock && finallyBlock) {
		if (b[0] === 'throw') {
			caughtException = undefined;
			try {
				c = evalCatch(b[1]);
			} catch(e) {
				caughtException = Runtime._exception;
			}
		} else {
			c = b;
			for(i = 0, len = catchBlock[1].length; i < len; i++) {
				AST.walk(catchBlock[1][i], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
		}
		f = RuleProcessor.processBlock(finallyBlock);
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
		if (b[0] === 'throw') {
			result = evalCatch(b[1]);
		} else {
			result = b;
			for(i = 0, len = catchBlock[1].length; i < len; i++) {
				AST.walk(catchBlock[1][i], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
		}
	} else if (finallyBlock) {
		f = RuleProcessor.processBlock(finallyBlock);
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

	RuleProcessor.fireRuleEvent(ast, {
		exception: exception,
		result: result
	}, true);

	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);