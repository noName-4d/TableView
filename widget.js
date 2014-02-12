WAF.define('TableView', ['waf-core/widget', 'waf-behavior/source-navigation'], function(widget, navigation) {

	var TableView = widget.create('TableView', undefined, {
		tagName: 'div',
		
		cols: widget.property({
			type: 'list',
			attributes: ['label', 'attribute']
		}),
		
		rows: widget.property({
			type: 'datasource'
		}),
		
		
		init: function() {
			this._buildHTMLStructure();
			this.render();
			this._bindPropertyEvent();
			this._bindEvent();
		},


		_bindEvent: function() {
			this.subscribe('beforeFetch',this.appendLoader.bind(this));
			this.subscribe('afterFetch', this.removeLoader.bind(this));

			if (this.rows()) {
				
				this._pagin = new Paginator({ref: this});
				
				this.rows().subscribe('currentElementChange', function(e) {
					var pos = e.data.dataSource.getPosition();
					this.select(pos);
				}.bind(this));
			}
		},


		_bindPropertyEvent: function() {

			this.cols.onInsert(function() {
				this.buildHeader();
				this.buildBody(true);

				var h = this.getHeader();
				var b = this.getBody();
				if (h) {
					this._node.removeChild(h);
				}

				if (b) {
					this._node.removeChild(b);
				}
				this._node.appendChild(this._getFragment());
				this.renderElements();
			}.bind(this));

			this.cols.onRemove(function() {
				this.buildHeader();
				this.buildBody(true);

				var h = this.getHeader();
				var b = this.getBody();

				if (h) {
					this._node.removeChild(h);
				}

				if (b) {
					this._node.removeChild(b);
				}
				this._node.appendChild(this._getFragment());
				this.renderElements();
			}.bind(this));
		},
				
				
		_buildHTMLStructure: function() {
			
			this._node = document.createElement('table');
			this._node.className = 'waf-tableview';
			this.node.appendChild(this._node);
		},


		render: function() {
			this.buildHeader();
			this.buildBody();
			this.buildFooter();

			this._node.innerHTML = '';
			this._node.appendChild(this._getFragment());
		},


		renderHead: function() {
			this.buildHeader();
			var h = this.getHead();
			if (h) {
				this._node.replaceChild(this._getFragment(), h);
			}
		},


		renderFooter: function() {
			this.buildFooter();
			var f = this.getFooter();
			if (f) {
				this._node.replaceChild(this._getFragment(), f);
			}
		},


		buildHeader: function() {
			var th, columns, thead, tr, i, l, f;

			columns = this.cols();
			f = this._getFragment();
			thead = document.createElement('thead');
			tr = document.createElement('tr');

			for (i = 0, l = columns.length; i < l; i++) {
				th = document.createElement('th');
				th.appendChild(document.createTextNode(columns[i].label));
				tr.appendChild(th);
			}
			thead.appendChild(tr);
			f.appendChild(thead);
		},


		select: function(index) {
			var strt, elt, oldElt, oldIndex;
			strt = this.start();

			index = parseInt(index, 10);
			oldIndex = this.indexSelected;
			oldElt = this.getBody().querySelectorAll('#tr_' + oldIndex).item(0);
			elt = this.getBody().querySelectorAll('#tr_' + index).item(0);
			this.indexSelected = index;


			if (elt) {
				if (oldElt) {
					oldElt.className = '';
				}

				elt.className = 'selected';
				this.rows().select(index);
			}
		},


		buildBody: function() {
			var f, tbody;

			f = this._getFragment();
			tbody = document.createElement('tbody');

			tbody.addEventListener('click', this.selectLine.bind(this), false);
			f.appendChild(tbody);
		},


		renderElement: function(line, pos) {
			var value, ln, col, className;
			className = '';
			col = this.cols();
			if (pos === this.indexSelected) {
				className = 'class="selected"';
			}

			ln = '<tr id="tr_' + pos + '" ' + className + ' >';

			for (var i = 0; i < col.length; i++) {
				value = line[col[i].attribute];
				ln += '<td>' + value + '</td>';
			}

			ln += '</tr>';
			return ln;
		},


		buildFooter: function() {
			var tfoot, f = this._getFragment();
			tfoot = document.createElement('tfoot');
			f.appendChild(tfoot);

			if (!this.rows()) {
				return false;
			}
		},


		removeLoader: function() {
			if (this._loader) {
				this.getBody().removeChild(this._loader);
				this._loader = null;
			}
		},


		appendLoader: function() {
			var tr, colNumber, td, div;
			if (this._loader) {
				return false;
			}

			tr = document.createElement('tr');
			colNumber = this.cols().length;
			td = document.createElement('td');
			div = document.createElement('div');

			td.colSpan = colNumber;
			td.className = 'waf-state-loading';
			div.className = 'waf-skin-spinner';

			td.appendChild(div);
			tr.appendChild(td);

			this._loader = tr;
			this.getBody().appendChild(tr);
		},


		clearDomWidget: function() {
			this._node.innerHTML = '';
		},


		clearBody: function() {
			var tbody = this._node.getElementsByTagName('tbody').item(0);
			if (tbody) {
				tbody.innerHTML = '';
			}
		},


		clearFooter: function() {
			var tfoot = this._node.getElementsByTagName('tfoot').item(0);
			if (tfoot) {
				tfoot.innerHTML = '';
			}
		},


		getHeader: function() {
			return this._node.getElementsByTagName('thead').item(0);
		},


		getBody: function() {
			return this._node.getElementsByTagName('tbody').item(0);
		},


		getNavigationContainer: function() {
			return this._node.getElementsByTagName('tbody').item(0);
		},


		getFooter: function() {
			return this._node.getElementsByTagName('tfoot').item(0);
		},


		_getFragment: function() {
			if (this.currentFragment) {
				return this.currentFragment;
			}
			this.currentFragment = document.createDocumentFragment();

			return this.currentFragment;
		},


		selectLine: function(e) {
			var parent = e.target.parentElement;
			var id = parent.id;
			id = id.replace('tr_', '');
			if (id) {
				this.select(id);
			}
		},

		//========== method tempo ===========//

		getNavigationSource: function() {
			return this.rows;
		},


		appendFootPluggin: function(plug) {
			this.clearFooter();
			var line, td, f;
			f = this.getFooter();
			if (f) {

				line = document.createElement('tr');
				td = document.createElement('td');
				td.style.height = '50px';
				td.appendChild(plug.node);
				td.colSpan = this.cols().length;
				line.appendChild(td);

				f.appendChild(line);
			}
		},


		insertCols: function() {
			this.cols.push({
				label: 'new cols',
				attribute: 'lastName'
			});
		}
	
	});
	
	TableView.inherit(navigation);
	
	
	var Paginator = widget.create('Paginator', undefined, {
		tagName: 'span',
		
		currentPage: widget.property({
			defaultValue: 1, 
			type: 'integer'
		}),
		
		pageSize: widget.property({
			type: 'integer'
		}),
		
		init: function(option) {
			this.ref = option.ref;
			if (!this.ref) {
				this.render();
				return false;
			}
			this.ref.navigationMode('pagination');

			this.bindPropertyEvent();

			this.render();
		},


		bindPropertyEvent: function() {
			var currentPageSubscriber, pSizeSub, refcurrentPageSubscriber;

			currentPageSubscriber = this.currentPage.onChange(function(page, oldPage) {
				var p = page, reset = true;

				if (p && !isNaN(p) && p > 0 && p <= this.nbPage()) {
					reset = false;

					refcurrentPageSubscriber.pause();
					this.ref.currentPage(p);
					refcurrentPageSubscriber.resume();
				} else {
					currentPageSubscriber.pause();
					this.currentPage(oldPage);
					currentPageSubscriber.resume();
				}

				if (!reset) {
					this.updateText(p);
				} else {
					this.updateText(this.currentPage());
				}
			}.bind(this));


			var refcurrentPageSubscriber = this.ref.currentPage.onChange(function(page) {
				currentPageSubscriber.pause();
				this.currentPage(page);
				currentPageSubscriber.resume();

				this.updateText(page);
			}.bind(this));


			this.ref.nbPage.onChange(function() {
				this.render();
			}.bind(this));


			var hManyRefSubs = this.ref.pageSize.onChange(function(val) {
				pSizeSub.pause();
				this.pageSize(val);
				pSizeSub.resume();

				this.render();
			}.bind(this));


			pSizeSub = this.pageSize.onChange(function(v) {
				hManyRefSubs.pause();
				this.ref.pageSize(v);
				hManyRefSubs.resume();

				this.render();
			}.bind(this));

		},


		updatePage: function() {
			this.textObject.value = this.currentPage();
		},


		nextPage: function() {
			if (this.ref) {
				this.ref.nextPage();
			}
		},


		prevPage: function() {
			if (this.ref) {
				this.ref.prevPage();
			}
		},

		changePage: function(page) {
			var p = parseInt(page, 10), reset = true;

			if (p && !isNaN(p) && this.ref && p !== this.ref.currentPage() && p > 0 && p <= this.ref.nbPage()) {
				this.ref.currentPage(p);
			}
		},


		updateText: function(val) {
			if (this.textObject && this.textObject.value) {
				this.textObject.value = val;
			}
		},


		render: function() {
			var txt, f, lArrow, rArrow, spanTxt, nbPage, currPage;

			currPage = 0;
			nbPage = 0;
			if (this.ref) {
				currPage = this.ref.currentPage();
				nbPage = this.ref.nbPage();
			}
			f = document.createDocumentFragment();
			this.node.innerHTML = '';

			rArrow = document.createElement('span');
			lArrow = document.createElement('span');
			spanTxt = document.createElement('span');

			rArrow.appendChild(document.createTextNode(' >>'));
			lArrow.appendChild(document.createTextNode('<< '));

			this.textObject = txt = document.createElement('input');

			rArrow.addEventListener('click', this.nextPage.bind(this), false);
			lArrow.addEventListener('click', this.prevPage.bind(this), false);
			txt.addEventListener('change', function() {
				this.changePage(txt.value);
			}.bind(this), false);

			txt.type = 'text';
			txt.style.width = '20px';
			txt.value = currPage;

			f.appendChild(lArrow);
			f.appendChild(txt);
			f.appendChild(document.createTextNode(' / ' + nbPage));
			f.appendChild(rArrow);

			this.node.appendChild(f);

			if (this.ref) {
				this.ref.appendFootPluggin(this);
			}
		}
	});
	
	
	return TableView;
});

