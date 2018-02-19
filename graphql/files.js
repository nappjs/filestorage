module.exports = () => {
  return {
    Query: {
      files: (obj, args, ctx) => {
        return ctx.context.getObjects("File");
      }
    }
  };
};
