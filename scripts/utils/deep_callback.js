function addOne(x) {
  return x + 1;
}

function multiplyByTwo(x) {
  return x * 2;
}

function subtractThree(x) {
  return x - 3;
}

function run(value) {
  return function (func) {
    if (typeof func === 'function') {
      return run(func(value));
    } else {
      return value;
    }
  };
}

// const result = run(5)(addOne)(multiplyByTwo)(subtractThree)(subtractThree)();
module.exports = { addOne, multiplyByTwo, subtractThree, run };
