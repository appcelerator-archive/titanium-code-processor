/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Kickstarts the cluster of works and the master controller for the tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var cluster = require('cluster'),
	path = require('path');

module.exports.run = function (options) {
	if (cluster.isMaster) {
		require(path.join(__dirname, 'master')).run(cluster, options);
	} else {
		require(path.join(__dirname, 'worker')).run();
	}
};