(function(){

	// custom binding provider with support of mustache '{{ }}' blocks
	var bindingProvider = function () {
		var self = this;
		this.constructor = bindingProvider;

		this.preprocessNode = function(node) {
			switch (node.nodeType) {
				// element
				case 1:
					return self.preprocessElementNode(node);
				// text node
				case 3:
					return self.preprocessTextNode(node);
			}
		};

		this.preprocessTextNode = function(node) {

			var nodes = [];
			var exprs = find_expressions(node.nodeValue);
			exprs.forEach(function(e) {
				var node = create_node(e);
				if (node) {
					nodes.push(node);
				} else {
					nodes.push(document.createComment("ko text: " + e.expr));
					nodes.push(document.createComment("/ko"));
				}
			});

			if (nodes) {
				for (var i = 0; i < nodes.length; i++) {
					node.parentNode.insertBefore(nodes[i], node);
				}
				node.parentNode.removeChild(node);
			}
		};

		this.preprocessElementNode = function( node ) {

			var bindings = node.attributes['data-bind'] || '';
			var attrBindings = process_attrs(node);

			if (bindings && attrBindings) {
				bindings += ', ';
			}

			bindings += attrBindings;

			if (bindings) {
				node.setAttribute('data-bind', bindings);
				console.log(node, bindings);
			}
		};
	};

	bindingProvider.prototype = ko.bindingProvider.instance;

	ko.bindingProvider.instance = new bindingProvider();

	// shims
	if (!String.prototype.trim) {
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g, "");
		};
	}

	var mustacheRegex = /{{([\s\S]*?)}}/g;

	// finds all mustache expressions
	function find_expressions(text) {
		if (!text) return [];

		var start = mustacheRegex.lastIndex = 0, str;
		var list = [];
		var match;

		while ((match = mustacheRegex.exec(text))) {
			str = text.substring(start, match.index);
			start = mustacheRegex.lastIndex;

			// preserve text between expressions
			if (str) {
				list.push(str);
			}

			list.push({expr: match[1]});
		}

		if (!list.length) {
			return [];
		}

		// preserve trailing text
		str = text.substring(start);
		if (str) {
			list.push(str);
		}

		return list;
	}

	function commentFn(keyword, prefix) {
		return function(expr){
			expr = expr.substr(prefix.length).trim();
			return document.createComment("ko " + keyword + ": ", expr);
		};
	}

	var expr_map = {
		'#': 'foreach',
		'^': 'ifnot',
		// handlebars helpers
		'#each': 'foreach',
		'#if': 'if',
		'#unless': 'ifnot',
		'#with': 'with'
	};

	Object.keys(expr_map).forEach(function(key){
		var keyword = expr_map[key];
		expr_map[key] = commentFn(keyword, key);
	});

	// end of block
	expr_map['/'] = function(){
		return document.createComment("/ko");
	};

	var helpers = ['#each', '#if', '#unless', '#with'];

	function create_node(expr) {
		if (typeof expr == 'string') {
			return document.createTextNode(expr);
		}

		expr = expr.expr;
		var prefix;

		for (var i = 0; i < helpers.length; i++) {
			prefix = helpers[i];
			if (expr.indexOf(prefix) === 0) {
				return expr_map[prefix](expr);
			}
		}

		prefix = expr.charAt(0);
		var fn = expr_map[prefix];
		return fn ? fn(expr) : null;
	}

	var bindingMap = {
		'value': 'value',
		'disabled': 'disable',
		'checked': 'checked'
	};

	function attr_fn(list) {
		var expr = list.map(function(e){
			if (typeof e == 'string') {
				return "'" + e + "'";
			}
			return "(" + e.expr + ")";
		}).join(' + ');
		return '(function(){ return ' + expr + '; })()';
	}

	function process_attrs(node){

		var attrs = node.attributes,
			toRemove = [],
			attrBindings = '',
			bindings = '',
			i;

		for (i = 0; i < attrs.length; i++) {
			var attr = attrs[i];
			var exprs = find_expressions(attr.value);
			if (exprs.length) {
				var name = bindingMap[attr.name] || 'attr';
				var expr = attr_fn(exprs);
				toRemove.push(attr);

				if (name == 'attr') {
					if (!attrBindings) {
						attrBindings = "attr: {";
					}
					attrBindings += ", '" + name + "': " + expr;
				} else {
					if (bindings) {
						bindings += ", ";
					}
					bindings += name + ': ' + expr;
				}
			}
		}

		for (i = 0; i < toRemove.length; i++) {
			node.removeAttribute(toRemove[i]);
		}

		if (bindings && attrBindings) {
			bindings += ', ';
		}

		return bindings + attrBindings;
	}

})();
