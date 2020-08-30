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

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) return reject(new Error("Mandatory parameters missing. url: '" + url + "', cssSelector: '" + cssSelector + "'"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "setRule transaction error/abort", error.name, error.message);
				return reject(error);
			});

			this._getExistingRule(url, cssSelector, tran).then((existingRule) => {

				const obj = Object.assign(this._getDefaultRuleObject(url, cssSelector), existingRule);

				if(this._isDate(details.created)) obj.created = details.created;
				if(this._isBoolean(details.hide)) obj.hide = details.hide;
				if(this._isBoolean(details.remove)) obj.remove = details.remove;
				if(this._isBoolean(details.dewidthify)) obj.dewidthify = details.dewidthify;
				if(this._isBoolean(details.isolate)) obj.isolate = details.isolate;
				if(LizardDB._isColorObjectValue(details.color)) obj.color = details.color;

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
	updateRuleStats(url, cssSelector) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) return reject(new Error("Mandatory parameters missing. url: '" + url + "', cssSelector: '" + cssSelector + "'"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "updateRuleStats transaction error/abort", error.name, error.message);
				return reject(error);
			});

			this._getExistingRule(url, cssSelector, tran).then((existingRule) => {

				const obj = Object.assign(this._getDefaultRuleObject(url, cssSelector), existingRule);

				obj.lastUsed = Date.now();
				obj.hitCount += 1;

				const reqPut = tran.objectStore("rules").put(obj);

				reqPut.onsuccess = () => resolve(reqPut.result);
				reqPut.onerror = (event) => {
					const error = event.target.error;
					console.log("[Lizard]", "updateRuleStats put error",error.name, error.message);
					reject(error);
				};
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	unsetRuleDetail(url, cssSelector, unsetDetailName) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			let validDetailNames = ["hide", "remove", "dewidthify", "isolate", "color"];

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			unsetDetailName = unsetDetailName.trim();
			if(!!!url || !!!cssSelector || !validDetailNames.includes(unsetDetailName) ) {
				return reject(new Error("Mandatory arguments missing. Arguments: " + Object.values(arguments).join(", ")));
			}

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "unsetRuleDetail transaction error/abort", error.name, error.message);
				return reject(error);
			});

			this._getExistingRule(url, cssSelector, tran).then((existingRule) => {

				// if rule doesn't exist do noting
				if(Object.keys(existingRule).length === 0) return resolve();

				existingRule[unsetDetailName] = (unsetDetailName === "color" ? null : false);

				let req;

				if(LizardDB.ruleHasValue(existingRule)) {
					req = tran.objectStore("rules").put(existingRule);
				} else {
					req = tran.objectStore("rules").delete([ url, cssSelector ]);
				}

				req.onsuccess = () => resolve(req.result);	// record key for put(), undefined for delete()
				req.onerror = (event) => {
					const error = event.target.error;
					console.log("[Lizard]", "unsetRuleDetail put/delete error",error.name, error.message);
					reject(error);
				};
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteRule(url, cssSelector) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) return reject(new Error("Mandatory parameters missing. url: '" + url + "', cssSelector: '" + cssSelector + "'"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "deleteRule transaction error/abort", error.name, error.message);
				return reject(error);
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

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) return reject(new Error("Mandatory parameters missing. url: '" + url + "'"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "deleteRulesByUrl transaction error/abort", error.name, error.message);
				return reject(error);
			});

			const reqCursor = tran.objectStore("rules").index("idx_url").openCursor([ url ]);

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
	deleteAllRules() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			let tran = this._getRulesTransaction("readwrite", (error) => {
				console.log("[Lizard]", "deleteAllRules transaction error/abort", error.name, error.message);
				return reject(error);
			});

			const reqClear = tran.objectStore("rules").clear();

			reqClear.onsuccess = () => resolve();
			reqClear.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "deleteAllRules delete error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	getRules(url) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) return reject(new Error("Mandatory parameters missing. url: '" + url + "'"));

			let tran = this._getRulesTransaction("readonly", (error) => {
				console.log("[Lizard]", "getRules transaction error/abort", error.name, error.message);
				return reject(error);
			});

			const reqGet = tran.objectStore("rules").index("idx_url").getAll([ url ], 4096);

			reqGet.onsuccess = () => resolve(reqGet.result.sort((a, b) => a.created > b.created ));
			reqGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "getRules getAll error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	getAllDistinctUrls() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			let tran = this._getRulesTransaction("readonly", (error) => {
				console.log("[Lizard]", "getAllDistinctUrls transaction error/abort", error.name, error.message);
				return reject(error);
			});

			const reqGet = tran.objectStore("rules").getAll();

			reqGet.onsuccess = () => {
				let result = reqGet.result.map(r => r.url);		// create string array out of the urls
				result = [...new Set(result)];					// filter out duplicates
				resolve(result.sort((a, b) => a.url > b.url ));	// sort and resolve
			};

			reqGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "getAllDistinctUrls getAll error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	static isColorObjectValid(obj) {
		return LizardDB._isColorObjectValue(obj);
	}

	//////////////////////////////////////////////////////////////////////
	static ruleHasValue(obj) {
		return LizardDB._ruleHasValue(obj);
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

		if(!!!db || db.name !== this.m_databaseName) throw new Error("Database not open");

		db.onerror = (event) => console.log("[Lizard]", "upgradeNeeded error", event.target.error.name, event.target.error.message);

		let objStore = db.createObjectStore("rules", { keyPath: [ "url", "cssSelector" ] });
		objStore.createIndex("idx_url", [ "url" ], { unique: false });
		objStore.createIndex("idx_created", [ "created" ], { unique: false });
		objStore.createIndex("idx_lastUsed", [ "lastUsed" ], { unique: false });
		objStore.createIndex("idx_hitCount", [ "hitCount" ], { unique: false });

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
	_isDate(variable) {
		return (typeof(variable) === "number") && (variable > Date.parse("2020-01-01T00:00:00"));
	}

	//////////////////////////////////////////////////////////////////////
	_isBoolean(variable) {
		return (typeof(variable) === "boolean");
	}

	//////////////////////////////////////////////////////////////////////
	static _isColorObjectValue(obj) {
		return (obj === null) ||
				( typeof(obj) === "object" &&
					Object.keys(obj).length === 5 &&
					obj.hasOwnProperty("foreground") && !!(obj.foreground.match(/^#[0-9a-f]{6}$/i)) &&
					obj.hasOwnProperty("background") && !!(obj.background.match(/^#[0-9a-f]{6}$/i)) &&
					obj.hasOwnProperty("colorizeChildren") && (typeof(obj.colorizeChildren) === "boolean") &&
					obj.hasOwnProperty("saturateAmount") && ( obj.saturateAmount === null || !!(obj.saturateAmount.match(/^(100)?0%$/)) ) &&
					obj.hasOwnProperty("invertAmount") && !!(obj.invertAmount.match(/^(10)?0%$/)) );
	}

	//////////////////////////////////////////////////////////////////////
	static _ruleHasValue(obj) {
		return	obj.hide ||
				obj.remove ||
				obj.dewidthify ||
				obj.isolate ||
				obj.color !== null;
	}

	//////////////////////////////////////////////////////////////////////
	_normalizeUrl(url) {
		// A rule's URL is normalized: without query string or hash and without trailing slashes.
		return decodeURIComponent(url.split(/(\?|#).*/)[0].trim().replace(/^(.*)\/+$/, "$1"));
	}
};
