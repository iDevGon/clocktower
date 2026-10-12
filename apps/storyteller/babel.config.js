module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Replace import.meta.env with process.env for web compatibility
      // (zustand/middleware ESM build uses import.meta.env)
      function importMetaPlugin({ types: t }) {
        return {
          visitor: {
            MemberExpression(path) {
              if (
                t.isMetaProperty(path.node.object) &&
                t.isIdentifier(path.node.property, { name: 'env' })
              ) {
                path.replaceWith(
                  t.memberExpression(
                    t.identifier('process'),
                    t.identifier('env'),
                  ),
                );
              }
            },
          },
        };
      },
    ],
  };
};
