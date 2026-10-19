"use strict";

const roomDurations = [
  ["Ipê", 60],
  ["Araucária", 120],
  ["Jatobá", 180],
  ["Pau-Brasil", 360],
  ["Jacarandá", 480],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const [roomName, duration] of roomDurations) {
        await queryInterface.sequelize.query(
          "UPDATE rooms SET max_reservation_duration_minutes = ? WHERE name = ?",
          { replacements: [duration, roomName], transaction },
        );
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE rooms SET max_reservation_duration_minutes = 240 WHERE name IN ('Ipê', 'Araucária', 'Jatobá', 'Pau-Brasil', 'Jacarandá')",
    );
  },
};
