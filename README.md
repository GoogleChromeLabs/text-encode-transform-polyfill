# Text Encode Transformations

## Overview

This is a polyfill for the transform streams TextEncoderStream and
TextDecoderStream. It is based on the TextEncoderStream and TextDecoderStream
interfaces from the Encoding Standard:

https://encoding.spec.whatwg.org/#interface-textdecoderstream

It is intended for experimentation with the standard.

## Requirements

You need implementations of TextEncoder, TextDecoder, ReadableStream,
WritableStream and TransformStream, either natively or via polyfill.

## How to use

Include the polyfill in the page:

```javascript
<script src="text-encode-transform.js">
```

It can also be used in a Worker environment:

```javascript
importScripts('text-encode-transform.js');
```

Then you can use it in a pipe like this:

```javascript
byteSource
  .pipeThrough(new TextDecoderStream())
  .pipeTo(textDestination);
```

Any arguments that the TextDecoder constructor normally accepts will also work
when used as a stream transform.

TextEncoderStream works the same way:

```javascript
textSource
  .pipeThrough(new TextEncoderStream())
  .pipeTo(byteDestination);
```

## Tests

Tests have moved to the main web-platform-tests repository at
https://github.com/web-platform-tests/wpt/tree/master/encoding/streams.

### See also

 - [Encoding Living Standard][]
 - [Streams Living Standard][]

[Encoding Living Standard]: https://encoding.spec.whatwg.org/
[Streams Living Standard]: https://streams.spec.whatwg.org/

### Disclaimer

This is not an official Google product.
