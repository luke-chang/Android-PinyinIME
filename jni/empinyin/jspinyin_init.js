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

    if (typeof msg == 'string') {
      var logElem = document.createElement('div');
      logElem.textContent = getLoggerTime() + ": " + msg;
      parent.appendChild(logElem);
    } else {
      parent.appendChild(msg);
    }
  }

  if (!Module['_main']) Module['_main'] = function() {
    var im_open_decoder = Module.cwrap('im_open_decoder', 'number', ['string', 'string']);
    var im_reset_search = Module.cwrap('im_reset_search', '', []);
    var im_search = Module.cwrap('im_search', 'number', ['string', 'number']);
    var im_get_candidate = Module.cwrap('im_get_candidate', 'string', ['number', 'string', 'number']);
    var im_get_candidate_char = Module.cwrap('im_get_candidate_char', 'string', ['number']);
    var im_choose = Module.cwrap('im_choose', '', ['number']);
    var im_flush_cache = Module.cwrap('im_flush_cache', '', []);

    log('Data file is ready');
    log('Opening data/dict.data ....');
    if (im_open_decoder('data/dict.data', 'data/user_dict.data')) {
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

      var candidates = document.createElement('div');
      for (var i = 0; i < size; i++) {
        var candidate = document.createElement('a');
        candidate.href = "javascript:void(0);"
        candidate.style.marginRight = '5px';
        var str = im_get_candidate_char(i);
        candidate.textContent = str;
        candidates.appendChild(candidate);

        candidate.dataset.value = str;
        candidate.dataset.id = i;
        candidate.onclick = function() {
          im_choose(this.dataset.id);
          im_flush_cache();
          Module['saveFileToDB']('data/user_dict.data', function(success) {
            alert('Saved user dict: ' + success);
          });
        };
      }

      log(size + ' candidates: ')
      log(candidates);
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

