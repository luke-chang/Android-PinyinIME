(function() {

  if (typeof Module == 'undefined') Module = {};

  if (typeof Module['setStatus'] == 'undefined') {
    Module['setStatus'] = function (status) {
      document.getElementById('status').textContent = status;
    };
  }

  if (typeof Module['canvas'] == 'undefined') {
    Module['canvas'] = document.getElementById('canvas');
  }

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

  if (!Module['_main']) Module['_main'] = function() {
    var im_open_decoder = Module.cwrap('im_open_decoder', 'number', ['string', 'string']);
    var im_reset_search = Module.cwrap('im_reset_search', '', []);
    var im_search = Module.cwrap('im_search', 'number', ['string', 'number']);
    var im_get_candidate = Module.cwrap('im_get_candidate', 'string', ['number', 'string', 'number']);
    var im_get_candidate_char = Module.cwrap('im_get_candidate_char', 'string', ['number']);
    var im_get_predicts = Module.cwrap('im_get_predicts_utf8', 'number', ['string', 'number']);
    var im_get_predict_at = Module.cwrap('im_get_predict_at', 'string', ['number']);

    log('Data file is ready');
    log('Opening data/dict.data ....');
    if (im_open_decoder('data/dict.data', 'user.dict')) {
      log('Success to open data/dict.data!');
    } else {
      log('Failed to open data/dict.data!');
    }

    var keywords = [];
    document.getElementById('test').onclick = function() {
      currentIdx = 0;
      keywords = document.getElementById('pinyin').value.trim().split(' ');
      testNextKeyword();
    };

    document.getElementById('getCandidates').onclick = function() {
      printCandidates(document.getElementById('pinyin').value.trim());
    };

    document.getElementById('get_predicts').onclick = function() {
      getPredicts(document.getElementById('pinyin').value.trim());
    };

    var TIMES = 100;

    function testNextKeyword() {
      window.setTimeout(function() {
        var keyword = keywords.shift();
        if (!keyword) {
          return;
        }
        test(keyword);
        testNextKeyword();
      }, 0);
    }

    function printCandidates(keyword) {
      im_reset_search();
      var size = im_search(keyword, keyword.length);

      var candidates = '';
      for (var i = 0; i < size; i++) {
        candidates += im_get_candidate_char(i) + ' ';
      }
      log(size + ' candidates: ' + candidates);
    }

    function getPredicts(key) {
      var buf = Module._malloc(500 * 8 * 6);
      var arrayBuffer = new Uint8Array(500 * 8 * 6);

      var n = im_get_predicts(key, buf);
      log('Get ' + n + ' predicts for "' + key + '": ');

      var predicts = [];
      for (var i = 0; i < n; i++) {
        var arrayBuffer = new Uint8Array(8 * 6);
        for (var j = 0; j < arrayBuffer.byteLength; j++) {
          arrayBuffer[j] = HEAPU8[buf + i * 8 * 6 + j];
        }

        // TODO convert arraybuffer to string?
        predicts.push(im_get_predict_at(i));
      }

      log(predicts.join(' '));

      Module._free(buf);
    }

    window.test = function (keyword) {
      try {
        var times = parseInt(document.getElementById('times').value);
        log('search ' + times + ' times keyword "' + keyword + '"');

        var startTime = new Date().getTime();
        var size = 0;

        for (var i = 0; i < times; i++) {
          im_reset_search();
          size = im_search(keyword, keyword.length);
        }

        var endTime = new Date().getTime();

        log('got ' + size + ' candidates, cost ' + (endTime - startTime) + ' milliseconds.');
      } catch (e) {
        log('error: ' + e);
      }
    };
  }

})();

