describe 'muskout', ->

	it 'should replace text nodes', ->
		template = '<div class="test">{{value}}</div>'
		$(template).appendTo($('body'))
		vm = {value: 'test'}
		ko.applyBindings(vm)
		$('.test').text().should.eql('test')
