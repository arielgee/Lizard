"use strict";

class LizardDB {
	constructor() {
		this.m_databaseName = "lizardDB";
		this.m_dbRequest = null;
		this.m_db = null;
	}

	//////////////////////////////////////////////////////////////////////
	open() {

		return new Promise((resolve, reject) => {

			this._onDBRequestUpgradeNeeded = this._onDBRequestUpgradeNeeded.bind(this);

			this.m_dbRequest = window.indexedDB.open(this.m_databaseName, 1);

			this.m_dbRequest.addEventListener("upgradeneeded", this._onDBRequestUpgradeNeeded);

			this.m_dbRequest.onsuccess = () => {
				this.m_db = this.m_dbRequest.result;
				resolve();
			};

			this.m_dbRequest.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "open error", error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	close() {
		if(this.isOpen) {
			this.m_db.close();
		}
	}

	//////////////////////////////////////////////////////////////////////
	get isOpen() {
		return (!!this.m_db && this.m_db.name === this.m_databaseName)
	}

	//////////////////////////////////////////////////////////////////////
	setRule(url, cssSelector, details = {}) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) reject(new Error("Mandatory parameters missing. url: `" + url + "`, cssSelector: `" + cssSelector + "`"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "setRule transaction error/abort", error.name, error.message);
				reject(error);
			});

			this._getExistingRule(url, cssSelector, tran).then((existingRule) => {

				const obj = Object.assign(this._getDefaultRuleObject(url, cssSelector), existingRule);

				if(this._isBoolean(details.hide)) obj.hide = details.hide;
				if(this._isBoolean(details.remove)) obj.remove = details.remove;
				if(this._isBoolean(details.dewidthify)) obj.dewidthify = details.dewidthify;
				if(this._isBoolean(details.isolate)) obj.isolate = details.isolate;
				if(this._isColorObjectValue(details.color)) obj.color = details.color;

				const reqPut = tran.objectStore("rules").put(obj);

				reqPut.onsuccess = () => resolve(reqPut.result);
				reqPut.onerror = (event) => {
					const error = event.target.error;
					console.log("[Lizard]", "setRule put error",error.name, error.message);
					reject(error);
				};
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteRule(url, cssSelector) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) reject(new Error("Mandatory parameters missing. url: `" + url + "`, cssSelector: `" + cssSelector + "`"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "deleteRule transaction error/abort", error.name, error.message);
				reject(error);
			});

			const reqDelete = tran.objectStore("rules").delete([ url, cssSelector ]);

			reqDelete.onsuccess = () => resolve();
			reqDelete.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "deleteRule delete error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteRulesByUrl(url) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) reject(new Error("Mandatory parameters missing. url: `" + url + "`"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "deleteRulesByUrl transaction error/abort", error.name, error.message);
				reject(error);
			});

			const reqCursor = tran.objectStore("rules").index("idx.url").openCursor([ url ]);

			reqCursor.onsuccess = () => {
				let cursor = reqCursor.result;
				if(cursor) {
					cursor.delete();
					cursor.continue();
				} else {
					resolve();
				}
			};

			reqCursor.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "deleteRulesByUrl delete error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	clearAllRules() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "clearAllRules transaction error/abort", error.name, error.message);
				reject(error);
			});

			const reqClear = tran.objectStore("rules").clear();

			reqClear.onsuccess = () => resolve();
			reqClear.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "clearAllRules delete error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	getRules(url) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) reject(new Error("Mandatory parameters missing. url: `" + url + "`"));

			let tran = this._getRulesTransaction("readonly", (error) => {
				console.log("[Lizard]", "getRules transaction error/abort", error.name, error.message);
				reject(error);
			});

			const reqGet = tran.objectStore("rules").index("idx.url").getAll([ url ], 4096);

			reqGet.onsuccess = () => resolve(reqGet.result.sort((a, b) => a.created > b.created ));
			reqGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "getRules getAll error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	logRules(url) {
		this.getRules(url).then((rules) => {
			console.log(`%cRules for: '${url}'`, "color:#45ffff;font-size:150%");
			for(let i=0, len=rules.length; i<len; i++) {
				console.log(rules[i]);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_onDBRequestUpgradeNeeded(event) {

		let db = this.m_dbRequest.result;

		if(!!!db || db.name !== this.m_databaseName) throw new Error("Database not open")

		db.onerror = (event) => console.log("[Lizard]", "upgradeNeeded error", event.target.error.name, event.target.error.message);

		let objStore = db.createObjectStore("rules", { keyPath: [ "url", "cssSelector" ] });
		objStore.createIndex("idx.url", [ "url" ], { unique: false });
		objStore.createIndex("idx.created", [ "created" ], { unique: false });
		objStore.createIndex("idx.lastUsed", [ "lastUsed" ], { unique: false });
		objStore.createIndex("idx.hitCount", [ "hitCount" ], { unique: false });

		//objStore.transaction.oncomplete = (event) => {};
	}

	//////////////////////////////////////////////////////////////////////
	_getRulesTransaction(mode = "", failCallback) {
		let tran = this.m_db.transaction(["rules"], mode);
		tran.onerror = tran.onabort = (event) => { failCallback(event.target.error); };
		return tran;
	}

	//////////////////////////////////////////////////////////////////////
	_getExistingRule(url, cssSelector, transaction) {

		return new Promise((resolve, reject) => {

			const requestGet = transaction.objectStore("rules").get([ url, cssSelector ]);

			requestGet.onsuccess = () => resolve(!!requestGet.result ? requestGet.result : {});
			requestGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getExistingRule get error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getDefaultRuleObject(url, cssSelector) {
		return {
			url: url,
			created: Date.now(),
			lastUsed: 0,
			hitCount: 0,
			cssSelector: cssSelector,
			hide: false,
			remove: false,
			dewidthify: false,
			isolate: false,
			color: null,
		};
	}

	//////////////////////////////////////////////////////////////////////
	_isBoolean(variable) {
		return (typeof(variable) === "boolean");
	}

	//////////////////////////////////////////////////////////////////////
	_isColorObjectValue(variable) {
		return (variable === null) ||
				( typeof(variable) === "object" &&
					Object.keys(variable).length === 5 &&
					variable.hasOwnProperty("foreground") && !!(variable.foreground.match(/#[0-9a-f]{6}/i)) &&
					variable.hasOwnProperty("background") && !!(variable.background.match(/#[0-9a-f]{6}/i)) &&
					variable.hasOwnProperty("colorizeChildren") && (typeof(variable.colorizeChildren) === "boolean") &&
					variable.hasOwnProperty("saturateAmount") && ( variable.saturateAmount === null || !!(variable.saturateAmount.match(/(100)?0%/)) ) &&
					variable.hasOwnProperty("invertAmount") && !!(variable.invertAmount.match(/(10)?0%/)) );
	}

	//////////////////////////////////////////////////////////////////////
	_normalizeUrl(url) {
		// A rule's URL is normalized: without query string or hash and without trailing slashes.
		return url.split(/(\?|#).*/)[0].trim().replace(/^(.*)\/+$/, "$1");
	}
};
