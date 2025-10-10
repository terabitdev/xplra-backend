// Suppress specific React warnings caused by browser extensions
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('bis_skin_checked') ||
       args[0].includes('Extra attributes from the server'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}
