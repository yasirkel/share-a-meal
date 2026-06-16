function createStub(defaultImplementation = async () => undefined) {
  const stub = async (...args) => {
    stub.calls.push(args);
    const implementation = stub.queue.length > 0 ? stub.queue.shift() : stub.implementation;
    return implementation(...args);
  };

  stub.calls = [];
  stub.queue = [];
  stub.implementation = defaultImplementation;
  stub.resolves = (value) => {
    stub.implementation = async () => value;
    return stub;
  };
  stub.resolvesOnce = (value) => {
    stub.queue.push(async () => value);
    return stub;
  };
  stub.implements = (implementation) => {
    stub.implementation = implementation;
    return stub;
  };

  return stub;
}

function stubService(service, methods) {
  methods.forEach((method) => {
    service[method] = createStub();
  });
}

module.exports = {
  createStub,
  stubService,
};
