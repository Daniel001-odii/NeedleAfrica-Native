module.exports = function (api) {
  api.cache(true);

  function classFeaturesPreset() {
    return {
      plugins: [
        ["@babel/plugin-transform-class-properties", { loose: true }],
        ["@babel/plugin-transform-private-methods", { loose: true }],
        ["@babel/plugin-transform-private-property-in-object", { loose: true }],
      ],
    };
  }

  return {
    presets: [
      classFeaturesPreset,
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          decorators: {
            legacy: true,
          },
        },
      ],
    ],
    plugins: [
      "react-native-worklets/plugin",
    ],
  };
};