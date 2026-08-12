// All native fetching goes through here so assumption A3 - the engine scheme
// is fetch-enabled - has a single choke point. If a CEF build refutes it, this
// module's transport swaps to XHR or loadHtml without touching callers. See
// cef-migration.md.
define(() => {
  const request = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`gwo_fetch: ${response.status} for ${url}`);
    }
    return response;
  };

  return {
    json: async (url) => (await request(url)).json(),
    text: async (url) => (await request(url)).text(),
  };
});
