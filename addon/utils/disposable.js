import { assert } from '@ember/debug';
import getOrAllocate from '../utils/get-or-allocate';

export function registerDisposable(obj, token, dispose) {
  assert(
    'Called `registerDisposable` where `obj` is not an object',
    typeof obj === 'object'
  );
  assert('Called `registerDisposable` where `token` is undefined', !!token);
  assert(
    'Called `registerDisposable` where `dispose` is not a function',
    typeof dispose === 'function'
  );

  let disposables = getOrAllocate(obj, '_registeredDisposables', Map);
  let disposable = _toDisposable(dispose);

  disposables.set(token, disposable);

  _setupWillDestroy(obj);

  return disposable;
}

export function runDisposable(token, disposables) {
  if (!disposables.has(token)) {
    return;
  }

  let disposable = disposables.get(token);

  disposable.dispose();

  return disposables.delete(token);
}

export function runDisposables(disposables) {
  assert(
    'Called `runDisposables` where `disposables` is not an array of disposables',
    !!disposables
  );

  for (let [, disposable] of disposables) {
    disposable.dispose();
  }
  disposables.clear();
}

function _toDisposable(doDispose) {
  return {
    dispose() {
      if (!this.disposed) {
        this.disposed = true;
        doDispose();
      }
    },
    disposed: false,
  };
}

function _setupWillDestroy(obj) {
  if (!obj.willDestroy) {
    return;
  }

  if (!obj.willDestroy.patched && obj._registeredDisposables) {
    let originalWillDestroy = obj.willDestroy;

    obj.willDestroy = function() {
      runDisposables(obj._registeredDisposables);

      originalWillDestroy.apply(obj, arguments);
    };
    obj.willDestroy.patched = true;
  }
}
