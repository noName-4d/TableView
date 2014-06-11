WAF.define('TableView', ['waf-core/widget'], function(widget, navigation) {

	var TableView = widget.create('TableView', undefined, {
		tagName: 'div',
		
		rows: widget.property({
			type: 'datasource'
		}),
		
		cols: widget.property({
			type: 'list',
			attributes: ['label', 'attribute']
		}),
		
		
		start: widget.property({
			defaultValue: 0,
			type: 'integer'
		}),


		currentPage: widget.property({
			defaultValue: 1,
			type: 'integer'
		}),


		pageSize: widget.property({
			defaultValue: 20,
			type: 'integer'
		}),


		nbPage: widget.property({
			type: 'integer'
		}),


		navigationMode: widget.property({
			defaultValue: 'pagination',
			'enum': ['loadmore', 'pagination']
		}),
		
		
		simpleEditMode: widget.property({
			type: 'boolean',
			defaultValue: false
		}),
		
		
		init: function() {
			this._buildEditCellText();
			this._buildHTMLStructure();
			this.render();
			this._initTmpBehavior();
			this._bindPropertyEvent();
			this._bindEvent();
		},
		
		
		_initTmpBehavior: function() {
	
			var source;
			this._initDsEvent();
			this._defaultStep = this.pageSize();
			source = this.getNavigationSource();
			if (source()) {
				this._pagin = new Paginator({ref: this});
				this._sorter = new TableSorter({ref: this});
			}
			
			
			source.onChange(function() {
				if (this._dsCollChgSubscriber && this._dsCollChgSubscriber.unsubscribe) {
					this._dsCollChgSubscriber.unsubscribe();
				}
				
				if (this._dsCurrEltSubscriber && this._dsCurrEltSubscriber.unsubscribe) {
					this._dsCurrEltSubscriber.unsubscribe();
				}
				
				this.renderElements();
				this._initDsEvent();
				if (!this._pagin) {
					this._pagin = new Paginator({ref: this});
				}
			});


			this._startSubscriber = this.start.onChange(function(val) {
				var modulo, pageSize, page, navigationType;
				
				pageSize = this.pageSize();
				navigationType = this.navigationMode();
				
				if (navigationType === 'pagination') {
					modulo = val % pageSize;
					page = Math.ceil(val / pageSize);
					
					if (modulo !== 0) {
						this._startSubscriber.pause();
						this.start((page - 1) * pageSize);
						this._startSubscriber.resume();
					} else {
						++page;
					}
					
					this._currentPageSubscriber.pause();
					this.currentPage(page);
					this._currentPageSubscriber.resume();
				}
				
				
				this.generateElements(this.start(), this.pageSize(), function(fragment) {
					var container = this._getNavigationContainer();
					container.innerHTML = '';
					container.insertAdjacentHTML('beforeend', fragment);
				}.bind(this));
			});


			this._currentPageSubscriber = this.currentPage.onChange(function(val) {
				var start = ((val - 1) * this.pageSize());
				this._startSubscriber.pause();
				this.start(start);
				this._startSubscriber.resume();
				
				this.generateElements(this.start(), this.pageSize(), function(fragment) {
					var container = this._getNavigationContainer();
					container.innerHTML = '';
					container.insertAdjacentHTML('beforeend', fragment);
				}.bind(this));
			});
			
			
			this._pageSizeSubscriber = this.pageSize.onChange(function(val, oldVal) {
				
				var length, start, sourceProperty, source;
				oldVal = oldVal || 0;
				
				sourceProperty = this.getNavigationSource();
				source = sourceProperty();
				if (!source) {
					return false;
				}
				
				if (val < oldVal) {
					length = val;
					start = this.start();
				} else {
					length = val - oldVal;
					start = this.start() + oldVal;
				}
				
				this.nbPage(Math.ceil(source.length / val));
				
				var fn = function(fragment) {
					var container = this._getNavigationContainer();
					if (val < oldVal) {
						container.innerHTML = '';
					}
					
					container.insertAdjacentHTML('beforeend', fragment);
					
				}.bind(this);

				this.generateElements(start, length, fn);
			});
		},

		_bindEvent: function() {
			this.subscribe('beforeFetch',this.appendLoader.bind(this));
			this.subscribe('afterFetch', this.removeLoader.bind(this));

			if (this.rows()) {
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
			this.node.innerHTML = '';
			this._node = document.createElement('table');
			this._node.className = 'waf-tableview waf-ui-box';
			this.node.appendChild(this._node);
		},


		_buildEditCellText: function() {
			var txt;
			this._editCellText = txt = document.createElement('input');
			txt.type = 'text';
			txt.style.height = '100%';
			txt.style.width = '100%';
            
			txt.addEventListener('blur', this.updateDsFromText.bind(this));
			txt.addEventListener('keypress', this.escapeFromText.bind(this));
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
			thead.className = 'waf-ui-header';
			tr = document.createElement('tr');

			for (i = 0, l = columns.length; i < l; i++) {
				th = document.createElement('th');
				th.appendChild(document.createTextNode(columns[i].label));
				tr.appendChild(th);
			}
			thead.appendChild(tr);
			f.appendChild(thead);
		},
		
		
		handleDblclick: function(ev) {
			var that, target, tr, attribute, txt, td;
			
			if (this.simpleEditMode() === false) {
				return false;
			}
			
			that = this;
			target = ev.target;
			tr = target.parentElement;
			attribute = target.dataset['attribute'];
			
			
			
			if (target.tagName !== 'TD') {
				return false;
			}
			
			
			var id = tr.id.replace('tr_', '');

			this.rows().getElement(id, {
				onSuccess: function(dsEvent) {
					var value = dsEvent.element[attribute];
					
					that._focusEntity = dsEvent.element._private.currentEntity;
					that._editCellText.value = value;
					that._editValue = value;
					if (target.firstChild) {
						target.replaceChild(that._editCellText, target.firstChild);
					} else {
						target.appendChild(that._editCellText);
					}
					
					setTimeout(function() {
						that._editCellText.focus();
					}, 0);
					
					
					that._tdFocus = target;
					
					setTimeout(function() {
						target.focus();
					}, 0);
				}
			});
		},
		
		
		updateDsFromText: function(ev) {
			
			var attr, tdItm, txtItm, oldValue, val;
			
			val = this._editCellText.value;

			tdItm = this._tdFocus;
			txtItm = this._editCellText;
			
			attr = this._tdFocus.dataset['attribute'];
			oldValue = this._focusEntity[attr].getValue();
			
			if (oldValue !== val) {
				this._focusEntity[attr].setValue(val);
				this._focusEntity.save({
					onSuccess: function() {
						tdItm.replaceChild(document.createTextNode(val), txtItm);
					},
					onError: function() {
						tdItm.replaceChild(document.createTextNode(oldValue), txtItm);
					}
				});
			} else {
				tdItm.replaceChild(document.createTextNode(val), txtItm);
			}
		},


		escapeFromText: function(ev) {
			if (ev && ev.keyCode && ev.keyCode === 13) {
				$(this._editCellText).trigger('blur');
			}
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
			var hOption = {};
			f = this._getFragment();
			tbody = document.createElement('tbody');
			tbody.className = 'waf-ui-body';
			tbody.addEventListener('click', this.selectLine.bind(this), false);
			tbody.addEventListener('dblclick', this.handleDblclick.bind(this), false);
			$(tbody)
			  .hammer(hOption)
			  .on("hold", this.handleDblclick.bind(this));
			f.appendChild(tbody);
		},


		renderElement: function(line, pos) {
			var value, ln, col, className, attr;
			className = '';
			col = this.cols();
			
			if (pos === this.indexSelected) {
				className = 'class="selected"';
			}

			ln = '<tr id="tr_' + pos + '" ' + className + ' >';

			for (var i = 0; i < col.length; i++) {
				value = line[col[i].attribute];
				attr = 'data-attribute="' + col[i].attribute + '"';
				ln += '<td ' + attr + '>' + value + '</td>';
			}

			ln += '</tr>';
			return ln;
		},



		buildFooter: function() {
			var tfoot, f = this._getFragment();
			tfoot = document.createElement('tfoot');
			tfoot.className = 'waf-ui-footer';
			f.appendChild(tfoot);

			if (!this.rows()) {
				return false;
			}
		},


		removeLoader: function() {
			var that = this;
			if (this._loader) {
				this.getBody().removeChild(this._loader);
				this._loader = null;
			}
			
			setTimeout(function() {
				var borderTop, borderBot, tabSize;
				
				borderTop = parseFloat(window.getComputedStyle(that.node).getPropertyValue('border-top-width').replace('px', ''));
				borderBot = parseFloat(window.getComputedStyle(that.node).getPropertyValue('border-bottom-width').replace('px', ''));
				tabSize = parseFloat(window.getComputedStyle(that.node.firstChild).getPropertyValue('height').replace('px', ''));
				
				that.node.style.height = (tabSize + borderTop + borderBot) + 'px';
				
			}, 0);
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
			var parent, elt;
			elt = e.target;
			
			if (elt.tagName === 'SPAN') {
				parent = elt.parentElement.parentElement;
			} else {
				parent = elt.parentElement;
			}
			
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
		},
		
		//============ behavior =============//
		
		_initDsEvent: function() {
			var sourceProperty = this.getNavigationSource();
			var source = sourceProperty();
			if (source) {
				this._dsCurrEltSubscriber = source.subscribe('currentElementChange', function(e) {
					var diff, navigationType, pos, start, pageSize, page, modulo;

					navigationType = this.navigationMode();
					pos = e.data.dataSource.getPosition();
					if (pos === -1) {
						return false;
					}
					
					start = this.start();
					pageSize = this.pageSize();

					if (navigationType === 'loadmore') {
						if (pos < start || pos > (start + pageSize - 1)) {
							if (start > pos && pos >= 0) {
								diff = start - pos;

								this._pageSizeSubscriber.pause();
								this.pageSize(pageSize + diff);
								this._pageSizeSubscriber.resume();

								this.start(pos);
							}

							if (pos > (start + pageSize - 1)) {
								diff = pos - (start + pageSize);
								this.pageSize(pageSize + diff + 1);
							}
						}
					} else if (navigationType === 'pagination') {
						modulo = pos % pageSize;
						page = Math.ceil(pos / pageSize);

						if (modulo !== 0 && page > 0) {
							--page;
						}
						
						this.start(page * pageSize);
					}
				}.bind(this));


				this._dsCollChgSubscriber = source.subscribe('collectionChange', function() {
					this.nbPage(Math.ceil(source.length / this.pageSize()));
					this.renderElements();
				}.bind(this));
				
				this.nbPage(Math.ceil(source.length / this.pageSize()));
			}
		},


		renderElements: function() {
			this.generateElements(this.start(), this.pageSize(), function(fragment) {
				this._getNavigationContainer().innerHTML = '';
				this._getNavigationContainer().insertAdjacentHTML('beforeend', fragment);
			}.bind(this));
		},


		generateElements: function(from, limit, fn) {
			var sourceProperty, frag, that, source;
			
			sourceProperty = this.getNavigationSource();
			source = sourceProperty();

			if (!source || source.length === 0) {
				return false;
			}

			that = this;
			frag = '';
			

			if (!this._rowsCount) {
				this._rowsCount = 0;
			}

			this.fire('beforeFetch', {from: from, limit: limit});

			source.getElements(from, limit, {
				onSuccess: function(result) {
					
					var element, elements, i, startPos;
					startPos = result.position;
					elements = result.elements;

					for (i = 0; i < elements.length; i++) {
						if (elements[i]) {
							element = that.renderElement(elements[i], (startPos + i));
							frag += element;
						}
					}

					if (that.navigationMode() === 'loadmore') {
						that._rowsCount += elements.length;
					} else {
						that._rowsCount = elements.length;
					}

					that.fire('afterFetch', {
						numRowsAdded: elements.length,
						totalRows: that._rowsCount,			
						dataSource: source
					});
					
					if (fn) {
						fn(frag);
					}
				},
				
				onError: function() {
					that.fire('fetchFailed');
				}
			});	
		},
		
		
		_getNavigationContainer: function() {
			var container = this.getNavigationContainer();
			if (container instanceof jQuery) {
				return container.get(0);
			} else {
				if (container && container.nodeType) {
					return container;
				} else {
					throw 'You have to return an html or jquery element';
				}
			}
		},


		nextPage: function() {
			if (this.currentPage() < this.nbPage()) {
				this.currentPage(this.currentPage() + 1);
			}
		},


		prevPage: function() {
			if (this.currentPage() > 1) {
				this.currentPage(this.currentPage() - 1);
			}
		},


		loadMore: function() {
			this.pageSize(this.pageSize() + this._defaultStep);
		}
	
	});
	
	//============= pagination ============//
	
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
			txt.className = 'paginationText';
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
	
	var TableSorter = widget.create('TableSorter', undefined, {
		init: function(option) {
			this.ref = option.ref;
			if (!this.ref) {
				return false;
			}

			this.activeField = {};
			this.source = this.ref.getNavigationSource();
			this.buildMaps();
			this.bindEvent();
		},


		buildMaps: function() {
			var i, cols = this.ref.cols();
			
			this.mapLabel = {};
			this.mapIndex = {};
			this.mapField = {};
			
			for(i = 0; i < cols.length; i++) {
				this.mapLabel[cols[i].label] = cols[i].attribute;
				this.mapIndex[i] = cols[i].attribute;
				this.mapField[cols[i].attribute] = cols[i].label;
			}
		},


		bindEvent: function() {
			var cols, i, th, head = this.ref.getHeader();
			
			cols = head.querySelectorAll('th');
			for (i = 0; i < cols.length; i++) {
				th = cols.item(i);
				
				th.addEventListener('click', (function(index){
					return this.sortByColumnIndex.bind(this, index);
				}.bind(this))(i), false);
			}
		},

	
		sortByColumnName: function(name, order) {
			var field = this.mapLabel[name];
			if (field) {
				this.sortByDsField(field, order);
			}
		},


		sortByColumnIndex: function(index, order) {
			var field = this.mapIndex[index];
			if (field) {
				this.sortByDsField(field, order);
			}
		},
		
		
		sortByDsField: function(field, order) {
			var source = this.source();
			
			if (this.activeField.name === field) {
				if (order === 'asc' || order === 'desc') {
					if (order === this.activeField.sort) {
						return false;
					}
					this.activeField.sort = order;
				} else {
					if (this.activeField.sort === 'asc') {
						this.activeField.sort = 'desc';
					} else {
						this.activeField.sort = 'asc';
					}
				}
			} else {
				this.activeField.name = field;
				this.activeField.sort = (order === 'asc' || order === 'desc')? order : 'desc';
			}
			
			source.orderBy(this.activeField.name + ' ' + this.activeField.sort);
		}
	});
	
	
	return TableView;
});