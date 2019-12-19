console.log('javascript loaded');

$('document').ready(function() {
	
	$('#newPassword').on('input',function() {
		$('#noMatch').show();
	});

	$('#confirmNewPassword').on('input',function() {
		if($('#newPassword').val() === $('#confirmNewPassword').val()) {
			$('#noMatch').hide();
			$('#match').show();
		}
		else {
			$('#noMatch').show();
			$('#match').hide();
		}
	});
});

