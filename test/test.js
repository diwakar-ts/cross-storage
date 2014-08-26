var expect = require('expect.js');

describe('CrossStorageClient', function() {
  // Increase timeouts
  this.timeout(10000);

  var url = location.origin + '/test/hub.html';
  var storage = new CrossStorageClient(url);

  var setGet = function(key, value, ttl) {
    return function() {
      return storage.set(key, value, ttl).then(function() {
        return storage.get(key);
      });
    };
  };

  beforeEach(function(done) {
    // Delete keys before each test
    storage.onConnect().then(function() {
      return storage.del('key1', 'key2');
    })
    .then(done)
    .catch(done);
  });

  describe('Constructor', function() {
    it('parses the passed url and stores its origin', function() {
      expect(storage._origin).to.be(location.origin);
    });

    it('sets its connected status to false', function() {
      var storage = new CrossStorageClient(url);
      expect(storage._connected).to.be(false);
    });

    it('initializes _requests as an empty object', function() {
      var storage = new CrossStorageClient(url);
      expect(storage._requests).to.eql({});
    });

    it('creates a hidden iframe', function() {
      var frame = document.getElementsByTagName('iframe')[0];
      expect(frame.style.display).to.be('none');
      expect(frame.style.position).to.be('absolute');
      expect(frame.style.top).to.be('-999px');
      expect(frame.style.left).to.be('-999px');
    });

    it('sets the iframe src to the hub url', function() {
      var frame = document.getElementsByTagName('iframe')[0];
      expect(frame.src).to.be(url);
    });

    it('stores the frame context window in _hub', function() {
      expect(storage._hub.constructor.name).to.be('Window');
    });
  });

  describe('onConnect', function() {
    it('returns a promise that is resolved when connected', function(done) {
      storage.onConnect().then(done);
    });

    it('is not fulfilled if a connection is not established', function(done) {
      var storage = new CrossStorageClient('http://localhost:9999');
      var invoked = false;

      storage.onConnect().then(function() {
        invoked = true;
      });

      setTimeout(function() {
        if (!invoked) return done();

        done(new Error('onConnect fired without connecting'));
      }, 100);
    });
  });

  it('can set a key to the specified value', function(done) {
    var key = 'key1';
    var value = 'foo';

    storage.onConnect()
    .then(setGet(key, value))
    .then(function(res) {
      expect(res).to.eql(value);
      done();
    }).catch(done);
  });

  it('can set objects as the value', function(done) {
    var key = 'key1';
    var object = {foo: 'bar'};

    storage.onConnect()
    .then(setGet(key, object))
    .then(function(res) {
      expect(res).to.eql(object);
      done();
    }).catch(done);
  });

  it('can overwrite existing values', function(done) {
    var key = 'key1';
    var value = 'new';

    storage.onConnect().then(function() {
      return storage.set(key, 'old');
    })
    .then(setGet(key, value))
    .then(function(res) {
      expect(res).to.eql(value);
      done();
    }).catch(done);
  });

  it('can set a ttl on the key', function(done) {
    var key = 'key1';
    var value = 'foobar';

    var delay = function() {
      // Delay by 100ms
      return new Promise(function(resolve, reject) {
        setTimeout(resolve, 100);
      });
    };

    storage.onConnect()
    .then(setGet(key, value, 50))
    .then(delay)
    .then(function() {
      return storage.get(key);
    }).then(function(res) {
      expect(res).to.be(null);
      done();
    }).catch(done);
  });

  it('returns an array of values if get is passed multiple keys', function(done) {
    var keys = ['key1', 'key2'];
    var values = ['foo', 'bar'];

    storage.onConnect()
    .then(setGet(keys[0], values[0]))
    .then(setGet(keys[1], values[1]))
    .then(function() {
      return storage.get(keys[0], keys[1]);
    })
    .then(function(res) {
      expect(res).to.eql([values[0], values[1]]);
      done();
    }).catch(done);
  });

  it('can delete multiple keys', function(done) {
    var keys = ['key1', 'key2'];
    var values = ['foo', 'bar'];

    storage.onConnect()
    .then(setGet(keys[0], values[0]))
    .then(setGet(keys[1], values[1]))
    .then(function() {
      return storage.del(keys[0], keys[1]);
    }).then(function() {
      return storage.get(keys[0], keys[1]);
    })
    .then(function(res) {
      expect(res).to.eql([null, null]);
      done();
    }).catch(done);
  });
});
