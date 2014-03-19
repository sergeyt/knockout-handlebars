(function(){

	// shims
	if (!String.prototype.trim) {
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g, "");
		};
	}

	function process_text(node) {
		if (node.nodeType === 3 && node.nodeValue && node.nodeValue.indexOf('{{') !== -1) {
			var nodes = find_expressions(node.nodeValue).map(create_node);
			if (nodes.length) {
				if (node.parentNode) {
					for (var i = 0; i < nodes.length; i++) {
						node.parentNode.insertBefore(nodes[i], node);
					}
					node.parentNode.removeChild(node);
				}
				return nodes;
			}
		}
	}

	function process_attrs(node) {
		if (node.nodeType === 1 && node.attributes && node.attributes.length) {

			var attr = node.attributes['data-bind'];
			var dataBind = attr ? attr.value : '';
			var attrBindings = get_attr_bindings(node).join(', ');

			if (dataBind && attrBindings) {
				dataBind += ', ';
			}
			dataBind += attrBindings;

			if (dataBind) {
				node.setAttribute('data-bind', dataBind);
			}
		}
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
			return document.createComment(" ko " + keyword + ": " + expr + " ");
		};
	}

	// handlebars helpers
	var expr_map = {
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

	function create_node(expr) {
		if (typeof expr == 'string') {
			return document.createTextNode(expr);
		}

		expr = expr.expr;
		var prefix, fn;
		var i = expr.indexOf(' ');
		if (i >= 0) {
			prefix = expr.substr(0, i);
			fn = expr_map[prefix];
			if (fn) {
				return fn(expr);
			}
		}

		prefix = expr.charAt(0);
		fn = expr_map[prefix];
		if (fn) {
			return fn(expr);
		}

		var span = document.createElement('span');
		span.setAttribute('data-bind', 'text: ' + expr);
		return span;
	}

	var bindingMap = {
		'value': 'value',
		'disabled': 'disable',
		'checked': 'checked'
	};

	function create_attr_binding(e) {
		if (typeof e == 'string') {
			return '"' + e.replace(/"/g, '\\"') + '"';
		}
		return 'ko.unwrap(' + e.expr + ')';
	}

	function get_attr_bindings(node) {

		var attrBinding = [];
		var bindings = [];

		for (var i = node.attributes.length - 1; i >= 0; i--) {
			var attr = node.attributes[i];
			if (attr.specified && attr.name != 'data-bind' && attr.value.indexOf('{{') !== -1) {
				var parts = find_expressions(attr.value).map(create_attr_binding);
				var binding = '""+' + parts.join('+');

				var name = bindingMap[attr.name] || 'attr';
				if (name == 'attr') {
					attrBinding.push(attr.name + ':' + binding);
				} else {
					bindings.push(name + ':' + binding);
				}
			}
		}

		if (attrBinding.length) {
			bindings.push('attr:{' + attrBinding.join(', ') + '}');
		}

		return bindings;
	}

	// infect knockout
	var provider = ko.bindingProvider.instance;

	provider.preprocessNode = function process_node(node) {
		switch (node.nodeType) {
			case 1:
				return process_attrs(node);
			case 3:
				return process_text(node);
		}
	};

	function attrs_has_bindings(node) {
		if (node.nodeType == 1 && node.attributes) {
			for (var i = 0; i < node.attributes.length; i++) {
				var attr = node.attributes[i];
				if (attr.specified && attr.value.indexOf('{{') !== -1) {
					return true;
				}
			}
		}
		return false;
	}

	var ko_nodeHasBindings = provider.nodeHasBindings;
	provider.nodeHasBindings = function(node) {
		return ko_nodeHasBindings.call(provider, node) || attrs_has_bindings(node);
	};

})();
