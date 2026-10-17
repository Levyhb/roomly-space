"use strict";

const users = [
  { id: 1, name: "Ana Costa", email: "ana@roomly.local", role: "USER" },
  { id: 2, name: "Bruno Lima", email: "bruno@roomly.local", role: "USER" },
  { id: 3, name: "Carla Souza", email: "carla@roomly.local", role: "ADMIN" },
];

const rooms = [
  { id: 1, name: "Ipê", capacity: 4 },
  { id: 2, name: "Araucária", capacity: 6 },
  { id: 3, name: "Jatobá", capacity: 8 },
  { id: 4, name: "Pau-Brasil", capacity: 10 },
  { id: 5, name: "Jacarandá", capacity: 14 },
];

const resources = [
  { id: 1, code: "projector", name: "Projetor" },
  { id: 2, code: "whiteboard", name: "Quadro branco" },
  { id: 3, code: "video", name: "Videoconferência" },
  { id: 4, code: "tv", name: "TV" },
];

const roomResources = [
  { room_id: 1, resource_id: 2 },
  { room_id: 2, resource_id: 1 },
  { room_id: 2, resource_id: 2 },
  { room_id: 3, resource_id: 3 },
  { room_id: 3, resource_id: 4 },
  { room_id: 4, resource_id: 1 },
  { room_id: 4, resource_id: 3 },
  { room_id: 5, resource_id: 1 },
  { room_id: 5, resource_id: 2 },
  { room_id: 5, resource_id: 3 },
];

async function insertIfMissing(sequelize, table, columns, row, transaction) {
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((column) => row[column]);
  await sequelize.query(
    `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    { replacements: values, transaction },
  );
}

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const user of users) {
        await insertIfMissing(
          queryInterface.sequelize,
          "users",
          ["id", "name", "email", "role"],
          user,
          transaction,
        );
      }

      for (const room of rooms) {
        await insertIfMissing(
          queryInterface.sequelize,
          "rooms",
          ["id", "name", "capacity"],
          room,
          transaction,
        );
      }

      for (const resource of resources) {
        await insertIfMissing(
          queryInterface.sequelize,
          "resources",
          ["id", "code", "name"],
          resource,
          transaction,
        );
      }

      for (const link of roomResources) {
        await insertIfMissing(
          queryInterface.sequelize,
          "room_resources",
          ["room_id", "resource_id"],
          link,
          transaction,
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "DELETE FROM room_resources WHERE room_id IN (1, 2, 3, 4, 5)",
        { transaction },
      );
      await queryInterface.sequelize.query(
        "DELETE FROM resources WHERE id IN (1, 2, 3, 4)",
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        "DELETE FROM rooms WHERE id IN (1, 2, 3, 4, 5)",
        {
          transaction,
        },
      );
      await queryInterface.sequelize.query(
        "DELETE FROM users WHERE id IN (1, 2, 3)",
        {
          transaction,
        },
      );
    });
  },
};
