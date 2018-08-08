<<<<<<< HEAD
"use strict";

function checkform()
{
    var x = document.forms["myForm"]["fname"].value;
    var cansubmit = true;
	if (x == "") {
	 document.getElementById("submitbutton").disabled = cansubmit;
    }
	else {
    document.getElementById("submitbutton").disabled = !cansubmit;
	}
};

function onSkelClick() 
{	
	var info = "Sterowanie: strzalki , atak: spacja, cel: zbierz wszystkie monety";	
	confirm(info);
=======
"use strict";

function checkform()
{
    var x = document.forms["myForm"]["fname"].value;
    var cansubmit = true;
	if (x == "") {
	 document.getElementById("submitbutton").disabled = cansubmit;
    }
	else {
    document.getElementById("submitbutton").disabled = !cansubmit;
	}
};

function onSkelClick() 
{	
	var info = "Sterowanie: strzalki , atak: spacja, cel: zbierz wszystkie monety";	
	confirm(info);
>>>>>>> 02c4701ec7ac8cb87b2e41dd7ce88aca6c826bd6
};