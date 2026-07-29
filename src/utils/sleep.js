// Sleep utility - returns a promise that resolves after the specified milliseconds
export default function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
