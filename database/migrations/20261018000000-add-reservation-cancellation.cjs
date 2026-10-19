"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("reservations", "canceled_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex("reservations", [
      "user_id",
      "canceled_at",
      "ends_at",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("reservations", [
      "user_id",
      "canceled_at",
      "ends_at",
    ]);
    await queryInterface.removeColumn("reservations", "canceled_at");
  },
};
