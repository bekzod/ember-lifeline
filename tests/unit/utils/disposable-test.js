import EmberObject from '@ember/object';
import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import {
  registerDisposable,
  runDisposables,
} from 'ember-lifeline/utils/disposable';

module('ember-lifeline/utils/disposable', {
  beforeEach() {
    this.subject = EmberObject.create();
  },

  afterEach() {
    run(this.subject, 'destroy');
  },
});

test('registerDisposable asserts if `dispose` has incorrect params', function(assert) {
  assert.expect(4);

  assert.throws(function() {
    registerDisposable();
  });

  assert.throws(function() {
    registerDisposable({});
  });

  assert.throws(function() {
    registerDisposable({}, 1);
  });

  assert.ok(registerDisposable({}, 1, () => {}));
});

test('registerDisposable correctly allocates array if not allocated', function(assert) {
  assert.expect(2);

  assert.equal(this.subject._registeredDisposables, undefined);

  registerDisposable(this.subject, 1, function() {});

  assert.equal(this.subject._registeredDisposables.constructor, Map);
});

test('registerDisposable correctly converts dispose function to disposable', function(assert) {
  assert.expect(3);

  let dispose = () => {};

  let disposable = registerDisposable(this.subject, 1, dispose);

  assert.equal(disposable.constructor, Object, 'disposable is an object');
  assert.equal(
    disposable.dispose.constructor,
    Function,
    'disposable.dispose is a function'
  );
  assert.equal(disposable.disposed, false, 'disposable is not disposed');
});

test('registerDisposable adds disposable to disposables', function(assert) {
  assert.expect(1);

  let dispose = () => {};
  let token = 1;

  let disposable = registerDisposable(this.subject, token, dispose);

  assert.equal(
    this.subject._registeredDisposables.get(token),
    disposable,
    'dispose function is added to _registeredDisposables'
  );
});

test('registerDisposable adds unique disposable to disposables', function(assert) {
  assert.expect(2);

  let dispose = () => {};
  let token = 1;

  let disposable = registerDisposable(this.subject, token, dispose);

  assert.equal(
    disposable,
    this.subject._registeredDisposables.get(token),
    'disposable is returned'
  );

  let otherDisposable = registerDisposable(this.subject, token, dispose);

  assert.notEqual(disposable, otherDisposable, 'disposable returned is unique');
});

test('registerDisposable sets up willDestroy', function(assert) {
  assert.expect(2);

  let dispose = () => {};

  assert.notOk(
    this.subject.willDestroy.patched,
    'willDestroy has not been patched'
  );

  registerDisposable(this.subject, 1, dispose);

  assert.ok(this.subject.willDestroy.patched, 'willDestroy is patched');
});

test('registerDisposable sets up willDestroy only once', function(assert) {
  assert.expect(3);

  let dispose = () => {};

  assert.notOk(
    this.subject.willDestroy.patched,
    'willDestroy has not been patched'
  );

  registerDisposable(this.subject, 1, dispose);

  assert.ok(this.subject.willDestroy.patched, 'willDestroy is patched');

  this.subject.willDestroy.twice = false;

  registerDisposable(this.subject, 2, dispose);

  assert.notOk(this.subject.willDestroy.twice, 'willDestroy only patched once');
});

test('disposable invoked explicitly disposes of disposable', function(assert) {
  assert.expect(2);

  let callCount = 0;
  let dispose = () => {
    callCount++;
  };
  let token = 1;

  let disposable = registerDisposable(this.subject, token, dispose);

  disposable.dispose();

  assert.equal(callCount, 1, 'disposable is called');
  assert.ok(
    this.subject._registeredDisposables.get(token).disposed,
    'disposable marked as disposed'
  );
});

test('disposable invoked explicitly multiple times is only invoked once', function(assert) {
  assert.expect(2);

  let callCount = 0;
  let dispose = () => {
    callCount++;
  };
  let token = 1;

  let disposable = registerDisposable(this.subject, token, dispose);

  disposable.dispose();
  disposable.dispose();

  assert.equal(callCount, 1, 'disposable is called');
  assert.ok(
    this.subject._registeredDisposables.get(token).disposed,
    'disposable marked as disposed'
  );
});

test('runDisposables: runs all disposables when destroying', function(assert) {
  assert.expect(2);

  let dispose = () => {};
  let disposeTheSecond = () => {};

  registerDisposable(this.subject, 1, dispose);
  registerDisposable(this.subject, 2, disposeTheSecond);

  assert.equal(
    this.subject._registeredDisposables.size,
    2,
    'two disposables are registered'
  );

  run(this.subject, 'destroy');

  assert.equal(
    this.subject._registeredDisposables.size,
    0,
    'no disposables are registered'
  );
});

test('runDisposables: sets all disposables to disposed', function(assert) {
  assert.expect(2);

  let dispose = () => {};
  let disposeTheSecond = () => {};

  let disposable = registerDisposable(this.subject, 1, dispose);
  let disposableTheSecond = registerDisposable(
    this.subject,
    2,
    disposeTheSecond
  );

  run(this.subject, 'destroy');

  assert.ok(disposable.disposed, 'first disposable is desposed');
  assert.ok(disposableTheSecond.disposed, 'second disposable is desposed');
});

test('runDisposables throws when no disposables are passed as a parameter', function(assert) {
  assert.expect(1);

  assert.throws(() => {
    runDisposables();
  }, 'Called `runDisposables` where `disposables` is not an array of disposables');
});
