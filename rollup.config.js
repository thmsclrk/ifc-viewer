import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/scripts/main.js",
  output: [
    {
      format: "esm",
      file: "build/js/bundle.js",
    },
  ],
  plugins: [resolve()],
};
