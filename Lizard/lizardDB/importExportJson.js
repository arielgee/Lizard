"use strict";

/****************************************************************************************************************/
/****************************************************************************************************************/
let importJsonFile = (function() {

	let m_xhr;
	let m_objUrl = null;
	let m_funcResolve;
	let m_funcReject;

	////////////////////////////////////////////////////////////////////////////////////
	function run(file) {

		return new Promise((resolve, reject) => {

			m_funcResolve = resolve;
			m_funcReject = reject;

			m_objUrl = URL.createObjectURL(file);

			m_xhr = new XMLHttpRequest();
			m_xhr.open("GET", m_objUrl);
			m_xhr.responseType = 'json';
			m_xhr.addEventListener("load", onLoad);
			m_xhr.addEventListener("error", onError);
			m_xhr.addEventListener("loadend", onLoadEnd);
			m_xhr.send();
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onLoad() {
		if(m_xhr.responseType === "json") {
			m_funcResolve(m_xhr.response);
		} else {
			m_funcReject("Import response type is not 'json'.");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onError(event) {
		console.log("[lizard]", event);
		m_funcReject(event);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onLoadEnd() {
		m_xhr.removeEventListener("load", onLoad);
		m_xhr.removeEventListener("error", onError);
		m_xhr.removeEventListener("error", onLoadEnd);

		if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
		m_objUrl = null;
		m_xhr = null;
	}

	return {
		run: run,
	};
})();


/****************************************************************************************************************/
/****************************************************************************************************************/
let exportJsonFile = (function() {

	let m_objUrl = null;
	let m_funcResolve;
	let m_fileName;
	let m_fileExtension;

	////////////////////////////////////////////////////////////////////////////////////
	function run(obj, fileExtension = "json") {

		return new Promise((resolve, reject) => {

			if( !(obj instanceof Object) && !(obj instanceof Array) ) {
				reject("Parameter is neither an Object nor an Array");
				return;
			}

			m_funcResolve = resolve;
			m_fileExtension = fileExtension;
			createDefaultExportFileName();

			let blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json", endings: "native" });

			m_objUrl = URL.createObjectURL(blob);
			browser.downloads.onCreated.addListener(onCreatedDownload);
			browser.downloads.onChanged.addListener(onChangedDownload);
			browser.downloads.download({
				url: m_objUrl,
				filename: m_fileName,
				saveAs: true,
			}).catch((error) => {

				if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
				m_objUrl = null;

				if(error.message === "Download canceled by the user") {
					m_funcResolve({ fileName: "" });
				} else {
					reject(error);
				}
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createDefaultExportFileName() {

		let dateExport = new Date();
		let dateExportStr = dateExport.getFullYear() +
			(dateExport.getMonth()+1).toLocaleString('en', {minimumIntegerDigits:2}) +
			dateExport.getDate().toLocaleString('en', {minimumIntegerDigits:2}) + "-" +
			dateExport.getHours().toLocaleString('en', {minimumIntegerDigits:2}) +
			dateExport.getMinutes().toLocaleString('en', {minimumIntegerDigits:2}) +
			dateExport.getSeconds().toLocaleString('en', {minimumIntegerDigits:2});

		m_fileName = "export-" + dateExportStr + "." + m_fileExtension;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onCreatedDownload(downloadItem) {
		m_fileName = downloadItem.filename;
		browser.downloads.onCreated.removeListener(onCreatedDownload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangedDownload(delta) {
		if (delta.state && delta.state.current === "complete") {

			if(!!m_objUrl) URL.revokeObjectURL(m_objUrl);
			m_objUrl = null;

			browser.downloads.onChanged.removeListener(onChangedDownload);
			m_funcResolve({ fileName: m_fileName });
		}
	}

	return {
		run: run,
	}
})();
