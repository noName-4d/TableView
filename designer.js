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
		sourceDisplay: false
	});
	
	tableView.customizeProperty('simpleEditMode', {
		sourceDisplay: false
	});
	
	tableView.removeEvent('insert');
	tableView.removeEvent('change');
	tableView.removeEvent('remove');
	tableView.removeEvent('modify');
	tableView.removeEvent('move');
});