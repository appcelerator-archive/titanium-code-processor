/*global Ti*/

// create tab group
var UI = Ti.UI,
	tabGroup = UI.createTabGroup(),

	//
	// create base UI tab and root window
	//
	win1 = UI.createWindow({
		title:'Tab 1',
		backgroundColor:'#fff'
	}),
	tab1 = UI.createTab({
		icon:'KS_nav_views.png',
		title:'Tab 1',
		window:win1
	}),
	label1 = UI.createLabel({
		color:'#999',
		text:'I am Window 1',
		font:{fontSize:20,fontFamily:'Helvetica Neue'},
		textAlign:'center',
		width:'auto'
	}),

	//
	// create controls tab and root window
	//
	win2 = UI.createWindow({
		title:'Tab 2',
		backgroundColor:'#fff'
	}),
	tab2 = UI.createTab({
		icon:'KS_nav_ui.png',
		title:'Tab 2',
		window:win2
	}),
	label2 = UI.createLabel({
		color:'#999',
		text:'I am Window 2',
		font:{fontSize:20,fontFamily:'Helvetica Neue'},
		textAlign:'center',
		width:'auto'
	});

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
UI.setBackgroundColor('#000');

win1.add(label1);
win2.add(label2);

tabGroup.addTab(tab1);
tabGroup.addTab(tab2);

tabGroup.open();
