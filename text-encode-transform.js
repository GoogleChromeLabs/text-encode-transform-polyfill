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

  addReadableAndWritable(self.TextEncoder.prototype, () => {
    return new TransformStream(new TextEncodeTransformer());
  });

  addReadableAndWritable(self.TextDecoder.prototype, decoder => {
    return new TransformStream(new TextDecodeTransformer(decoder));
  });

  class TextEncodeTransformer {
    constructor(encoder) {
      this._encoder = new TextEncoder();
      this._carry = undefined;
    }

    transform(chunk, controller) {
      chunk = String(chunk);
      if (this._carry !== undefined) {
        chunk = this._carry + chunk;
        this._carry = undefined;
      }
      const terminalCodeUnit = chunk.charCodeAt(chunk.length - 1);
      if (terminalCodeUnit >= 0xD800 && terminalCodeUnit < 0xDC00) {
        this._carry = chunk.substring(chunk.length - 1);
        chunk = chunk.substring(0, chunk.length - 1);
      }
      controller.enqueue(this._encoder.encode(chunk));
    }

    flush(controller) {
      if (this._carry !== undefined) {
        controller.enqueue(this._encoder.encode(this._carry));
        this._carry = undefined;
      }
    }
  }

  class TextDecodeTransformer {
    constructor(decoder) {
      this._decoder = new TextDecoder(decoder.encoding, {
        fatal: decoder.fatal,
        ignoreBOM: decoder.ignoreBOM
      });
    }

    transform(chunk, controller) {
      controller.enqueue(this._decoder.decode(chunk, {stream: true}));
    }

    flush(controller) {
      // If {fatal: false} is in options (the default), then the final call to
      // decode() can produce extra output (usually the unicode replacement
      // character 0xFFFD). When fatal is true, this call is just used for its
      // side-effect of throwing a TypeError exception if the input is
      // incomplete.
      var output = this._decoder.decode();
      if (output !== '') {
        controller.enqueue(output);
      }
    }
  }
})();
