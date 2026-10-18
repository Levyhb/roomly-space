"use strict";

const rooms = [
  {
    name: "Ipê",
    address: "Torre A · 2º andar",
    description: "Ambiente compacto para conversas e alinhamentos rápidos.",
  },
  {
    name: "Araucária",
    address: "Torre A · 3º andar",
    description: "Espaço versátil para reuniões de equipe e apresentações.",
  },
  {
    name: "Jatobá",
    address: "Torre B · 1º andar",
    description: "Sala preparada para encontros híbridos e colaboração.",
  },
  {
    name: "Pau-Brasil",
    address: "Torre B · 2º andar",
    description: "Ambiente amplo e acessível para workshops e reuniões.",
  },
  {
    name: "Jacarandá",
    address: "Torre B · 3º andar",
    description: "Sala maior para apresentações e encontros de times.",
  },
];

const resources = [
  { code: "coffee", name: "Café" },
  { code: "accessibility", name: "Acessibilidade" },
];

const links = [
  ["Ipê", "coffee"],
  ["Jatobá", "coffee"],
  ["Jacarandá", "coffee"],
  ["Araucária", "accessibility"],
  ["Pau-Brasil", "accessibility"],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const room of rooms) {
        await queryInterface.sequelize.query(
          "UPDATE rooms SET address = ? WHERE name = ? AND (address IS NULL OR TRIM(address) = '' OR address = 'Unidade principal')",
          {
            replacements: [room.address, room.name],
            transaction,
          },
        );
        await queryInterface.sequelize.query(
          "UPDATE rooms SET description = ? WHERE name = ? AND (description IS NULL OR TRIM(description) = '' OR description = 'Sala de reunião')",
          {
            replacements: [room.description, room.name],
            transaction,
          },
        );
      }

      for (const resource of resources) {
        await queryInterface.sequelize.query(
          "INSERT OR IGNORE INTO resources (code, name) VALUES (?, ?)",
          { replacements: [resource.code, resource.name], transaction },
        );
      }

      for (const [roomName, resourceCode] of links) {
        await queryInterface.sequelize.query(
          "INSERT OR IGNORE INTO room_resources (room_id, resource_id) SELECT rooms.id, resources.id FROM rooms CROSS JOIN resources WHERE rooms.name = ? AND resources.code = ?",
          { replacements: [roomName, resourceCode], transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "DELETE FROM room_resources WHERE resource_id IN (SELECT id FROM resources WHERE code IN ('coffee', 'accessibility'))",
        { transaction },
      );
      await queryInterface.sequelize.query(
        "DELETE FROM resources WHERE code IN ('coffee', 'accessibility')",
        { transaction },
      );
    });
  },
};
