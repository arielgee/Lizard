"use strict";

class LizardDB_V1 {
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
			let affectedCount = 0;

			reqCursor.onsuccess = () => {
				let cursor = reqCursor.result;
				if(cursor) {
					cursor.delete();
					affectedCount += 1;
					cursor.continue();
				} else {
					resolve({ affectedCount: affectedCount });
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
	getAllRules() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			let tran = this._getRulesTransaction("readonly", (error) => {
				console.log("[Lizard]", "getAllRules transaction error/abort", error.name, error.message);
				return reject(error);
			});

			const reqGet = tran.objectStore("rules").getAll();

			reqGet.onsuccess = () => resolve(reqGet.result);
			reqGet.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "getAllRules getAll error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	static isRuleObjectValid(obj) {
		return LizardDB._isRuleObjectValue(obj);
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
	static _isRuleObjectValue(obj) {
		return	Object.keys(obj).length === 5 &&
				obj.hasOwnProperty("hide") && (typeof(obj.hide) === "boolean") &&
				obj.hasOwnProperty("remove") && (typeof(obj.remove) === "boolean") &&
				obj.hasOwnProperty("dewidthify") && (typeof(obj.dewidthify) === "boolean") &&
				obj.hasOwnProperty("isolate") && (typeof(obj.isolate) === "boolean") &&
				obj.hasOwnProperty("color") && LizardDB._isColorObjectValue(obj.color);
	}

	//////////////////////////////////////////////////////////////////////
	static _isColorObjectValue(obj) {
		return	(obj === null) ||
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
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
/*#######################################################################################################*/
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
			if(!!!url || !!!cssSelector) return reject(new Error(`Mandatory parameters missing. url: '${url}', cssSelector: '${cssSelector}'`));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			this._getRuleUrl(url, tran).then((foundUrl) => {

				// if url doesn't exist foundUrl is empty object
				const objUrl = Object.assign(this._getNewRuleLocationObject(url), foundUrl);

				this._putRuleUrl(objUrl, tran).then((idRuleUrl) => {

					this._getRuleDetails(idRuleUrl, cssSelector, tran).then((foundDetails) => {

						// if details dosn't exist foundDetails is empty object
						const objDetails = Object.assign(this._getNewRuleDetailsObject(idRuleUrl, cssSelector), foundDetails);

						if(this._isDate(details.created)) objDetails.created = details.created;
						if(this._isBoolean(details.hide)) objDetails.hide = details.hide;
						if(this._isBoolean(details.remove)) objDetails.remove = details.remove;
						if(this._isBoolean(details.dewidthify)) objDetails.dewidthify = details.dewidthify;
						if(this._isBoolean(details.isolate)) objDetails.isolate = details.isolate;
						if(LizardDB._isColorObjectValue(details.color)) objDetails.color = details.color;

						this._putRuleDetails(objDetails, tran).then((key) => resolve({ ruleDetailsKey: key }));
					});
				});
			}).catch((error) => {
				console.log("[Lizard]", "setRule error", error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	updateRuleStats(url, cssSelector) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) return reject(new Error(`Mandatory parameters missing. url: '${url}', cssSelector: '${cssSelector}'`));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			this._getRule(url, cssSelector, tran).then((foundRule) => {

				if(foundRule.hasOwnProperty("ruleDetails")) {

					const ruleDetails = foundRule.ruleDetails;

					ruleDetails.lastUsed = Date.now();
					ruleDetails.hitCount += 1;

					this._putRuleDetails(ruleDetails, tran).then((key) => resolve({ ruleDetailsKey: key }));
				} else {
					resolve();
				}
			}).catch((error) => {
				console.log("[Lizard]", "updateRuleStats error", error.name, error.message);
				reject(error);
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
				return reject(new Error(`Mandatory arguments missing. url: '${url}', cssSelector: '${cssSelector}', unsetDetailName: '${unsetDetailName}'`));
			}

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			this._getRule(url, cssSelector, tran).then((foundRule) => {

				if(foundRule.hasOwnProperty("ruleDetails")) {

					const ruleDetails = foundRule.ruleDetails;

					ruleDetails[unsetDetailName] = (unsetDetailName === "color" ? null : false);

					if(LizardDB.ruleHasValue(ruleDetails)) {
						this._putRuleDetails(ruleDetails, tran).then((key) => resolve({ ruleDetailsKey: key }));
					} else {
						this._deleteRuleById(ruleDetails.idRuleUrl, cssSelector, tran).then((result) => resolve(result));
					}
				} else {
					resolve();
				}
			}).catch((error) => {
				console.log("[Lizard]", "unsetRuleDetail error", error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteRule(url, cssSelector) {

		return new Promise(async (resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			cssSelector = cssSelector.trim();
			if(!!!url || !!!cssSelector) return reject(new Error("Mandatory parameters missing. url: '" + url + "', cssSelector: '" + cssSelector + "'"));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			try {

				const foundRule = await this._getRule(url, cssSelector, tran);

				if(foundRule.hasOwnProperty("ruleDetails")) {

					const idRuleUrl = foundRule.ruleDetails.idRuleUrl;

					await this._deleteRuleDetails(idRuleUrl, cssSelector, tran);

					const count = await this._getCount("rule_details", "idx_idRuleUrl", [ idRuleUrl ], tran);

					if(count === 0) {
						await this._deleteRuleUrl(idRuleUrl, tran);
					}
					resolve({ idRuleUrl: idRuleUrl, ruleUrlDeleted: (count === 0) });
				} else {
					resolve();
				}
			} catch(error) {
				console.log("[Lizard]", "deleteRule error", error.name, error.message);
				reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteRulesByUrl(url) {

		return new Promise(async (resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) return reject(new Error(`Mandatory parameters missing. url: '${url}'`));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			try {

				const foundUrl = await this._getRuleUrl(url, tran);

				if(foundUrl.hasOwnProperty("idRuleUrl")) {
					await this._deleteAllRuleDetailsByUrlId(foundUrl.idRuleUrl, tran);
					await this._deleteRuleUrl(foundUrl.idRuleUrl, tran);
				}
				resolve();

			} catch(error) {
				console.log("[Lizard]", "deleteRulesByUrl error", error.name, error.message);
				reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	deleteAllRules() {

		return new Promise(async (resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			try {
				await this._clearRuleDetails(tran);
				await this._clearRuleUrl(tran);
				resolve();
			} catch(error) {
				console.log("[Lizard]", "deleteAllRules error", error.name, error.message);
				reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	getRules(url) {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			url = this._normalizeUrl(url);
			if(!!!url) return reject(new Error("Mandatory parameters missing. url: '" + url + "'"));

			const tran = this._getTransaction("readonly", (error) => reject(error));

			this._getRuleUrl(url, tran).then((foundUrl) => {

				if(foundUrl.hasOwnProperty("idRuleUrl")) {
					this._getAllRuleDetailsByUrlId(foundUrl.idRuleUrl, tran).then((details) => {
						for(let i=0, len=details.length; i<len; i++) {
							delete details[i].idRuleUrl;
						}
						resolve(details);
					});
				} else {
					resolve([]);
				}
			}).catch((error) => {
				console.log("[Lizard]", "getRules error", error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	getAllUrls() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readonly", (error) => reject(error), [ "rule_url" ]);

			this._getAllRuleUrl(tran).then((urls) => {

				// create string array out of the urls sort and resolve
				resolve(urls.map(u => u.url).sort((a, b) => a > b));

			}).catch((error) => {
				console.log("[Lizard]", "getAllDistinctUrls error",error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	getAllRules() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readonly", (error) => reject(error));

			this._getAllRuleUrl(tran).then(async (urls) => {

				const rules = [];

				for(let i=0, len=urls.length; i<len; i++) {

					const details = await this._getAllRuleDetailsByUrlId(urls[i].idRuleUrl, tran);

					for(let j=0, len=details.length; j<len; j++) {
						delete details[j].idRuleUrl;
						rules.push(Object.assign({}, details[j], { url: urls[i].url }))
					}
				}
				resolve(rules);

			}).catch((error) => {
				console.log("[Lizard]", "getAllRules error",error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	getAllRulesEx() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readonly", (error) => reject(error));

			this._getAllRuleUrl(tran).then(async (urls) => {

				const rules = [];

				for(let i=0, len=urls.length; i<len; i++) {

					const details = await this._getAllRuleDetailsByUrlId(urls[i].idRuleUrl, tran);

					rules.push( {
						url: urls[i].url,
						details: details,
					} );
				}
				resolve(rules);

			}).catch((error) => {
				console.log("[Lizard]", "getAllRules error",error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	static isRuleObjectValid(obj) {
		return LizardDB._isRuleObjectValue(obj);
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
	//	"Private" Members (as if)
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	_onDBRequestUpgradeNeeded(event) {

		let db = this.m_dbRequest.result;

		if(!!!db || db.name !== this.m_databaseName) throw new Error("Database not open");

		db.onerror = (event) => console.log("[Lizard]", "upgradeNeeded error", event.target.error.name, event.target.error.message);

		let storePageRule = db.createObjectStore("rule_url", { keyPath: "idRuleUrl", autoIncrement: true });
		storePageRule.createIndex("idx_url", [ "url" ], { unique: true });

		let storeRuleDetails = db.createObjectStore("rule_details", { keyPath: [ "idRuleUrl", "cssSelector" ] });
		storeRuleDetails.createIndex("idx_idRuleUrl", [ "idRuleUrl" ], { unique: false });
		storeRuleDetails.createIndex("idx_cssSelector", [ "cssSelector" ], { unique: false });
	}

	//////////////////////////////////////////////////////////////////////
	_getTransaction(mode = "", failCallback, storeNames = [ "rule_url", "rule_details" ]) {
		const tran = this.m_db.transaction(storeNames, mode);
		tran.onerror = tran.onabort = (event) => {
			const error = event.target.error;
			console.log("[Lizard]", "Transaction error/abort - ", error.name, error.message);
			failCallback(error);
		};
		return tran;
	}

	//////////////////////////////////////////////////////////////////////
	_getCount(storeName, indexName, query, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore(storeName).index(indexName).count(query);

			rq.onsuccess = () => resolve(rq.result);
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getCount count error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getRule(url, cssSelector, tran) {

		return new Promise(async (resolve, reject) => {

			try {

				const foundUrl = await this._getRuleUrl(url, tran);

				// if url not found foundUrl is empty object
				if(foundUrl.hasOwnProperty("idRuleUrl")) {

					const foundDetails = await this._getRuleDetails(foundUrl.idRuleUrl, cssSelector, tran);

					// if details not found foundDetails is empty object
					if(foundDetails.hasOwnProperty("idRuleUrl")) {
						return resolve({
							ruleUrl: foundUrl,
							ruleDetails: foundDetails,
						});
					}
				}
				return resolve({});		// return empty if none was found

			} catch(error) {
				console.log("[Lizard]", "_getRule error", error.name, error.message);
				return reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteRuleById(idRuleUrl, cssSelector, transaction) {

		return new Promise(async (resolve, reject) => {

			try {

				await this._deleteRuleDetails(idRuleUrl, cssSelector, transaction);

				const count = await this._getCount("rule_details", "idx_idRuleUrl", [ idRuleUrl ], transaction);

				if(count === 0) {
					await this._deleteRuleUrl(idRuleUrl, transaction);
				}
				resolve({ ruleUrlDeleted: (count === 0) });

			} catch(error) {
				console.log("[Lizard]", "_deleteRuleById error", error.name, error.message);
				return reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getRuleUrl(url, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_url").index("idx_url").get([ url ]);

			rq.onsuccess = () => resolve(!!rq.result ? rq.result : {});
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getRuleUrl error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_putRuleUrl(obj, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_url").put(obj);

			rq.onsuccess = () => resolve(rq.result);	// object key
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_putRuleUrl error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteRuleUrl(idRuleUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_url").delete(idRuleUrl);

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteRuleUrl error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_clearRuleUrl(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_url").clear();

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_clearRuleUrl error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getAllRuleUrl(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_url").getAll();

			rq.onsuccess = () => resolve(rq.result);
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getAllRuleUrl error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getRuleDetails(idRuleUrl, cssSelector, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").get([ idRuleUrl, cssSelector ]);

			rq.onsuccess = () => resolve(!!rq.result ? rq.result : {});
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getRuleDetails error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_putRuleDetails(obj, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").put(obj);

			rq.onsuccess = () => resolve(rq.result);	// object key
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_putRuleDetails error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteRuleDetails(idRuleUrl, cssSelector, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").delete([ idRuleUrl, cssSelector ]);

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteRuleDetails error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_clearRuleDetails(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").clear();

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_clearRuleDetails error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getAllRuleDetailsByUrlId(idRuleUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").index("idx_idRuleUrl").getAll([ idRuleUrl ], 4096);

			rq.onsuccess = () => resolve(rq.result.sort((a, b) => a.created > b.created ));
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getAllRuleDetailsByUrlId error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteAllRuleDetailsByUrlId(idRuleUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("rule_details").index("idx_idRuleUrl").openCursor([ idRuleUrl ]);
			let affectedCount = 0;

			rq.onsuccess = () => {
				let cursor = rq.result;
				if(!!cursor) {
					cursor.delete();
					affectedCount += 1;
					cursor.continue();
				} else {
					resolve({ affectedCount: affectedCount });
				}
			}
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteRuleDetailsByUrlId error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getNewRuleLocationObject(url) {
		return {
			//idRuleUrl:
			url: url,
			created: Date.now(),
		};
	}

	//////////////////////////////////////////////////////////////////////
	_getNewRuleDetailsObject(idRuleUrl, cssSelector) {
		return {
			idRuleUrl: idRuleUrl,
			cssSelector: cssSelector,
			created: Date.now(),
			lastUsed: 0,
			hitCount: 0,
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
	static _isRuleObjectValue(obj) {
		return	Object.keys(obj).length === 5 &&
				obj.hasOwnProperty("hide") && (typeof(obj.hide) === "boolean") &&
				obj.hasOwnProperty("remove") && (typeof(obj.remove) === "boolean") &&
				obj.hasOwnProperty("dewidthify") && (typeof(obj.dewidthify) === "boolean") &&
				obj.hasOwnProperty("isolate") && (typeof(obj.isolate) === "boolean") &&
				obj.hasOwnProperty("color") && LizardDB._isColorObjectValue(obj.color);
	}

	//////////////////////////////////////////////////////////////////////
	static _isColorObjectValue(obj) {
		return	(obj === null) ||
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
