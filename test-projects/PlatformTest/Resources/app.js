/*global Ti*/
Ti.UI.Android.createProgressIndicator();
if (Ti.Platform.osname === 'mobileweb') {
	Ti.UI.MobileWeb.createNavigationGroup();
}