# Text Encoder Streaming Prollyfill
ricea@chromium.org - last updated 16 November 2017

The TextEncoder and TextDecoder APIs provide conversions between bytes and
strings for Javascript in the browser. The Streams API is an API for processing
streams of data in the browser. It is proposed to integrate these APIs so that
TextEncoder and TextDecoder can be used directly with the Streams API.

The objective of this Prollyfill is to permit experimentation with the new
standard. It is called a "Prollyfill" rather than a "Polyfill" because it
implements what the standard might be rather than what the standard is.

## Motivation

Integration between the Streams API and the Encoding API is useful, however it
doesn't exist yet. This prollyfill provides a bridge to allow experimentation in
the meantime.

## Requirements & Scope

### Requirements
 - The prollyfill must work in browsers that have implementations of the
   pre-requisite APIs.
 - The prollyfill should implement the expected API with the expected semantics.
 - The prollyfill should enable development of web platform tests.
 - The prollyfill should provide acceptable performance.
 - The prollyfill should be convenient to use.
 - The prollyfill should function within Workers as well as document
   environments.

### Non-requirements
 - The prollyfill doesn't need to support environments that do not have the
   TextEncoder and TextDecoder APIs.
 - The prollyfill doesn't need to support environments that do not support
   ReadableStream and WritableStream.
 - The prollyfill doesn't need to provide the maximum possible performance.
 - The prollyfill doesn't need to support versions of Javascript prior to ES6.

## Assumptions

- All the browsers that meet the other requirements will support ES6.
- The prollyfill can be modified as standardisation proceeds.

## Detailed Design

### Interface

The prollyfill will be used by importing it into the page using a `<script>` tag
prior to using the functionality. In Worker environments it will be imported
using `importScripts()`.

The interface provided is identical to [TextEncoder and TextDecoder as
specified in the Encoding Standard](https://encoding.spec.whatwg.org/#api),
with the addition of `readable` and `writable` attributes on the objects that
permit it to be used with the [Streams pipeThrough
API](https://streams.spec.whatwg.org/#rs-pipe-through).

### Technology

The prollyfill builds upon [The Web
Platform](http://tess.oconnor.cx/2009/05/what-the-web-platform-is) and is
implemented in [Javascript](http://www.ecma-international.org/ecma-262/6.0/).

### Implementation

The prototypes of the existing TextEncoder and TextDecoder classes are modified
to add the extra functionality. `readable` and `writable` getters are added to
the prototype. These work by delegating to a
[TransformStream](https://streams.spec.whatwg.org/#ts) object, which is lazily
created the first time they are accessed. The TransformStream is stored as a
symbol property on the object, to avoid interfering with the usable namespace.

The `encode()` and `decode()` methods are wrapped to verify that the readable
and writable sides aren't locked before proceeding with the operation.

`encode`, `decode` and the `readable` and `writable` getters are all defined as
functions of the appropriate names, so that the `name` property on the function
objects will be correct.

### Scalability

The time taken to transform text to bytes and vice-versa is proportional to the
number of bytes. The memory used is proportional to the size of the largest
chunk, which is roughly constant for any given use case.

### Monitoring

There will be no explicit monitoring.

### Redundancy & Reliability

The prollyfill applies the same redundancy practices as the web platform as a
whole. Generally, it us up to developers or frameworks to provide redundancy,
and this API is agnostic to the approach taken.

The TextDecoder API provides various options for error handling, and these are
inherited by this API.

### Security

No security implications.

### Privacy

No privacy implications.

## Open Questions & Risks

There is general consensus that this integration should happen, but the exact
shape of it has not been agreed yet.

There is a risk that the integration will never happen.

## Tasks & Estimates

1. Write one short Javascript file. Estimate: 1 hour.
2. Write some tests. Estimate: 1 hour.
3. Test the Javascript against the tests. Estimate: 20 minutes.

## Future Improvements

 - Performance may be improved if there is demand.
 - A build system for integration with Javascript bundling systems and minifiers
   may be added.

## Similar Projects

None known.

## Other Solutions Considered

 - Supporting ES5 would have been possible, but would have made the code harder
   to understand.
 - A previous implementation wrapped the existing TextEncoder and TextDecoder
   APIs. This was considerably simpler and easier to understand, but was
   inefficient.
 - For strict compliance the `readable` and `writable` getters should verify
   that `this` is of the correct type before attaching a TransformStream to
   it. However, in the context of a polyfill this would interfere with
   extensibility and so the check is intentionally omitted.
 - Similarly, no attempt is made to defend against changes to the global object
   made by other code on the same page.
