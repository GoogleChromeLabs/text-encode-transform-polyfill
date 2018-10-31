# Text Encoder Streaming Polyfill
ricea@chromium.org - last updated 31 October 2018

The existing TextEncoder and TextDecoder APIs provide conversions between bytes
and strings for Javascript in the browser. The Streams API is an API for
processing streams of data in the browser. It is proposed to create new
TextEncoderStream and TextDecoderStream APIs so that text encoding and decoding
can be done with the Streams API.

## Motivation

Integration between the Streams API and the Encoding API is useful, however it
is not implemented in browsers yet. This polyfill provides a bridge to allow
using the new APIs in the meantime.

## Requirements & Scope

### Requirements
 - The polyfill must work in browsers that have implementations of the
   prerequisite APIs.
 - The polyfill should implement the expected API with the expected semantics.
 - The polyfill should provide acceptable performance.
 - The polyfill should be convenient to use.
 - The polyfill should function within Workers as well as document
   environments.
 - The polyfill should be close enough to the intended standard to function
   identically in non-pathological cases.

### Non-requirements
 - The polyfill doesn't need to support environments that do not have the
   TextEncoder and TextDecoder APIs.
 - The polyfill doesn't need to support environments that do not support
   ReadableStream and WritableStream.
 - The polyfill doesn't need to provide the maximum possible performance.
 - The polyfill doesn't need to support versions of JavaScript prior to ES6.
 - The polyfill doesn't need to have perfect fidelity to the standard.

## Assumptions

- All the browsers that meet the other requirements will support ES6.
- The polyfill can be modified as standardisation proceeds.

## Detailed Design

### Interface

The polyfill will be used by importing it into the page using a `<script>` tag
prior to using the functionality. In Worker environments it will be imported
using `importScripts()`.

The interface provided is similar to [TextEncoder and TextDecoder as specified
in the Encoding Standard](https://encoding.spec.whatwg.org/#api), but instead of
`encode()` and `decode()` methods, `readable` and `writable` getters permit it
to function as a [transform stream](https://streams.spec.whatwg.org/#ts-model)
and be used with the [Streams pipeThrough
API](https://streams.spec.whatwg.org/#rs-pipe-through).

### Technology

The polyfill builds upon [The Web
Platform](http://tess.oconnor.cx/2009/05/what-the-web-platform-is) and is
implemented in [JavaScript](http://www.ecma-international.org/ecma-262/6.0/).

### Implementation

New classes TextEncoderStream and TextDecoderStream are created. Almost all
functionality is delegated: `readable` and `writable` getters are delegated to a
TransformStream that is created in the constructor, and the other getters are
delegated to an underlying TextEncoder or TextDecoder that is also created in
the constructor.

The TransformStream and TextEncoder or Decoder are stored on the objects using
symbols for encapsulation.

### Scalability

The time taken to transform text to bytes and vice-versa is proportional to the
number of bytes. The memory used is proportional to the size of the largest
chunk, which is roughly constant for any given use case.

### Monitoring

There will be no explicit monitoring.

### Redundancy & Reliability

The polyfill applies the same redundancy practices as the web platform as a
whole. Generally, it is up to developers or frameworks to provide redundancy,
and this API is agnostic to the approach taken.

The TextDecoder API provides various options for error handling, and these are
inherited by this API.

### Security

No security implications.

### Privacy

No privacy implications.

## Open Questions & Risks

None known.

## Tasks & Estimates

1. Write one short JavaScript file. Estimate: 1 hour.
2. Write some tests. Estimate: 1 hour.
3. Test the JavaScript against the tests. Estimate: 20 minutes.

## Future Improvements

 - Performance may be improved if there is demand.
 - A build system for integration with JavaScript bundling systems and minifiers
   may be added.

## Similar Projects

None known.

## Other Solutions Considered

 - Supporting ES5 would have been possible, but would have made the code harder
   to understand.
 - A previous implementation wrapped the existing TextEncoder and TextDecoder
   APIs. This was considerably simpler and easier to understand, but was
   inefficient.
 - For strict compliance, the `readable` and `writable` getters should verify
   that `this` is of the correct type before attaching a TransformStream to
   it. However, in the context of a polyfill this would interfere with
   extensibility and so the check is intentionally omitted.
 - Similarly, no attempt is made to defend against changes to the global object
   made by other code on the same page.
