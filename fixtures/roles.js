import { readFile } from 'node:fs/promises';
class Example {
  constructor(value) { this.value = value; }
  method(parameter) { const ordinary = parameter; return this.value + ordinary; }
}
const object = { key: 'text', ready: true, empty: null, number: 42 };
const expression = /value+/gi;
console.log(object, expression, readFile, new Example(1));
