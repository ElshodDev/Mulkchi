if (typeof window === 'undefined') {
  const mockWindow = {
    document: { 
      createElement: (tag: string) => ({ 
        getContext: () => null,
        setAttribute: () => {},
        getAttribute: () => null,
        removeAttribute: () => {},
        style: {},
        value: ''
      }),
      documentElement: { style: {} },
      addEventListener: () => {},
      removeEventListener: () => {},
      cookie: ''
    },
    navigator: typeof navigator !== 'undefined' ? navigator : { userAgent: 'node' },
    screen: { deviceXDPI: 96, logicalXDPI: 96 },
    devicePixelRatio: 1,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    requestAnimationFrame: (cb: any) => setTimeout(cb, 0),
    cancelAnimationFrame: (id: any) => clearTimeout(id),
    scrollTo: () => {},
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {}
    }
  };
  
  (global as any).window = mockWindow;
  
  if (typeof document === 'undefined') {
    (global as any).document = mockWindow.document;
  }
  
  if (typeof navigator === 'undefined') {
    (global as any).navigator = mockWindow.navigator;
  }

  if (typeof localStorage === 'undefined') {
    (global as any).localStorage = mockWindow.localStorage;
  }

  if (typeof sessionStorage === 'undefined') {
    (global as any).sessionStorage = mockWindow.sessionStorage;
  }
}
