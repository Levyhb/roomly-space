"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "rooms",
        "complement",
        {
          type: Sequelize.STRING(160),
          allowNull: true,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        "CREATE UNIQUE INDEX rooms_name_lower_unique ON rooms (lower(name))",
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        "DROP INDEX IF EXISTS rooms_name_lower_unique",
        { transaction },
      );
      await queryInterface.removeColumn("rooms", "complement", { transaction });
    });
  },
};
