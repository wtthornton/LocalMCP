
function greet(name: string) {
  return "Hello, " + name;
}

// This will cause a TypeScript error
const user = { name: "John" };
console.log(greet(user.name));
