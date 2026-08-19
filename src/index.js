// Entry point for the snowyparty project.

export function main() {
  return "snowyparty is ready!";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(main());
}
