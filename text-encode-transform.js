// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Prollyfill for Stream support for TextEncoder and TextDecoder

(function() {
  'use strict';

  if (typeof self.TextEncoder !== 'function') {
    throw new ReferenceError('TextEncoder implementation required');
  }

  if (typeof self.TextDecoder !== 'function') {
    throw new ReferenceError('TextDecoder implementation required');
  }

  if ('readable' in self.TextEncoder.prototype &&
      'writable' in self.TextEncoder.prototype &&
      'readable' in self.TextDecoder.prototype &&
      'writable' in self.TextDecoder.prototype) {
    return;
  }

  const transform = Symbol('transform');

  function throwIfLocked(obj) {
    const ts = obj[transform];
    if (ts === undefined) {
      return;
    }

    if (ts.readable.locked) {
      throw new TypeError('readable is locked');
    }

    if (ts.writable.locked) {
      throw new TypeError('writable is locked');
    }
  }

  const originalEncode = self.TextEncoder.prototype.encode;
  const originalDecode = self.TextDecoder.prototype.decode;

  function encode(input = '') {
    throwIfLocked(this);
    return originalEncode.call(this, input);
  }

  self.TextEncoder.prototype.encode = encode;

  function decode(input = undefined, options = {}) {
    throwIfLocked(this);
    return originalDecode.call(this, input, options);
  }

  self.TextDecoder.prototype.decode = decode;

  function addReadableAndWritable(prototype, constructor) {
    function readable() {
      if (!this[transform]) {
        this[transform] = constructor(this);
      }
      return this[transform].readable;
    }

    function writable() {
      if (!this[transform]) {
        this[transform] = constructor(this);
      }
      return this[transform].writable;
    }

    Object.defineProperty(prototype, 'readable',
                          {
                            configurable: true,
                            enumerable: true,
                            get: readable
                          });

    Object.defineProperty(prototype, 'writable',
                          {
                            configurable: true,
                            enumerable: true,
                            get: writable
                          });
  }

  addReadableAndWritable(self.TextEncoder.prototype, encoder => {
    return new TransformStream(new TextEncodeTransformer(encoder));
  });

  addReadableAndWritable(self.TextDecoder.prototype, decoder => {
    return new TransformStream(new TextDecodeTransformer(decoder));
  });

  class TextEncodeTransformer {
    constructor(encoder) {
      this._encoder = encoder;
      this._carry = undefined;
    }

    transform(chunk, controller) {
      if (this._carry !== undefined) {
        chunk = this._carry + chunk;
        this._carry = undefined;
      }
      const terminalCodeUnit = chunk.charCodeAt(chunk.length - 1);
      if (terminalCodeUnit >= 0xD800 && terminalCodeUnit < 0xDC00) {
        this._carry = chunk.substring(chunk.length - 1);
        chunk = chunk.substring(0, chunk.length - 1);
      }
      controller.enqueue(originalEncode.call(this._encoder, chunk));
    }

    flush(controller) {
      if (this._carry !== undefined) {
        controller.enqueue(originalEncode.call(this._encoder, this._carry));
        this._carry = undefined;
      }
    }
  }

  class TextDecodeTransformer {
    constructor(decoder) {
      this._decoder = decoder;
    }

    transform(chunk, controller) {
      controller.enqueue(originalDecode.call(this._decoder, chunk,
                                             {stream: true}));
    }

    flush(controller) {
      // If {fatal: false} in options (the default), then the final call to
      // decode() can produce extra output (usually the unicode replacement
      // character 0xFFFD). When fatal is true, this call is just used for its
      // side-effect of throwing a TypeError exception if the input is
      // incomplete.
      var output = originalDecode.call(this._decoder);
      if (output !== '') {
        controller.enqueue(output);
      }
    }
  }
})();
