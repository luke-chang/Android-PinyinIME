(function() {
  if (typeof Module == 'undefined') Module = {};
  if (!Module['preRun']) Module['preRun'] = [];

  function getLoggerTime() {
    var date = new Date();
    return date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + ":" + date.getMilliseconds();
  }

  function log(msg) {
    var parent = document.getElementById('log');
    if (parent.childNodes.length > 200) {
      parent.removeChild(parent.childNodes[0]);
    }

    var logElem = document.createElement('div');
    logElem.textContent = getLoggerTime() + ": " + msg;
    parent.appendChild(logElem);
  }

  Module["preRun"].push(function() {
    Module['addRunDependency']('fp data/user_dict.data');

    // Load user.dict from IndexedDB
    var indexedDB = window.indexedDB;
    var dbVersion = 1;
    var STORE_NAME = 'files';
    var USER_DICT = 'user_dict';
    var db;

    var request = indexedDB.open('EmpinyinDatabase', dbVersion);

    request.onerror = function opendb_onerror(event) {
      log('Error occurs when openning database: ' + event.target.errorCode);
    };

    request.onsuccess = function opendb_onsuccess(event) {
      db = event.target.result;
      readUserDictFileFromDB();
    };

    request.onupgradeneeded = function opendb_onupgradeneeded(event) {
      db = event.target.result;

      // delete the old ObjectStore if present
      if (db.objectStoreNames.length !== 0) {
        db.deleteObjectStore(STORE_NAME);
      }

      // create ObjectStore
      db.createObjectStore(STORE_NAME, { keyPath: 'name' });
    };

    function readUserDictFileFromDB() {
      var request = db.transaction([STORE_NAME], 'readonly')
                      .objectStore(STORE_NAME).get(USER_DICT);

      request.onsuccess = function readdb_oncomplete(event) {
        if (!event.target.result) {
          createSampleDataForUserDict();
          return;
        }

        // Got the blob object of user dict, write it to FS
        var userDictBlob = event.target.result.content;

        var reader = new FileReader(userDictBlob);
        reader.addEventListener('loadend', function(event) {
          var arrayBuffer = event.target.result;
          var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer)
                                                : arrayBuffer;

          // Write user dict data into FS
          Module['FS_createPreloadedFile']('/data', 'user_dict.data',
                                           byteArray, true, true, function() {
            Module['removeRunDependency']('fp data/user_dict.data');
          });
        });

        reader.readAsArrayBuffer(userDictBlob);
      };

      request.onerror = function readdb_oncomplete(event) {
        alert('error to get file: ' + event.target.result.name);
      };
    }

    function createSampleDataForUserDict() {
      var fileParts = ['abcddwefwedddd'];
      var sampleBlob = new Blob(fileParts, {type: 'application/octet-binary'});
      saveUserDictFileToDB(USER_DICT, sampleBlob, readUserDictFileFromDB);
    }

    // Save ArrayBuffer directly?
    function saveUserDictFileToDB(name, blob, callback) {
      var request = db.transaction([STORE_NAME], 'readwrite')
                      .objectStore(STORE_NAME).add({
                          name: name,
                          content: blob
                        });

      request.onsuccess = function writedb_onsuccess(event) {
        callback(true);
      };

      request.onerror = function writedb_onerror(event) {
        callback(false);
      };
    }
  });
})();

