/*global Ti*/
var win = Ti.UI.createWindow({
	title:'1',
	backgroundColor:'#fff'
});
win.addEventListener('click', function (e) {
	require(this.title);
	require(e);
});