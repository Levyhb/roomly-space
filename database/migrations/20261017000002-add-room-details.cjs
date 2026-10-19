"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("rooms", "address", {
      type: Sequelize.STRING(160),
      allowNull: true,
    });
    await queryInterface.addColumn("rooms", "description", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("rooms", "image_url", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      "UPDATE rooms SET address = 'Unidade principal' WHERE address IS NULL",
    );
    await queryInterface.sequelize.query(
      "UPDATE rooms SET description = 'Sala de reunião' WHERE description IS NULL",
    );

    await queryInterface.changeColumn("rooms", "address", {
      type: Sequelize.STRING(160),
      allowNull: false,
    });
    await queryInterface.changeColumn("rooms", "description", {
      type: Sequelize.TEXT,
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("rooms", "image_url");
    await queryInterface.removeColumn("rooms", "description");
    await queryInterface.removeColumn("rooms", "address");
  },
};
