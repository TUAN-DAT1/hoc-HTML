var app = {};

app.button = {
  "on": {
    "clicked": function (callback) {
      chrome.action.onClicked.addListener(function (e) {
        app.storage.load(function () {
          callback(e);
        }); 
      });
    }
  },
  "icon": function (tabId, path, callback) {
    if (path && typeof path === "object") {
      var options = {"path": path};
      if (tabId) options["tabId"] = tabId;
      chrome.action.setIcon(options, function (e) {
        if (callback) callback(e);
      });
    } else {
      var options = {
        "path": {
          "16": "../data/icons/" + (path ? path + '/' : '') + "16.png",
          "32": "../data/icons/" + (path ? path + '/' : '') + "32.png",
          "48": "../data/icons/" + (path ? path + '/' : '') + "48.png",
          "64": "../data/icons/" + (path ? path + '/' : '') + "64.png"
        }
      };
      /*  */
      if (tabId) options["tabId"] = tabId;
      chrome.action.setIcon(options, function (e) {
        if (callback) callback(e);
      }); 
    }
  }
};

app.storage = {
  "local": {},
  "read": function (id) {
    return app.storage.local[id];
  },
  "update": function (callback) {
    if (app.session) app.session.load();
    /*  */
    chrome.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (callback) {
        callback("update");
      }
    });
  },
  "write": function (id, data, callback) {
    let tmp = {};
    tmp[id] = data;
    app.storage.local[id] = data;
    //
    chrome.storage.local.set(tmp, function (e) {
      if (callback) {
        callback(e);
      }
    });
  },
  "load": function (callback) {
    const keys = Object.keys(app.storage.local);
    if (keys && keys.length) {
      if (callback) {
        callback("cache");
      }
    } else {
      app.storage.update(function () {
        if (callback) callback("disk");
      });
    }
  } 
};

app.on = {
  "management": function (callback) {
    chrome.management.getSelf(callback);
  },
  "uninstalled": function (url) {
    chrome.runtime.setUninstallURL(url, function () {});
  },
  "installed": function (callback) {
    chrome.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    chrome.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "storage": function (callback) {
    chrome.storage.onChanged.addListener(function (changes, namespace) {
      app.storage.update(function () {
        if (callback) {
          callback(changes, namespace);
        }
      });
    });
  },
  "message": function (callback) {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      app.storage.load(function () {
        callback(request, sender, sendResponse);
      });
      /*  */
      return true;
    });
  }
};

app.page = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.page.message[id] = callback;
    }
  },
  "post": function (id, data) {
    if (id) {
      if (app.page.port) {
        app.page.port.postMessage({"data": data, "method": id, "path": "background-to-page"});
      }
    }
  },
  "send": function (id, data, tabId, frameId) {
    if (id) {
      chrome.tabs.query({}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          var options = {
            "method": id, 
            "data": data ? data : {}, 
            "path": "background-to-page"
          };
          /*  */
          tabs.forEach(function (tab) {
            if (tab) {
              options.data.tabId = tab.id;
              options.data.top = tab.url ? tab.url : '';
              options.data.title = tab.title ? tab.title : '';
              /*  */
              if (tabId && tabId !== null) {
                if (tabId === tab.id) {
                  if (frameId && frameId !== null) {
                    chrome.tabs.sendMessage(tab.id, options, {"frameId": frameId});
                  } else {
                    chrome.tabs.sendMessage(tab.id, options);
                  }
                }
              } else {
                chrome.tabs.sendMessage(tab.id, options);
              }
            }
          });
        }
      });
    }
  }
};

app.tab = {
  "open": function (url, index, active, callback) {
    var properties = {
      "url": url, 
      "active": active !== undefined ? active : true
    };
    /*  */
    if (index !== undefined) {
      if (typeof index === "number") {
        properties.index = index + 1;
      }
    }
    /*  */
    chrome.tabs.create(properties, function (tab) {
      if (callback) callback(tab);
    }); 
  },
  "query": {
    "index": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0].index);
        } else callback(undefined);
      });
    },
    "active": function (callback) {
      chrome.tabs.query({"active": true, "currentWindow": true}, function (tabs) {
        var tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          callback(tabs[0]);
        } else callback(undefined);
      });
    }
  },
  "inject": {
    "js": function (options, callback) {
      if (chrome.scripting) {
        chrome.scripting.executeScript(options, function (e) {
          var tmp = chrome.runtime.lastError;
          if (callback) callback(e);
        });
      }
    },
    "css": function (options, callback) {
      if (chrome.scripting) {
        chrome.scripting.insertCSS(options, function (e) {
          var tmp = chrome.runtime.lastError;
          if (callback) callback(e);
        });
      }
    }
  },
  "on": {
    "removed": function (callback) {
      chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        app.storage.load(function () {
          callback(tabId);
        }); 
      });
    },
    "updated": function (callback) {
      chrome.tabs.onUpdated.addListener(function (tabId, info, tab) {
        app.storage.load(function () {
          if (info && info.status) {
            callback(tab);
          }
        });
      });
    }
  }
};