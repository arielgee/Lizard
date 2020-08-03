let messaging = (function () {


	/******************************************************************************/
	/******************************************************************************/
	// generally meant to be used from background.js
	class Server {
		constructor() {
			this._port = undefined;
		}

		//////////////////////////////////////////////////////////////////////
		initialize(onMessageCallback) {
			this._onMessageCallback = onMessageCallback;
			this._onRuntimeConnect = this._onRuntimeConnect.bind(this);
			browser.runtime.onConnect.addListener(this._onRuntimeConnect);
		}

		//////////////////////////////////////////////////////////////////////
		postMessage(message) {
			this._port.postMessage(message);
		}

		//////////////////////////////////////////////////////////////////////
		_onRuntimeConnect(port) {
			this._port = port;
			this._port.onMessage.addListener(this._onMessageCallback)
		}
	};


	/******************************************************************************/
	/******************************************************************************/
	// generally meant to be used from content.js
	class Client {
		constructor() {
			this._port = undefined;
		}

		//////////////////////////////////////////////////////////////////////
		connect(portName, onMessageCallback) {
			this._port = browser.runtime.connect({ name: portName });
			this._port.onMessage.addListener(onMessageCallback);
		}

		//////////////////////////////////////////////////////////////////////
		postMessage(message) {
			this._port.postMessage(message);
		}
	};

	let m_server = null;

	return {
		getServer: () => !!m_server ? m_server : (m_server = new Server()),
		getClient: () => new Client(),
	}

})();
