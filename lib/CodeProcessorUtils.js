/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Various helper methods
 *
 * @module CodeProcessorUtils
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

module.exports.pluralize = function (singular, plural, value) {
	var sourceStr = value === 1 ? singular : plural;
	return sourceStr.replace(/%s/g, value);
};