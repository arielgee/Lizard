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
		if(!this.isOpen) reject(new Error("Database not open"));
		this.m_db.close();
	}

	//////////////////////////////////////////////////////////////////////
	get isOpen() {
		return (!!this.m_db && this.m_db.name === this.m_databaseName)
	}

	//////////////////////////////////////////////////////////////////////
	setRule(url, cssSelector, details = {}) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = url.trim().replace(/^(.*)\/+$/, "$1");
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) reject(new Error("Mandatory parameters missing"));

			let tran = this.m_db.transaction(["rules"], "readwrite");
			tran.onerror = tran.onabort = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "setRule transaction error/abort",error.name, error.message);
				reject(error);
			};

			this._getExistingRule(url, cssSelector, tran).then((existingRule) => {

				const obj = Object.assign(this._getDefaultRuleObject(url, cssSelector), existingRule);

				if(this._isBoolean(details.hide)) obj.hide = details.hide;
				if(this._isBoolean(details.remove)) obj.remove = details.remove;
				if(this._isBoolean(details.dewidthify)) obj.dewidthify = details.dewidthify;
				if(this._isBoolean(details.isolate)) obj.isolate = details.isolate;
				if(this._isColorsObjectValue(details.color)) obj.color = details.color;
				if(this._isColorsObjectValue(details.decolor)) obj.decolor = details.decolor;

				const requestPut = tran.objectStore("rules").put(obj);

				requestPut.onsuccess = () => resolve(requestPut.result);
				requestPut.onerror = (event) => {
					const error = event.target.error;
					console.log("[Lizard]", "setRule put error",error.name, error.message);
					reject(error);
				};
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	getRules(url) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) reject(new Error("Database not open"));

			url = url.trim().replace(/^(.*)\/+$/, "$1");
			if(!!!url) reject(new Error("Mandatory parameters missing"));

			let tran = this.m_db.transaction(["rules"], "readwrite");
			tran.onerror = tran.onabort = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "setRule transaction error/abort",error.name, error.message);
				reject(error);
			};

			const requestGet = tran.objectStore("rules").index("idx.url").getAll([ url ], 1024);

			requestGet.onsuccess = () => resolve(requestGet.result);
			requestGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "getRules getAll error",error.name, error.message);
				reject(error);
			};
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
			decolor: null,
		};
	}

	//////////////////////////////////////////////////////////////////////
	_isBoolean(variable) {
		return (typeof(variable) === "boolean");
	}

	//////////////////////////////////////////////////////////////////////
	_isColorsObjectValue(variable) {
		return (variable === null) ||
				( typeof(variable) === "object" &&
					Object.keys(variable).length === 2 &&
					!!variable.frgd && !!(variable.frgd.match(/#[0-9a-f]{6}/i)) &&
					!!variable.bkgd && !!(variable.bkgd.match(/#[0-9a-f]{6}/i)) );
	}
};
