(function(tableView) {
	
	tableView.customizeProperty('start', {
		display: false,
		sourceDisplay: false
	});
	
	tableView.customizeProperty('nbPage', {
		display: false,
		sourceDisplay: false
	});
	
	tableView.customizeProperty('navigationMode', {
		display: false,
		sourceDisplay: false
	});
	
	tableView.customizeProperty('currentPage', {
		display: false,
		sourceDisplay: false
	});
	
	tableView.customizeProperty('pageSize', {
		title: 'Page size',
		sourceDisplay: false
	});
	
	tableView.customizeProperty('simpleEditMode', {
                title: 'Simple edit mode',
		sourceDisplay: false
	});
	
	tableView.customizeProperty('cols', {
		title: 'Columns'
	});
	
	tableView.removeEvent('insert');
	tableView.removeEvent('change');
	tableView.removeEvent('remove');
	tableView.removeEvent('modify');
	tableView.removeEvent('move');
});