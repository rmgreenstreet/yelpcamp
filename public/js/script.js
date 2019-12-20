console.log('javascript loaded');

$('document').ready(function() {
	$('#accountSubmit').prop('disabled', true);
	$('#newPassword').on('input',function() {
		$('#noMatch').show();
	});

	$('#confirmNewPassword').on('input',function() {
		if($('#newPassword').val() === $('#confirmNewPassword').val()) {
			$('#noMatch').hide();
			$('#match').show();
			$('#accountSubmit').prop('disabled', false);
		}
		else {
			$('#noMatch').show();
			$('#match').hide();
			$('#accountSubmit').prop('disabled', true);
		}
	});
});

