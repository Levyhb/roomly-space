module.exports = {
  development: {
    dialect: "sqlite",
    storage: process.env.DB_STORAGE_DEVELOPMENT || "./development.sqlite",
    logging: false,
  },
  test: {
    dialect: "sqlite",
    storage: process.env.DB_STORAGE_TEST || "./test.sqlite",
    logging: false,
  },
  production: {
    dialect: "sqlite",
    storage: process.env.DB_STORAGE_PRODUCTION || "./production.sqlite",
    logging: false,
  },
};
