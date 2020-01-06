console.log("javascript loaded");

$("document").ready(function() {
	$("#accountSubmit").prop("disabled", true);
	$("#accountSubmit").attr("disabled", true);
	$("#newPassword").on("input",function() {
		$("#noMatch").show();
	});

	$("#confirmNewPassword").on("input",function() {
		if($("#newPassword").val() === $("#confirmNewPassword").val()) {
			$("#noMatch").hide();
			$("#match").show();
			$("#accountSubmit").prop("disabled", false);
			$("#accountSubmit").attr("disabled", false);
		}
		else {
			$("#noMatch").show();
			$("#match").hide();
			$("#accountSubmit").prop("disabled", true);
			$("#accountSubmit").attr("disabled", true);
		}
	});
	$('#adminCheck').on('click', function() {
		if(this.checked){
            $('#adminCode').show();
		}
		else {
			$('#adminCode').hide();
		}
	});
});

