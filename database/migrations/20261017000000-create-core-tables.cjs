"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      role: { type: Sequelize.STRING(10), allowNull: false },
    });

    await queryInterface.createTable("rooms", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      capacity: { type: Sequelize.INTEGER, allowNull: false },
    });

    await queryInterface.createTable("resources", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(120), allowNull: false },
    });

    await queryInterface.createTable("room_resources", {
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "rooms", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      resource_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "resources", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
    });

    await queryInterface.createTable("reservations", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      room_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "rooms", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      starts_at: { type: Sequelize.DATE, allowNull: false },
      ends_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("room_resources", ["resource_id"]);
    await queryInterface.addIndex("reservations", [
      "room_id",
      "starts_at",
      "ends_at",
    ]);
    await queryInterface.addIndex("reservations", ["user_id", "starts_at"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reservations");
    await queryInterface.dropTable("room_resources");
    await queryInterface.dropTable("resources");
    await queryInterface.dropTable("rooms");
    await queryInterface.dropTable("users");
  },
};
