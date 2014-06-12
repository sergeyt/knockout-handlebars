/*
 * knockout-handlebars.js v0.0.4 - handlebars and more syntax sugar for knockout.js
 * https://github.com/sergeyt/knockout-handlebars
 * Licensed under MIT (https://github.com/sergeyt/knockout-handlebars/blob/master/LICENSE)
 */

(function(){

	// shims
	if (!String.prototype.trim) {
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g, "");
		};
	}
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(prefix){
			return this.indexOf(prefix) === 0;
		};
	}

	// https://github.com/mbest/knockout.punches
	// Performance comparison at http://jsperf.com/markup-interpolation-comparison
	function parseInterpolationMarkup(textToParse, outerTextCallback, expressionCallback) {
		function innerParse(text) {
			var innerMatch = text.match(/^([\s\S]*?)}}([\s\S]*)\{\{([\s\S]*)$/);
			if (innerMatch) {
				expressionCallback(innerMatch[1]);
				outerParse(innerMatch[2]);
				expressionCallback(innerMatch[3]);
			} else {
				expressionCallback(text);
			}
		}
		function outerParse(text) {
			var outerMatch = text.match(/^([\s\S]*?)\{\{([\s\S]*)}}([\s\S]*)$/);
			if (outerMatch) {
				outerTextCallback(outerMatch[1]);
				innerParse(outerMatch[2]);
				outerTextCallback(outerMatch[3]);
			} else {
				outerTextCallback(text);
			}
		}
		outerParse(textToParse);
	}

	function interpolateMarkup(node) {

		// only needs to work with text nodes
		if (!(node.nodeType === 3 && node.nodeValue && node.nodeValue.indexOf('{{') !== -1)) {
			return;
		}

		var nodes = [];
		function addTextNode(text) {
			if (text)
				nodes.push(document.createTextNode(text));
		}
		function wrapExpr(expressionText) {
			if (expressionText)
				nodes.push(create_expression_node(expressionText));
		}

		parseInterpolationMarkup(node.nodeValue, addTextNode, wrapExpr);

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

	function create_expression_node(expr) {
		
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
		'disable': 'disable',
		'enabled': 'enable',
		'enable': 'enable',
		'checked': 'checked'
	};

	function get_attr_bindings(node) {

		var attrBinding = [];
		var bindings = [];

		function process_attr(attribute) {

			var parts = [];
			function addText(text) {
				if (text)
					parts.push('"' + text.replace(/"/g, '\\"') + '"');
			}
			function addExpr(expressionText) {
				if (expressionText) {
					parts.push(expressionText);
				}
			}

			parseInterpolationMarkup(attribute.value, addText, addExpr);

			if (!parts.length) {
				return false;
			}

			var binding = parts.join('+');

			var name = bindingMap[attribute.name] || 'attr';
			if (name == 'attr') {
				attrBinding.push(attribute.name + ':' + binding);
			} else {
				bindings.push(name + ':' + binding);
			}

			return true;
		}

		for (var i = node.attributes.length - 1; i >= 0; i--) {
			var attr = node.attributes[i];
			if (attr.name == 'data-bind') continue;
			if (attr.name.startsWith('ko-')) {
				var name = attr.name.substr(3);
				bindings.push(name + ':' + attr.value);
			} else if (attr.value.indexOf('{{') >= 0) {
				if (process_attr(attr)) {
					node.removeAttribute(attr.name);
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
				return interpolateMarkup(node);
		}
	};

	function attrs_has_bindings(node) {
		if (node.nodeType == 1 && node.attributes) {
			for (var i = 0; i < node.attributes.length; i++) {
				var attr = node.attributes[i];
				if (attr.name == 'data-bind' ||
					attr.name.startsWith('ko-') ||
					attr.value.indexOf('{{') >= 0) {
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
