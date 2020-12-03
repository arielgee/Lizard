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
			if(!!!url || !!!cssSelector) return reject(new Error(`Mandatory parameters missing. url: '${url}', cssSelector: '${cssSelector}'`));

			const tran = this._getTransaction("readwrite", (error) => reject(error));

			this._getUrlObject(url, tran).then((foundUrl) => {

				// if url doesn't exist foundUrl is empty object
				const objUrl = Object.assign(this._getNewUrlObject(url), foundUrl);

				this._putUrlObject(objUrl, tran).then((idUrl) => {

					this._getRuleObject(idUrl, cssSelector, tran).then((foundRule) => {

						// if rule dosn't exist foundRule is empty object
						const objRule = Object.assign(this._getNewRuleObject(idUrl, cssSelector), foundRule);

						if(this._isDate(details.created)) objRule.created = details.created;
						if(this._isBoolean(details.hide)) objRule.hide = details.hide;
						if(this._isBoolean(details.remove)) objRule.remove = details.remove;
						if(this._isBoolean(details.dewidthify)) objRule.dewidthify = details.dewidthify;
						if(this._isBoolean(details.isolate)) objRule.isolate = details.isolate;
						if(LizardDB._isColorObjectValue(details.color)) objRule.color = details.color;

						this._putRuleObject(objRule, tran).then((key) => resolve({ ruleKey: key }));
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

			this._getUrlRule(url, cssSelector, tran).then((foundRule) => {

				if(foundRule.hasOwnProperty("rule")) {

					const rule = foundRule.rule;

					rule.lastUsed = Date.now();
					rule.hitCount++;

					this._putRuleObject(rule, tran).then((key) => resolve({ ruleKey: key }));
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

			this._getUrlRule(url, cssSelector, tran).then((foundRule) => {

				if(foundRule.hasOwnProperty("rule")) {

					const rule = foundRule.rule;

					rule[unsetDetailName] = (unsetDetailName === "color" ? null : false);

					if(LizardDB.ruleHasValue(rule)) {
						this._putRuleObject(rule, tran).then((key) => resolve({ ruleKey: key }));
					} else {
						this._deleteRuleById(rule._id_url, cssSelector, tran).then((result) => resolve(result));
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

				const foundRule = await this._getUrlRule(url, cssSelector, tran);

				if(foundRule.hasOwnProperty("rule")) {

					const idUrl = foundRule.rule._id_url;

					await this._deleteRuleObject(idUrl, cssSelector, tran);

					const count = await this._getCount("S02_rules", "idx_id_url", [ idUrl ], tran);

					if(count === 0) {
						await this._deleteUrlObject(idUrl, tran);
					}
					resolve({ idUrl: idUrl, urlDeleted: (count === 0) });
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

				const foundUrl = await this._getUrlObject(url, tran);

				if(foundUrl.hasOwnProperty("_id_url")) {
					await this._deleteAllRuleObjectsByUrlId(foundUrl._id_url, tran);
					await this._deleteUrlObject(foundUrl._id_url, tran);
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
				await this._clearRules(tran);
				await this._clearUrls(tran);
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

			this._getUrlObject(url, tran).then((foundUrl) => {

				if(foundUrl.hasOwnProperty("_id_url")) {
					this._getAllRuleObjectsByUrlId(foundUrl._id_url, tran).then((rules) => {
						for(let i=0, len=rules.length; i<len; i++) {
							delete rules[i]._id_url;
						}
						resolve(rules);
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

	/*
	+
	+ Will be used if and when 'RulesByURLPattern' will be implemented.
	+
	//////////////////////////////////////////////////////////////////////
	getRulesByURLPattern(url) {

		return new Promise((resolve, reject) => {

			this.getAllUrlRules().then((objUrlRules) => {

				const wildcardReplacement = "[^/.]{1,256}";

				let matchedUrlRules = objUrlRules.filter(urlRule => !!(url.match(lzUtil.patternToRegExp(urlRule.url, wildcardReplacement))) );

				if(matchedUrlRules.length > 0 && matchedUrlRules[0].hasOwnProperty("rules")) {
					resolve(matchedUrlRules[0].rules);
				} else {
					resolve([]);
				}
			}).catch((error) => {
				reject(error)
			});
		});
	}
	*/

	//////////////////////////////////////////////////////////////////////
	getAllUrls() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readonly", (error) => reject(error), [ "S01_urls" ]);

			this._getAllUrlObjects(tran).then((urls) => {

				// create string array out of the urls sort and resolve
				resolve(urls.map(u => u.url).sort((a, b) => a > b));

			}).catch((error) => {
				console.log("[Lizard]", "getAllUrls error",error.name, error.message);
				reject(error);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	getAllUrlRules() {

		return new Promise((resolve, reject) => {

			if(!this.isOpen) return reject(new Error("Database not open"));

			const tran = this._getTransaction("readonly", (error) => reject(error));

			this._getAllUrlObjects(tran).then(async (urls) => {

				const urlRules = [];

				for(let i=0, len=urls.length; i<len; i++) {

					const rules = await this._getAllRuleObjectsByUrlId(urls[i]._id_url, tran);

					urlRules.push( {
						url: urls[i].url,
						rules: rules,
					} );
				}
				resolve(urlRules);

			}).catch((error) => {
				console.log("[Lizard]", "getAllUrlRules error",error.name, error.message);
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

		//////////////////////////////////////////////////////////////////////
		//	OLD
		//	---
		//	rule_url	:	idRuleUrl | created | url
		//				:	idx_url
		//
		//	rule_details:	idRuleUrl | created | lastUsed | hitCount | cssSelector | hide | remove | dewidthify | isolate | color
		//				:	idx_idRuleUrl | idx_cssSelector
		//
		//
		//	NEW
		//	---
		//	S01_urls	:	_id_url | created | url
		//				:	idx_url
		//
		//	S02_rules	:	_id_url | created | lastUsed | hitCount | cssSelector | hide | remove | dewidthify | isolate | color
		//				:	idx_id_url | idx_cssSelector
		//////////////////////////////////////////////////////////////////////

		let storePageRule = db.createObjectStore("S01_urls", { keyPath: "_id_url", autoIncrement: true });
		storePageRule.createIndex("idx_url", [ "url" ], { unique: true });

		let storeRuleDetails = db.createObjectStore("S02_rules", { keyPath: [ "_id_url", "cssSelector" ] });
		storeRuleDetails.createIndex("idx_id_url", [ "_id_url" ], { unique: false });
		storeRuleDetails.createIndex("idx_cssSelector", [ "cssSelector" ], { unique: false });
	}

	//////////////////////////////////////////////////////////////////////
	_getTransaction(mode = "", failCallback, storeNames = [ "S01_urls", "S02_rules" ]) {
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
	_getUrlRule(url, cssSelector, tran) {

		return new Promise(async (resolve, reject) => {

			try {

				const foundUrl = await this._getUrlObject(url, tran);

				// if url not found foundUrl is empty object
				if(foundUrl.hasOwnProperty("_id_url")) {

					const foundRule = await this._getRuleObject(foundUrl._id_url, cssSelector, tran);

					// if rule not found foundRule is empty object
					if(foundRule.hasOwnProperty("_id_url")) {
						return resolve({
							url: foundUrl,
							rule: foundRule,
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
	_deleteRuleById(idUrl, cssSelector, transaction) {

		return new Promise(async (resolve, reject) => {

			try {

				await this._deleteRuleObject(idUrl, cssSelector, transaction);

				const count = await this._getCount("S02_rules", "idx_id_url", [ idUrl ], transaction);

				if(count === 0) {
					await this._deleteUrlObject(idUrl, transaction);
				}
				resolve({ urlDeleted: (count === 0) });

			} catch(error) {
				console.log("[Lizard]", "_deleteRuleById error", error.name, error.message);
				return reject(error);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getUrlObject(url, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S01_urls").index("idx_url").get([ url ]);

			rq.onsuccess = () => resolve(!!rq.result ? rq.result : {});
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getUrlObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_putUrlObject(obj, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S01_urls").put(obj);

			rq.onsuccess = () => resolve(rq.result);	// object key
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_putUrlObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteUrlObject(idUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S01_urls").delete(idUrl);

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteUrlObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_clearUrls(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S01_urls").clear();

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_clearUrls error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getAllUrlObjects(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S01_urls").getAll();

			rq.onsuccess = () => resolve(rq.result);
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getAllUrlObjects error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getRuleObject(idUrl, cssSelector, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").get([ idUrl, cssSelector ]);

			rq.onsuccess = () => resolve(!!rq.result ? rq.result : {});
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getRuleObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_putRuleObject(obj, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").put(obj);

			rq.onsuccess = () => resolve(rq.result);	// object key
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_putRuleObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteRuleObject(idUrl, cssSelector, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").delete([ idUrl, cssSelector ]);

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteRuleObject error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_clearRules(transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").clear();

			rq.onsuccess = () => resolve();
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_clearRules error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getAllRuleObjectsByUrlId(idUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").index("idx_id_url").getAll([ idUrl ], 4096);

			rq.onsuccess = () => resolve(rq.result.sort((a, b) => a.created > b.created ));
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_getAllRuleObjectsByUrlId error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_deleteAllRuleObjectsByUrlId(idUrl, transaction) {

		return new Promise((resolve, reject) => {

			const rq = transaction.objectStore("S02_rules").index("idx_id_url").openCursor([ idUrl ]);
			let affectedCount = 0;

			rq.onsuccess = () => {
				let cursor = rq.result;
				if(!!cursor) {
					cursor.delete();
					affectedCount++;
					cursor.continue();
				} else {
					resolve({ affectedCount: affectedCount });
				}
			}
			rq.onerror = (event) => {
				const error = event.target.error;
				console.log("[Lizard]", "_deleteAllRuleObjectsByUrlId error",error.name, error.message);
				reject(error);
			};
		});
	}

	//////////////////////////////////////////////////////////////////////
	_getNewUrlObject(url) {
		return {
			//_id_url:
			url: url,
			created: Date.now(),
		};
	}

	//////////////////////////////////////////////////////////////////////
	_getNewRuleObject(idUrl, cssSelector) {
		return {
			_id_url: idUrl,
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
