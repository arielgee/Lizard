// JavaScript source code

document.addEventListener("DOMContentLoaded", () => {

	prefs.getSavedViewSourceData().then((result) => {
		document.getElementById("lizardSourceBoxPre").textContent = result.data;
		document.title = "View " + result.type.toUpperCase() + " Source - Lizard";
	});

});

document.addEventListener("keydown", (event) => {
	if (event.key.toLowerCase() === "escape") {
		window.close();
	}
}, false);

