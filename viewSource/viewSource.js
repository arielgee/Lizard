// JavaScript source code


document.addEventListener("DOMContentLoaded", () => {
	prefs.getSavedViewSourceData().then((data) => {
		document.getElementById("lizardSourceBoxPre").textContent = data;
	});
});

document.addEventListener("keydown", (event) => {
	if (event.key.toLowerCase() === "escape") {
		window.close();
	}
}, false);

