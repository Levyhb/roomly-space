"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "rooms",
      "max_reservation_duration_minutes",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 240,
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn(
      "rooms",
      "max_reservation_duration_minutes",
    );
  },
};
