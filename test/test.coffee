describe 'muskout', ->

	init = ->
		ko.cleanNode(document.body)
		div = $('#sandbox')
		$('<div id="sandbox"></div>').appendTo($('body')) unless div.length
		div.html('')

	template = (s) ->
		init()
		$(s).appendTo($('#sandbox'))

	it 'should replace text nodes', ->
		template '<div class="test">before {{value}} after</div>'

		vm = {value: 'test'}
		ko.applyBindings(vm)

		$('.test').text().should.eql('before test after')

	it 'should replace attribute', ->
		template '<input class="test {{cls}}" value="test {{value}}"/>'

		vm = {value: 'text', cls: 'error'}
		ko.applyBindings(vm)

		val = $('.test').val()
		val.should.eql('test text')
		$('.test').hasClass('error').should.be.ok

	it 'should process {{#each expr}}', ->
		template """
<div class="test">
{{#each items}}
<span class="item">{{name}}</span>
{{/items}}
</div>
"""
		vm =
			items: [
				{name: 'A'}
				{name: 'B'}
				{name: 'C'}
			]
		ko.applyBindings(vm)

		$('.item').length.should.eql(3)
		$('.item:nth-child(1)').text().should.eql('A')
		$('.item:nth-child(2)').text().should.eql('B')
		$('.item:nth-child(3)').text().should.eql('C')

	it 'should process {{#if expr}}', ->
		html = """
<div class="test">
{{#unless valid}}
<span>invalid</span>
{{/unless}}
{{#if valid}}
<span>valid</span>
{{/if}}
</div>
"""
		run = (valid) ->

			template html
			vm = {valid: valid}
			ko.applyBindings(vm)
			expected = if valid then "valid" else "invalid"
			$('.test').text().trim().should.eql(expected)

		run false
		run true
